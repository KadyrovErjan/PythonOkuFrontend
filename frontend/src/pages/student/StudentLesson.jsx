import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StudentSidebar from '../../components/StudentSidebar'
import LessonHomeworkTrainer from '../../components/LessonHomeworkTrainer'
import api from '../../api/axios'

const WATCH_REQUIRED_RATIO = 0.95
const WATCH_SYNC_MS = 8000
const WATCH_TICK_MS = 1000
const MAX_NATURAL_VIDEO_DELTA = 2.25
const MAX_COUNTED_PLAYBACK_RATE = 1.25

let youtubeApiPromise = null

function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)
  return match ? match[1] : null
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') previousReady()
      resolve(window.YT)
    }

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    if (existingScript) return

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => reject(new Error('YouTube API не загрузился'))
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

function normaliseRanges(ranges, durationSeconds) {
  if (!Array.isArray(ranges) || durationSeconds <= 0) return []

  const cleaned = ranges
    .filter(item => Array.isArray(item) && item.length === 2)
    .map(([start, end]) => [
      Math.max(0, Math.min(durationSeconds, Math.floor(Number(start) || 0))),
      Math.max(0, Math.min(durationSeconds, Math.ceil(Number(end) || 0))),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])

  const merged = []
  cleaned.forEach(([start, end]) => {
    const last = merged[merged.length - 1]
    if (!last || start > last[1]) merged.push([start, end])
    else last[1] = Math.max(last[1], end)
  })

  return merged
}

function rangesDuration(ranges) {
  return ranges.reduce((sum, [start, end]) => sum + Math.max(0, end - start), 0)
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                      ${isUser ? 'bg-purple-500' : 'bg-slate-600'}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${isUser ? 'bg-purple-500 text-white rounded-tr-sm'
                               : 'bg-slate-700/80 text-slate-200 rounded-tl-sm'}`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function StudentLesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [lessonTasks, setLessonTasks] = useState([])
  const [quizResults, setQuizResults] = useState({})
  const [completed, setCompleted] = useState(false)
  const [xpMsg, setXpMsg] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('lesson')
  const [watchInfo, setWatchInfo] = useState({
    watchedSeconds: 0,
    durationSeconds: 0,
    requiredSeconds: 0,
    percent: 0,
    playerReady: false,
    playing: false,
    syncing: false,
    message: 'Запусти видео — прогресс пойдёт только во время просмотра.',
    error: '',
  })

  const chatEndRef = useRef(null)
  const playerHostRef = useRef(null)
  const playerRef = useRef(null)
  const lessonDurationFallbackRef = useRef(0)
  const watchRef = useRef({
    ranges: [],
    duration: 0,
    lastTime: null,
    lastTickAt: null,
    lastSyncAt: 0,
    playing: false,
    completed: false,
    syncInFlight: false,
  })

  const resetWatch = useCallback(() => {
    watchRef.current = {
      ranges: [],
      duration: 0,
      lastTime: null,
      lastTickAt: null,
      lastSyncAt: 0,
      playing: false,
      completed: false,
      syncInFlight: false,
    }
    setWatchInfo({
      watchedSeconds: 0,
      durationSeconds: 0,
      requiredSeconds: 0,
      percent: 0,
      playerReady: false,
      playing: false,
      syncing: false,
      message: 'Запусти видео — прогресс пойдёт только во время просмотра.',
      error: '',
    })
  }, [])

  const updateWatchInfoFromRef = useCallback((patch = {}) => {
    const duration = Math.max(0, Math.ceil(watchRef.current.duration || lessonDurationFallbackRef.current || 0))
    const watched = Math.min(duration || 0, rangesDuration(watchRef.current.ranges))
    const required = duration ? Math.ceil(duration * WATCH_REQUIRED_RATIO) : 0
    const percent = duration ? Math.min(100, Math.round((watched / duration) * 100)) : 0

    setWatchInfo(current => ({
      ...current,
      durationSeconds: duration,
      watchedSeconds: watched,
      requiredSeconds: required,
      percent,
      ...patch,
    }))
  }, [])

  const syncWatchProgress = useCallback(async ({ force = false, ended = false } = {}) => {
    const duration = Math.max(0, Math.ceil(watchRef.current.duration || lessonDurationFallbackRef.current || 0))
    const watchedSeconds = Math.min(duration || 0, rangesDuration(watchRef.current.ranges))

    if (!duration) return
    if (!force && !ended && watchedSeconds <= 0) return
    if (!force && !ended && Date.now() - watchRef.current.lastSyncAt < WATCH_SYNC_MS) return
    if (watchRef.current.syncInFlight) return

    watchRef.current.syncInFlight = true
    setWatchInfo(current => ({ ...current, syncing: true, error: '' }))

    try {
      const currentTime = Number(playerRef.current?.getCurrentTime?.() || 0)
      const response = await api.post(`lessons/${id}/complete/`, {
        watched_ranges: watchRef.current.ranges,
        watched_seconds: watchedSeconds,
        video_duration_seconds: duration,
        current_time: currentTime,
        ended,
      })
      const data = response.data
      const serverDuration = Number(data.video_duration_seconds || duration)
      const serverRanges = Array.isArray(data.watched_ranges)
        ? normaliseRanges(data.watched_ranges, serverDuration)
        : watchRef.current.ranges

      watchRef.current.duration = serverDuration
      watchRef.current.ranges = serverRanges
      watchRef.current.lastSyncAt = Date.now()

      const serverWatched = Number(data.watched_seconds ?? rangesDuration(serverRanges))
      const serverRequired = Number(data.required_seconds || Math.ceil(serverDuration * WATCH_REQUIRED_RATIO))
      const serverPercent = Number(data.watch_percent ?? (serverDuration ? Math.round((serverWatched / serverDuration) * 100) : 0))

      setWatchInfo(current => ({
        ...current,
        watchedSeconds: serverWatched,
        durationSeconds: serverDuration,
        requiredSeconds: serverRequired,
        percent: Math.min(100, serverPercent),
        syncing: false,
        message: data.completed
          ? 'Урок засчитан. Отличный просмотр!'
          : current.message || 'Прогресс просмотра сохранён.',
        error: '',
      }))

      if (data.completed) {
        watchRef.current.completed = true
        setCompleted(true)
      }

      if (data.xp_gained > 0) {
        setUser(current => ({ ...current, xp: data.total_xp, streak: data.streak ?? current?.streak }))
        setXpMsg(data.message || `+${data.xp_gained} XP за просмотр урока!`)
        setTimeout(() => setXpMsg(''), 3000)
      } else if (data.streak_updated) {
        setUser(current => ({ ...current, streak: data.streak ?? current?.streak }))
      }
    } catch {
      setWatchInfo(current => ({
        ...current,
        syncing: false,
        error: 'Не удалось сохранить прогресс просмотра. Проверь сервер и попробуй ещё раз.',
      }))
    } finally {
      watchRef.current.syncInFlight = false
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      resetWatch()
      setCompleted(false)
      setLoading(true)
      try {
        const [lessonResponse, progressResponse, userResponse, quizResponse, chatResponse, taskResponse] = await Promise.all([
          api.get(`lessons/${id}/`),
          api.get('progress/'),
          api.get('users/me/'),
          api.get(`lessons/${id}/quizzes/`),
          api.get(`ai/chat/?lesson_id=${id}`),
          api.get(`homework/tasks/?lesson=${id}`),
        ])

        const lessonData = lessonResponse.data
        const progress = progressResponse.data.find(item => item.lesson === Number(id))
        const duration = Number(progress?.video_duration_seconds || (lessonData.duration_minutes || 0) * 60 || 0)
        const ranges = normaliseRanges(progress?.watched_ranges || [], duration)

        watchRef.current.duration = duration
        watchRef.current.ranges = ranges
        watchRef.current.completed = Boolean(progress?.completed)
        lessonDurationFallbackRef.current = (lessonData.duration_minutes || 0) * 60

        setLesson(lessonData)
        setUser(userResponse.data)
        setQuizzes(quizResponse.data)
        setLessonTasks(taskResponse.data || [])
        setMessages(chatResponse.data)
        setCompleted(Boolean(progress?.completed))

        const watchedSeconds = Number(progress?.watched_seconds ?? rangesDuration(ranges))
        setWatchInfo(current => ({
          ...current,
          watchedSeconds,
          durationSeconds: duration,
          requiredSeconds: duration ? Math.ceil(duration * WATCH_REQUIRED_RATIO) : 0,
          percent: duration ? Math.min(100, Math.round((watchedSeconds / duration) * 100)) : 0,
          message: progress?.completed
            ? 'Урок уже засчитан.'
            : 'Запусти видео — прогресс пойдёт только во время просмотра.',
        }))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, resetWatch])

  useEffect(() => {
    lessonDurationFallbackRef.current = (lesson?.duration_minutes || 0) * 60
  }, [lesson])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAiLoading(true)
    try {
      const response = await api.post('ai/chat/', { message: input, lesson_id: Number(id) })
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Попробуй ещё раз.' }])
    } finally {
      setAiLoading(false)
    }
  }

  const answerQuiz = async (quizId, answer) => {
    if (quizResults[quizId]) return
    try {
      const response = await api.post(`lessons/${id}/quiz/${quizId}/answer/`, { answer })
      setQuizResults(prev => ({ ...prev, [quizId]: response.data }))
      if (response.data.streak_updated) {
        setUser(current => ({ ...current, streak: response.data.streak ?? current?.streak }))
      }
      if (response.data.xp_gained > 0) {
        setUser(current => ({
          ...current,
          xp: response.data.total_xp,
          streak: response.data.streak ?? current?.streak,
        }))
        setXpMsg(`+${response.data.xp_gained} XP за тест!`)
        setTimeout(() => setXpMsg(''), 3000)
      }
    } catch (error) {
      const data = error.response?.data
      setQuizResults(prev => ({
        ...prev,
        [quizId]: data?.correct || data?.answer
          ? data
          : {
              answer,
              error: data?.error || 'Не удалось проверить ответ. Попробуй ещё раз.',
            },
      }))
    }
  }

  const ytId = getYouTubeId(lesson?.youtube_url)

  useEffect(() => {
    if (activeTab !== 'lesson' || !ytId || !playerHostRef.current) return undefined

    let cancelled = false

    loadYouTubeApi()
      .then(YT => {
        if (cancelled || !playerHostRef.current) return

        playerRef.current?.destroy?.()
        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId: ytId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: event => {
              const duration = Math.ceil(Number(event.target.getDuration?.() || 0))
              if (duration > 0) watchRef.current.duration = duration
              updateWatchInfoFromRef({
                playerReady: true,
                message: completed
                  ? 'Урок уже засчитан.'
                  : 'Нажми Play. Засчитывается только реальное воспроизведение без перемотки.',
              })
              syncWatchProgress({ force: true })
            },
            onStateChange: event => {
              const state = event.data
              const isPlaying = state === YT.PlayerState.PLAYING
              watchRef.current.playing = isPlaying

              if (isPlaying) {
                watchRef.current.lastTime = Number(event.target.getCurrentTime?.() || 0)
                watchRef.current.lastTickAt = Date.now()
                updateWatchInfoFromRef({
                  playing: true,
                  message: 'Видео воспроизводится — прогресс засчитывается.',
                })
                return
              }

              watchRef.current.lastTime = null
              watchRef.current.lastTickAt = null

              if (state === YT.PlayerState.PAUSED) {
                updateWatchInfoFromRef({
                  playing: false,
                  message: 'Пауза. Прогресс остановлен.',
                })
                syncWatchProgress({ force: true })
              } else if (state === YT.PlayerState.ENDED) {
                const duration = Math.ceil(Number(event.target.getDuration?.() || watchRef.current.duration || 0))
                if (duration > 0) {
                  watchRef.current.duration = duration
                  const lastSecond = Math.max(0, duration - 1)
                  watchRef.current.ranges = normaliseRanges([...watchRef.current.ranges, [lastSecond, duration]], duration)
                }
                updateWatchInfoFromRef({
                  playing: false,
                  message: 'Видео досмотрено. Проверяю прогресс…',
                })
                syncWatchProgress({ force: true, ended: true })
              } else {
                updateWatchInfoFromRef({
                  playing: false,
                  message: 'Прогресс идёт только когда видео играет.',
                })
              }
            },
          },
        })
      })
      .catch(() => {
        setWatchInfo(current => ({
          ...current,
          error: 'YouTube-плеер не загрузился. Обнови страницу или проверь подключение.',
        }))
      })

    return () => {
      cancelled = true
      syncWatchProgress({ force: true })
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [activeTab, completed, syncWatchProgress, updateWatchInfoFromRef, ytId])

  useEffect(() => {
    if (activeTab !== 'lesson' || !ytId || completed) return undefined

    const timer = window.setInterval(() => {
      const player = playerRef.current
      const watch = watchRef.current
      if (!player || !watch.playing || watch.completed) return

      const now = Date.now()
      const currentTime = Number(player.getCurrentTime?.() || 0)
      const duration = Math.ceil(Number(player.getDuration?.() || watch.duration || lessonDurationFallbackRef.current || 0))
      const playbackRate = Number(player.getPlaybackRate?.() || 1)

      if (duration > 0 && duration !== watch.duration) {
        watch.duration = duration
        watch.ranges = normaliseRanges(watch.ranges, duration)
      }

      const previousTime = watch.lastTime
      const previousTick = watch.lastTickAt || now
      const realDelta = Math.max(0, Math.min((now - previousTick) / 1000, 2.5))
      const videoDelta = previousTime === null ? 0 : currentTime - previousTime
      const naturalLimit = Math.max(MAX_NATURAL_VIDEO_DELTA, realDelta * 1.7)

      if (
        previousTime !== null &&
        videoDelta > 0 &&
        videoDelta <= naturalLimit &&
        playbackRate <= MAX_COUNTED_PLAYBACK_RATE &&
        duration > 0
      ) {
        const start = Math.floor(previousTime)
        const end = Math.min(duration, Math.ceil(currentTime))
        if (end > start) {
          watch.ranges = normaliseRanges([...watch.ranges, [start, end]], duration)
          updateWatchInfoFromRef({
            playing: true,
            message: 'Видео воспроизводится — прогресс засчитывается.',
          })
        }
      } else if (videoDelta > naturalLimit || videoDelta < -0.5) {
        updateWatchInfoFromRef({
          playing: true,
          message: 'Перемотка не засчиталась. Смотри видео обычным ходом.',
        })
      } else if (playbackRate > MAX_COUNTED_PLAYBACK_RATE) {
        updateWatchInfoFromRef({
          playing: true,
          message: 'Слишком высокая скорость. Для зачёта включи 1x или 1.25x.',
        })
      }

      watch.lastTime = currentTime
      watch.lastTickAt = now

      const watched = rangesDuration(watch.ranges)
      const required = duration ? Math.ceil(duration * WATCH_REQUIRED_RATIO) : 0
      if (watched >= required && currentTime >= Math.max(required, duration - 12)) {
        syncWatchProgress({ force: true, ended: true })
      } else {
        syncWatchProgress()
      }
    }, WATCH_TICK_MS)

    return () => window.clearInterval(timer)
  }, [activeTab, completed, syncWatchProgress, updateWatchInfoFromRef, ytId])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        watchRef.current.playing = false
        syncWatchProgress({ force: true })
        setWatchInfo(current => ({
          ...current,
          playing: false,
          message: 'Вкладка скрыта. Прогресс остановлен.',
        }))
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [syncWatchProgress])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-purple-400 animate-pulse">Загрузка урока...</div>
      </div>
    )
  }

  const tabs = ['lesson', 'quiz', 'homework', 'ai']
  const tabLabels = {
    lesson: '📖 Урок',
    quiz: `📝 Тест (${quizzes.length})`,
    homework: `💻 ДЗ (${lessonTasks.length})`,
    ai: '🤖 ИИ',
  }
  const watchedForGoal = Math.min(watchInfo.watchedSeconds, watchInfo.requiredSeconds || watchInfo.watchedSeconds)
  const goalPercent = watchInfo.requiredSeconds
    ? Math.min(100, Math.round((watchedForGoal / watchInfo.requiredSeconds) * 100))
    : watchInfo.percent

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} />
      <main className="ml-56 flex-1 flex flex-col">
        {xpMsg && (
          <div className="fixed top-6 right-6 bg-yellow-500 text-slate-900 font-bold
                          px-5 py-3 rounded-xl shadow-xl z-50 animate-bounce">
            ⚡ {xpMsg}
          </div>
        )}

        <div className="border-b border-slate-800 px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-2"
          >
            ← Назад
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{lesson?.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-1">
                {lesson?.duration_minutes > 0 && <span>⏱ {lesson.duration_minutes} мин</span>}
                <span className="text-yellow-400">+{lesson?.xp_reward} XP</span>
                {completed && <span className="text-green-400">✅ Выполнено</span>}
              </div>
            </div>
            <div className={`lesson-auto-complete-pill ${completed ? 'done' : ''}`}>
              {completed ? '✅ Урок засчитан' : '🎬 Завершится после просмотра'}
            </div>
          </div>
        </div>

        <div className="flex gap-1 px-8 py-3 border-b border-slate-800 bg-slate-900/50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'lesson' && (
            <div className="max-w-4xl">
              {ytId ? (
                <>
                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl bg-black">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <div className="absolute inset-0 w-full h-full">
                        <div ref={playerHostRef} className="w-full h-full" />
                      </div>
                    </div>
                  </div>

                  <div className={`lesson-watch-card ${completed ? 'done' : ''}`}>
                    <div className="lesson-watch-head">
                      <div>
                        <span>{completed ? 'Просмотр завершён' : 'Прогресс просмотра'}</span>
                        <strong>{completed ? '100%' : `${goalPercent}% к зачёту`}</strong>
                      </div>
                      <small>
                        {watchInfo.syncing ? 'Сохраняю…' : `${formatTime(watchInfo.watchedSeconds)} / ${formatTime(watchInfo.requiredSeconds)} для XP`}
                      </small>
                    </div>
                    <div className="lesson-watch-track">
                      <i style={{ width: `${completed ? 100 : goalPercent}%` }} />
                    </div>
                    <div className="lesson-watch-note">
                      <span>{watchInfo.playing ? '▶' : completed ? '✅' : '⏸'}</span>
                      <p>{watchInfo.error || watchInfo.message}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-4">
                  <h2 className="text-white font-semibold mb-2 text-sm">Видео не добавлено</h2>
                  <p className="text-slate-400 text-sm">
                    Чтобы урок засчитывался автоматически, добавь ссылку YouTube в настройках урока.
                  </p>
                </div>
              )}

              {lesson?.description && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-4">
                  <h2 className="text-white font-semibold mb-2 text-sm">📝 Описание</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{lesson.description}</p>
                </div>
              )}
              {lesson?.content && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                  <h2 className="text-white font-semibold mb-3 text-sm">📖 Материал</h2>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {lesson.content}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="max-w-2xl space-y-6">
              {quizzes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-slate-400">Тестов для этого урока пока нет</p>
                </div>
              ) : quizzes.map((quiz, index) => {
                const result = quizResults[quiz.id]
                return (
                  <div key={quiz.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400
                                      flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <h3 className="text-white font-medium">{quiz.question}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {['a', 'b', 'c', 'd'].map(option => {
                        const text = quiz[`option_${option}`]
                        if (!text) return null
                        const isSelected = result?.answer === option
                        const isCorrect = result?.correct === option
                        let cls = 'border-slate-600/50 text-slate-300 hover:border-purple-500/50 hover:text-white cursor-pointer'
                        if (result) {
                          if (isCorrect) cls = 'border-green-500/50 bg-green-500/10 text-green-400 cursor-default'
                          else if (isSelected) cls = 'border-red-500/50 bg-red-500/10 text-red-400 cursor-default'
                          else cls = 'border-slate-700/30 text-slate-500 cursor-default opacity-50'
                        }
                        return (
                          <button
                            key={option}
                            onClick={() => !result && answerQuiz(quiz.id, option)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${cls}`}
                          >
                            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {option.toUpperCase()}
                            </span>
                            {text}
                          </button>
                        )
                      })}
                    </div>
                    {result && (
                      <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                        result.error
                          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                          : result.is_correct
                            ? 'border-green-500/30 bg-green-500/10 text-green-300'
                            : 'border-red-500/30 bg-red-500/10 text-red-300'
                      }`}>
                        {result.error
                          ? result.error
                          : result.is_correct
                            ? `✅ Правильно! ${result.xp_gained > 0 ? `+${result.xp_gained} XP` : 'Ответ уже был засчитан'}`
                            : `❌ Неправильно. Твой ответ: ${result.answer?.toUpperCase() || '—'}. Правильный ответ: ${result.correct?.toUpperCase() || '—'}`}
                        {result.already && !result.error && (
                          <div className="mt-1 text-xs opacity-80">
                            Ты уже отвечал на этот вопрос, поэтому XP повторно не начисляется.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'homework' && (
            <LessonHomeworkTrainer
              key={id}
              initialTasks={lessonTasks}
              onXpEarned={(totalXp, gainedXp, streak) => {
                setUser(current => ({ ...current, xp: totalXp, streak: streak ?? current?.streak }))
                if (gainedXp > 0) {
                  setXpMsg(`+${gainedXp} XP за задачу!`)
                  setTimeout(() => setXpMsg(''), 3000)
                }
              }}
            />
          )}

          {activeTab === 'ai' && (
            <div className="max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-slate-400 text-sm">
                      Привет! Задай вопрос по уроку — я помогу разобраться.
                    </p>
                  </div>
                )}
                {messages.map((msg, index) => <ChatBubble key={index} msg={msg} />)}
                {aiLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm">🤖</div>
                    <div className="bg-slate-700/80 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(delay => (
                          <span
                            key={delay}
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && !event.shiftKey && sendMessage()}
                  placeholder="Задай вопрос по уроку..."
                  className="flex-1 bg-slate-800 border border-slate-700/50 text-white
                             placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none
                             focus:border-purple-500 transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={aiLoading || !input.trim()}
                  className="w-11 h-11 bg-purple-500 hover:bg-purple-400 disabled:bg-slate-700
                             rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                >
                  {aiLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="text-white">↑</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
