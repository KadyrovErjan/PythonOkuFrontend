import { useEffect, useMemo, useState } from 'react'
import TeacherSidebar from '../../components/TeacherSidebar'
import Icon from '../../components/Icon'
import api from '../../api/axios'

const emptyCourse = { title: '', description: '', is_published: false }

const emptyLesson = (courseId = '') => ({
  id: null,
  course: courseId ? String(courseId) : '',
  title: '',
  description: '',
  youtube_url: '',
  content: '',
  order: 0,
  xp_reward: 15,
  duration_minutes: 0,
  is_published: false,
})

const emptyQuiz = (lessonId = '') => ({
  id: null,
  lesson: lessonId ? String(lessonId) : '',
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct: 'a',
  xp_reward: 5,
})

const emptyTask = (lessonId = '') => ({
  id: null,
  lesson: lessonId ? String(lessonId) : '',
  title_ru: '',
  title_kg: '',
  description_ru: '',
  description_kg: '',
  starter_code: '# РќР°РїРёС€Рё СЂРµС€РµРЅРёРµ Р·РґРµСЃСЊ\n',
  sample_input: '',
  sample_output: '',
  tests: [{ input: '', expected: '', hidden: false }],
  order: 0,
  xp_reward: 10,
  is_published: true,
})

function asNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function toCourseDraft(course) {
  return {
    title: course?.title ?? '',
    description: course?.description ?? '',
    is_published: Boolean(course?.is_published),
  }
}

function toLessonDraft(lesson, courseId = '') {
  return {
    id: lesson?.id ?? null,
    course: String(lesson?.course ?? courseId ?? ''),
    title: lesson?.title ?? '',
    description: lesson?.description ?? '',
    youtube_url: lesson?.youtube_url ?? '',
    content: lesson?.content ?? '',
    order: asNumber(lesson?.order),
    xp_reward: asNumber(lesson?.xp_reward, 15),
    duration_minutes: asNumber(lesson?.duration_minutes),
    is_published: Boolean(lesson?.is_published),
  }
}

function toQuizDraft(quiz, lessonId = '') {
  return {
    id: quiz?.id ?? null,
    lesson: String(quiz?.lesson ?? lessonId ?? ''),
    question: quiz?.question ?? '',
    option_a: quiz?.option_a ?? '',
    option_b: quiz?.option_b ?? '',
    option_c: quiz?.option_c ?? '',
    option_d: quiz?.option_d ?? '',
    correct: quiz?.correct ?? 'a',
    xp_reward: asNumber(quiz?.xp_reward, 5),
  }
}

function normaliseTests(tests) {
  if (!Array.isArray(tests) || tests.length === 0) return [{ input: '', expected: '', hidden: false }]
  return tests.map(test => ({
    input: test?.input ?? '',
    expected: test?.expected ?? '',
    hidden: Boolean(test?.hidden),
  }))
}

function toTaskDraft(task, lessonId = '') {
  return {
    id: task?.id ?? null,
    lesson: String(task?.lesson ?? lessonId ?? ''),
    title_ru: task?.title_ru ?? '',
    title_kg: task?.title_kg ?? '',
    description_ru: task?.description_ru ?? '',
    description_kg: task?.description_kg ?? '',
    starter_code: task?.starter_code ?? '# РќР°РїРёС€Рё СЂРµС€РµРЅРёРµ Р·РґРµСЃСЊ\n',
    sample_input: task?.sample_input ?? '',
    sample_output: task?.sample_output ?? '',
    tests: normaliseTests(task?.tests),
    order: asNumber(task?.order),
    xp_reward: asNumber(task?.xp_reward, 10),
    is_published: task?.is_published ?? true,
  }
}

function StatusPill({ published }) {
  return (
    <span className={`manager-status ${published ? 'published' : 'draft'}`}>
      <span />
      {published ? 'РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ' : 'Р§РµСЂРЅРѕРІРёРє'}
    </span>
  )
}

function EmptyHint({ title, text }) {
  return (
    <div className="manager-empty">
      <div className="manager-empty-icon"><Icon name="sparkles" size={22} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`manager-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function PanelTitle({ eyebrow, title, children }) {
  return (
    <div className="manager-panel-head">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children && <div className="manager-panel-actions">{children}</div>}
    </div>
  )
}

export default function TeacherCourses() {
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [tasks, setTasks] = useState([])

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [courseDraft, setCourseDraft] = useState(emptyCourse)
  const [lessonDraft, setLessonDraft] = useState(emptyLesson())
  const [quizDraft, setQuizDraft] = useState(emptyQuiz())
  const [taskDraft, setTaskDraft] = useState(emptyTask())

  const [activePanel, setActivePanel] = useState('course')
  const [courseQuery, setCourseQuery] = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingLesson, setLoadingLesson] = useState(false)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')

  const selectedCourse = useMemo(
    () => courses.find(course => String(course.id) === String(selectedCourseId)),
    [courses, selectedCourseId],
  )

  const selectedLesson = useMemo(
    () => lessons.find(lesson => String(lesson.id) === String(selectedLessonId)),
    [lessons, selectedLessonId],
  )

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase()
    if (!query) return courses
    return courses.filter(course => `${course.title ?? ''} ${course.description ?? ''}`.toLowerCase().includes(query))
  }, [courses, courseQuery])

  const stats = [
    { label: 'РљСѓСЂСЃРѕРІ', value: courses.length, caption: 'РІ РїСЂРѕРіСЂР°РјРјРµ' },
    { label: 'РЈСЂРѕРєРѕРІ', value: lessons.length, caption: selectedCourse ? selectedCourse.title : 'РІС‹Р±РµСЂРёС‚Рµ РєСѓСЂСЃ' },
    { label: 'РўРµСЃС‚РѕРІ', value: quizzes.length, caption: selectedLesson ? selectedLesson.title : 'РІС‹Р±РµСЂРёС‚Рµ СѓСЂРѕРє' },
    { label: 'Р—Р°РґР°С‡', value: tasks.length, caption: 'Р°РІС‚РѕРїСЂРѕРІРµСЂРєР°' },
  ]

  const tabs = [
    { id: 'course', label: 'РљСѓСЂСЃ', count: selectedCourseId ? 1 : 0 },
    { id: 'lesson', label: 'РЈСЂРѕРє', count: lessons.length },
    { id: 'quiz', label: 'РўРµСЃС‚С‹', count: quizzes.length, disabled: !selectedLessonId },
    { id: 'task', label: 'Р—Р°РґР°С‡Рё', count: tasks.length, disabled: !selectedLessonId },
  ]

  useEffect(() => {
    let active = true

    async function boot() {
      setLoading(true)
      try {
        const [courseResponse, notificationResponse] = await Promise.all([
          api.get('courses/'),
          api.get('notifications/?unread=1').catch(() => ({ data: [] })),
        ])

        if (!active) return

        const loadedCourses = Array.isArray(courseResponse.data) ? courseResponse.data : []
        setCourses(loadedCourses)
        setNotifCount(Array.isArray(notificationResponse.data) ? notificationResponse.data.length : 0)

        const firstCourse = loadedCourses[0]
        if (!firstCourse) {
          newCourse(false)
          return
        }

        setSelectedCourseId(String(firstCourse.id))
        setCourseDraft(toCourseDraft(firstCourse))

        const lessonsResponse = await api.get(`courses/${firstCourse.id}/lessons/`)
        if (!active) return

        const loadedLessons = Array.isArray(lessonsResponse.data) ? lessonsResponse.data : []
        setLessons(loadedLessons)

        const firstLesson = loadedLessons[0]
        if (firstLesson) {
          await loadLessonData(firstLesson.id, firstCourse.id)
        } else {
          resetLessonState(firstCourse.id)
        }
      } catch {
        if (active) setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєСѓСЂСЃС‹. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє API.')
      } finally {
        if (active) setLoading(false)
      }
    }

    boot()
    return () => {
      active = false
    }
    // Initial course boot intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetLessonState(courseId = '') {
    setSelectedLessonId('')
    setLessonDraft(emptyLesson(courseId))
    setQuizzes([])
    setTasks([])
    setQuizDraft(emptyQuiz())
    setTaskDraft(emptyTask())
  }

  async function refreshCourses(preferredCourseId = selectedCourseId) {
    const response = await api.get('courses/')
    const loadedCourses = Array.isArray(response.data) ? response.data : []
    setCourses(loadedCourses)
    const preferred = loadedCourses.find(course => String(course.id) === String(preferredCourseId))
    return preferred ?? loadedCourses[0] ?? null
  }

  async function refreshNotifications() {
    const response = await api.get('notifications/?unread=1').catch(() => ({ data: [] }))
    setNotifCount(Array.isArray(response.data) ? response.data.length : 0)
  }

  async function loadLessonData(lessonId, fallbackCourseId = selectedCourseId) {
    if (!lessonId) return

    setSelectedLessonId(String(lessonId))
    setLoadingLesson(true)
    setMessage('')

    try {
      const [lessonResponse, quizzesResponse, tasksResponse] = await Promise.all([
        api.get(`lessons/${lessonId}/`),
        api.get(`lessons/${lessonId}/quizzes/`),
        api.get(`homework/tasks/?lesson=${lessonId}`),
      ])

      setLessonDraft(toLessonDraft(lessonResponse.data, fallbackCourseId))
      setQuizzes(Array.isArray(quizzesResponse.data) ? quizzesResponse.data : [])
      setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : [])
      setQuizDraft(emptyQuiz(lessonId))
      setTaskDraft(emptyTask(lessonId))
    } catch {
      setMessage('РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ СѓСЂРѕРє.')
    } finally {
      setLoadingLesson(false)
    }
  }

  async function selectCourse(courseId, panel = 'course') {
    if (!courseId) {
      newCourse()
      return
    }

    setActivePanel(panel)
    setSelectedCourseId(String(courseId))
    setLoadingLesson(true)
    setMessage('')

    try {
      const [courseResponse, lessonsResponse] = await Promise.all([
        api.get(`courses/${courseId}/`),
        api.get(`courses/${courseId}/lessons/`),
      ])

      const loadedLessons = Array.isArray(lessonsResponse.data) ? lessonsResponse.data : []
      setCourseDraft(toCourseDraft(courseResponse.data))
      setLessons(loadedLessons)

      const firstLesson = loadedLessons[0]
      if (firstLesson) {
        await loadLessonData(firstLesson.id, courseId)
      } else {
        resetLessonState(courseId)
      }
    } catch {
      setMessage('РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РєСѓСЂСЃ.')
    } finally {
      setLoadingLesson(false)
    }
  }

  async function selectLesson(lessonId, panel = 'lesson') {
    if (!lessonId) {
      newLesson()
      return
    }

    setActivePanel(panel)
    await loadLessonData(lessonId, selectedCourseId)
  }

  function newCourse(showMessage = true) {
    setActivePanel('course')
    setSelectedCourseId('')
    resetLessonState('')
    setCourseDraft(emptyCourse)
    setLessons([])
    if (showMessage) setMessage('РЎРѕР·РґР°Р№С‚Рµ РєСѓСЂСЃ, Р·Р°С‚РµРј РґРѕР±Р°РІСЊС‚Рµ Рє РЅРµРјСѓ СѓСЂРѕРєРё, С‚РµСЃС‚С‹ Рё Р·Р°РґР°С‡Рё.')
  }

  function newLesson() {
    if (!selectedCourseId) {
      setMessage('РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РёР»Рё СЃРѕР·РґР°Р№С‚Рµ РєСѓСЂСЃ.')
      setActivePanel('course')
      return
    }

    setActivePanel('lesson')
    resetLessonState(selectedCourseId)
    setMessage('Р—Р°РїРѕР»РЅРёС‚Рµ РґР°РЅРЅС‹Рµ РЅРѕРІРѕРіРѕ СѓСЂРѕРєР°.')
  }

  async function saveCourse(event) {
    event.preventDefault()
    setSaving('course')
    setMessage('')

    try {
      if (selectedCourseId) {
        const response = await api.patch(`courses/${selectedCourseId}/`, courseDraft)
        setCourses(previous => previous.map(course => (
          String(course.id) === String(selectedCourseId) ? { ...course, ...response.data } : course
        )))
        setCourseDraft(toCourseDraft(response.data))
        setMessage('РљСѓСЂСЃ СЃРѕС…СЂР°РЅС‘РЅ.')
      } else {
        const response = await api.post('courses/', courseDraft)
        setCourses(previous => [...previous, response.data])
        setMessage('РљСѓСЂСЃ СЃРѕР·РґР°РЅ. РўРµРїРµСЂСЊ РјРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ СѓСЂРѕРєРё.')
        await selectCourse(response.data.id, 'lesson')
      }
      await refreshNotifications()
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РєСѓСЂСЃ. РџСЂРѕРІРµСЂСЊС‚Рµ РЅР°Р·РІР°РЅРёРµ Рё РѕРїРёСЃР°РЅРёРµ.')
    } finally {
      setSaving('')
    }
  }

  async function deleteCourse() {
    if (!selectedCourseId) return
    if (!confirm('РЈРґР°Р»РёС‚СЊ РєСѓСЂСЃ РІРјРµСЃС‚Рµ СЃ СѓСЂРѕРєР°РјРё, С‚РµСЃС‚Р°РјРё Рё Р·Р°РґР°С‡Р°РјРё?')) return

    setSaving('course-delete')
    try {
      await api.delete(`courses/${selectedCourseId}/`)
      const remainingCourses = courses.filter(course => String(course.id) !== String(selectedCourseId))
      setCourses(remainingCourses)

      const nextCourse = remainingCourses[0]
      if (nextCourse) {
        await selectCourse(nextCourse.id)
      } else {
        newCourse(false)
      }
      setMessage('РљСѓСЂСЃ СѓРґР°Р»С‘РЅ.')
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РєСѓСЂСЃ.')
    } finally {
      setSaving('')
    }
  }

  async function saveLesson(event) {
    event.preventDefault()

    if (!selectedCourseId) {
      setMessage('РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ РєСѓСЂСЃ.')
      setActivePanel('course')
      return
    }

    const payload = {
      title: lessonDraft.title,
      description: lessonDraft.description,
      youtube_url: lessonDraft.youtube_url,
      content: lessonDraft.content,
      order: asNumber(lessonDraft.order),
      xp_reward: asNumber(lessonDraft.xp_reward, 15),
      duration_minutes: asNumber(lessonDraft.duration_minutes),
      is_published: Boolean(lessonDraft.is_published),
    }

    setSaving('lesson')
    setMessage('')

    try {
      if (lessonDraft.id) {
        const response = await api.patch(`lessons/${lessonDraft.id}/`, { ...payload, course: Number(selectedCourseId) })
        setLessonDraft(toLessonDraft(response.data, selectedCourseId))
        const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
        setLessons(Array.isArray(lessonsResponse.data) ? lessonsResponse.data : [])
        setMessage('РЈСЂРѕРє СЃРѕС…СЂР°РЅС‘РЅ.')
      } else {
        const response = await api.post(`courses/${selectedCourseId}/lessons/`, payload)
        const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
        setLessons(Array.isArray(lessonsResponse.data) ? lessonsResponse.data : [])
        await loadLessonData(response.data.id, selectedCourseId)
        await refreshCourses(selectedCourseId)
        setActivePanel('quiz')
        setMessage('РЈСЂРѕРє СЃРѕР·РґР°РЅ. РўРµРїРµСЂСЊ РјРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ С‚РµСЃС‚С‹ РёР»Рё Р·Р°РґР°С‡Рё.')
      }
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ СѓСЂРѕРє. РџСЂРѕРІРµСЂСЊС‚Рµ СЃСЃС‹Р»РєСѓ YouTube Рё РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ.')
    } finally {
      setSaving('')
    }
  }

  async function deleteLesson() {
    if (!selectedLessonId) return
    if (!confirm('РЈРґР°Р»РёС‚СЊ СЌС‚РѕС‚ СѓСЂРѕРє РІРјРµСЃС‚Рµ СЃ С‚РµСЃС‚Р°РјРё Рё Р·Р°РґР°С‡Р°РјРё?')) return

    setSaving('lesson-delete')
    try {
      await api.delete(`lessons/${selectedLessonId}/`)
      const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
      const loadedLessons = Array.isArray(lessonsResponse.data) ? lessonsResponse.data : []
      setLessons(loadedLessons)

      const nextLesson = loadedLessons[0]
      if (nextLesson) {
        await loadLessonData(nextLesson.id, selectedCourseId)
      } else {
        newLesson()
      }
      await refreshCourses(selectedCourseId)
      setMessage('РЈСЂРѕРє СѓРґР°Р»С‘РЅ.')
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СѓСЂРѕРє.')
    } finally {
      setSaving('')
    }
  }

  function resetQuizForm() {
    setQuizDraft(emptyQuiz(selectedLessonId))
  }

  async function saveQuiz(event) {
    event.preventDefault()

    if (!selectedLessonId) {
      setMessage('РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ СѓСЂРѕРє.')
      setActivePanel('lesson')
      return
    }

    const payload = {
      lesson: Number(selectedLessonId),
      question: quizDraft.question,
      option_a: quizDraft.option_a,
      option_b: quizDraft.option_b,
      option_c: quizDraft.option_c,
      option_d: quizDraft.option_d,
      correct: quizDraft.correct,
      xp_reward: asNumber(quizDraft.xp_reward, 5),
    }

    setSaving('quiz')
    setMessage('')

    try {
      if (quizDraft.id) {
        await api.patch(`quizzes/${quizDraft.id}/`, payload)
        setMessage('РўРµСЃС‚ РѕР±РЅРѕРІР»С‘РЅ.')
      } else {
        await api.post(`lessons/${selectedLessonId}/quizzes/`, payload)
        setMessage('РўРµСЃС‚ РґРѕР±Р°РІР»РµРЅ Рє СѓСЂРѕРєСѓ.')
      }

      const response = await api.get(`lessons/${selectedLessonId}/quizzes/`)
      setQuizzes(Array.isArray(response.data) ? response.data : [])
      resetQuizForm()
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ С‚РµСЃС‚. Р—Р°РїРѕР»РЅРёС‚Рµ РІРѕРїСЂРѕСЃ Рё С‡РµС‚С‹СЂРµ РІР°СЂРёР°РЅС‚Р°.')
    } finally {
      setSaving('')
    }
  }

  async function deleteQuiz(quizId) {
    if (!confirm('РЈРґР°Р»РёС‚СЊ СЌС‚РѕС‚ С‚РµСЃС‚?')) return

    setSaving(`quiz-${quizId}`)
    try {
      await api.delete(`quizzes/${quizId}/`)
      setQuizzes(previous => previous.filter(quiz => quiz.id !== quizId))
      if (quizDraft.id === quizId) resetQuizForm()
      setMessage('РўРµСЃС‚ СѓРґР°Р»С‘РЅ.')
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ С‚РµСЃС‚.')
    } finally {
      setSaving('')
    }
  }

  function taskPayload() {
    const tests = taskDraft.tests
      .map(test => ({ input: test.input ?? '', expected: test.expected ?? '', hidden: Boolean(test.hidden) }))
      .filter(test => test.input.trim() || test.expected.trim())

    if (!tests.length) return null

    return {
      lesson: Number(selectedLessonId),
      title_ru: taskDraft.title_ru,
      title_kg: taskDraft.title_kg,
      description_ru: taskDraft.description_ru,
      description_kg: taskDraft.description_kg,
      starter_code: taskDraft.starter_code,
      sample_input: taskDraft.sample_input,
      sample_output: taskDraft.sample_output,
      tests,
      order: asNumber(taskDraft.order),
      xp_reward: asNumber(taskDraft.xp_reward, 10),
      is_published: Boolean(taskDraft.is_published),
    }
  }

  function resetTaskForm() {
    setTaskDraft(emptyTask(selectedLessonId))
  }

  async function saveTask(event) {
    event.preventDefault()

    if (!selectedLessonId) {
      setMessage('РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРёС‚Рµ СѓСЂРѕРє.')
      setActivePanel('lesson')
      return
    }

    const payload = taskPayload()
    if (!payload) {
      setMessage('Р”РѕР±Р°РІСЊС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ С‚РµСЃС‚ РїСЂРѕРІРµСЂРєРё: РІС…РѕРґРЅС‹Рµ РґР°РЅРЅС‹Рµ Рё РѕР¶РёРґР°РµРјС‹Р№ РІС‹РІРѕРґ.')
      return
    }

    setSaving('task')
    setMessage('')

    try {
      if (taskDraft.id) {
        await api.patch(`homework/tasks/${taskDraft.id}/`, payload)
        setMessage('Р—Р°РґР°С‡Р° РѕР±РЅРѕРІР»РµРЅР°.')
      } else {
        await api.post('homework/tasks/', payload)
        setMessage('Р—Р°РґР°С‡Р° РґРѕР±Р°РІР»РµРЅР° Рє СѓСЂРѕРєСѓ.')
      }

      const response = await api.get(`homework/tasks/?lesson=${selectedLessonId}`)
      setTasks(Array.isArray(response.data) ? response.data : [])
      resetTaskForm()
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р·Р°РґР°С‡Сѓ. РџСЂРѕРІРµСЂСЊС‚Рµ РЅР°Р·РІР°РЅРёРµ, РѕРїРёСЃР°РЅРёРµ Рё С‚РµСЃС‚С‹.')
    } finally {
      setSaving('')
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('РЈРґР°Р»РёС‚СЊ СЌС‚Сѓ Р·Р°РґР°С‡Сѓ?')) return

    setSaving(`task-${taskId}`)
    try {
      await api.delete(`homework/tasks/${taskId}/`)
      setTasks(previous => previous.filter(task => task.id !== taskId))
      if (taskDraft.id === taskId) resetTaskForm()
      setMessage('Р—Р°РґР°С‡Р° СѓРґР°Р»РµРЅР°.')
    } catch {
      setMessage('РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ Р·Р°РґР°С‡Сѓ.')
    } finally {
      setSaving('')
    }
  }

  function updateTaskTest(index, field, value) {
    setTaskDraft(previous => ({
      ...previous,
      tests: previous.tests.map((test, testIndex) => (
        testIndex === index ? { ...test, [field]: value } : test
      )),
    }))
  }

  function addTaskTest() {
    setTaskDraft(previous => ({ ...previous, tests: [...previous.tests, { input: '', expected: '', hidden: false }] }))
  }

  function removeTaskTest(index) {
    setTaskDraft(previous => ({
      ...previous,
      tests: previous.tests.length > 1
        ? previous.tests.filter((_, testIndex) => testIndex !== index)
        : [{ input: '', expected: '', hidden: false }],
    }))
  }

  return (
    <div className="teacher-course-shell">
      <TeacherSidebar notifCount={notifCount} />

      <main className="teacher-course-main">
        <header className="teacher-course-topbar">
          <div>
            <span className="manager-kicker"><span /> РЈРїСЂР°РІР»РµРЅРёРµ РєСѓСЂСЃРѕРј</span>
            <h1>РљСѓСЂСЃС‹ Рё СѓСЂРѕРєРё</h1>
            <p>Р‘С‹СЃС‚СЂРѕ РІС‹Р±РµСЂРёС‚Рµ РєСѓСЂСЃ Рё СѓСЂРѕРє, Р·Р°С‚РµРј СЂРµРґР°РєС‚РёСЂСѓР№С‚Рµ РЅСѓР¶РЅС‹Р№ СЂР°Р·РґРµР» РІРѕ РІРєР»Р°РґРєР°С….</p>
          </div>

          <div className="manager-actions">
            <button type="button" onClick={() => selectCourse(selectedCourseId)} disabled={!selectedCourseId || loading} className="manager-button ghost">
              <Icon name="refresh" size={17} />
              РћР±РЅРѕРІРёС‚СЊ
            </button>
            <button type="button" onClick={() => newCourse()} className="manager-button primary">+ РќРѕРІС‹Р№ РєСѓСЂСЃ</button>
          </div>
        </header>

        <section className="manager-toolbar" aria-label="Р‘С‹СЃС‚СЂС‹Р№ РІС‹Р±РѕСЂ">
          <label>
            <span>РљСѓСЂСЃ</span>
            <select value={selectedCourseId} onChange={event => selectCourse(event.target.value)}>
              <option value="">РќРѕРІС‹Р№ РєСѓСЂСЃ</option>
              {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label>
            <span>РЈСЂРѕРє</span>
            <select value={selectedLessonId} onChange={event => selectLesson(event.target.value)} disabled={!selectedCourseId || !lessons.length}>
              <option value="">РќРѕРІС‹Р№ СѓСЂРѕРє</option>
              {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.order}. {lesson.title}</option>)}
            </select>
          </label>
          <button type="button" onClick={newLesson} disabled={!selectedCourseId} className="manager-button ghost">+ РЈСЂРѕРє</button>
        </section>

        {message && <div className="manager-message">{message}</div>}

        <section className="manager-metrics" aria-label="РЎРІРѕРґРєР° РєСѓСЂСЃР°">
          {stats.map(item => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.caption}</small>
            </article>
          ))}
        </section>

        <div className="manager-workspace">
          <aside className="manager-rail">
            <section className="manager-rail-card">
              <div className="manager-rail-head">
                <div><span>РџСЂРѕРіСЂР°РјРјР°</span><h2>РљСѓСЂСЃС‹</h2></div>
                <strong>{courses.length}</strong>
              </div>
              <label className="manager-search">
                <Icon name="search" size={16} />
                <input value={courseQuery} onChange={event => setCourseQuery(event.target.value)} placeholder="РќР°Р№С‚Рё РєСѓСЂСЃ" />
              </label>
              <div className="manager-list compact">
                {loading ? <div className="manager-list-note">Р—Р°РіСЂСѓР·РєР°...</div> : filteredCourses.length ? filteredCourses.map(course => (
                  <button key={course.id} type="button" onClick={() => selectCourse(course.id)} className={`manager-list-item ${String(course.id) === String(selectedCourseId) ? 'active' : ''}`}>
                    <span className="manager-list-title">{course.title}</span>
                    <span className="manager-list-meta">{course.lessons_count ?? 0} СѓСЂРѕРєРѕРІ</span>
                    <StatusPill published={course.is_published} />
                  </button>
                )) : <div className="manager-list-note">РљСѓСЂСЃРѕРІ РЅРµ РЅР°Р№РґРµРЅРѕ</div>}
              </div>
            </section>

            <section className="manager-rail-card">
              <div className="manager-rail-head">
                <div><span>РЎРѕРґРµСЂР¶Р°РЅРёРµ</span><h2>РЈСЂРѕРєРё</h2></div>
                <strong>{lessons.length}</strong>
              </div>
              <div className="manager-list compact">
                {!selectedCourseId ? <div className="manager-list-note">Р’С‹Р±РµСЂРёС‚Рµ РєСѓСЂСЃ</div> : loadingLesson ? <div className="manager-list-note">РћС‚РєСЂС‹РІР°СЋ...</div> : lessons.length ? lessons.map(lesson => (
                  <button key={lesson.id} type="button" onClick={() => selectLesson(lesson.id)} className={`manager-list-item ${String(lesson.id) === String(selectedLessonId) ? 'active purple' : ''}`}>
                    <span className="manager-list-title">{lesson.title}</span>
                    <span className="manager-list-meta">в„–{lesson.order} В· {lesson.duration_minutes || 0} РјРёРЅ В· +{lesson.xp_reward || 0} XP</span>
                    <StatusPill published={lesson.is_published} />
                  </button>
                )) : <div className="manager-list-note">РЈСЂРѕРєРѕРІ РїРѕРєР° РЅРµС‚</div>}
              </div>
            </section>
          </aside>

          <section className="manager-editor">
            <nav className="manager-tabs" aria-label="Р Р°Р·РґРµР» СЂРµРґР°РєС‚РѕСЂР°">
              {tabs.map(tab => (
                <button key={tab.id} type="button" disabled={tab.disabled} onClick={() => setActivePanel(tab.id)} className={activePanel === tab.id ? 'active' : ''}>
                  <span>{tab.label}</span>
                  <strong>{tab.count}</strong>
                </button>
              ))}
            </nav>

            {activePanel === 'course' && (
              <form onSubmit={saveCourse} className="manager-panel manager-form">
                <PanelTitle eyebrow="РљСѓСЂСЃ" title={selectedCourseId ? 'Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ РєСѓСЂСЃР°' : 'РќРѕРІС‹Р№ РєСѓСЂСЃ'}>
                  {selectedCourseId && <StatusPill published={courseDraft.is_published} />}
                  <button type="button" onClick={deleteCourse} disabled={!selectedCourseId || saving === 'course-delete'} className="manager-button danger">РЈРґР°Р»РёС‚СЊ</button>
                </PanelTitle>

                <div className="manager-form-grid two">
                  <Field label="РќР°Р·РІР°РЅРёРµ РєСѓСЂСЃР°" className="wide"><input required value={courseDraft.title} onChange={event => setCourseDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="Python РїСЂРѕРіСЂР°РјРјР°Р»РѕРѕ РєСѓСЂСЃСѓ" /></Field>
                  <Field label="РћРїРёСЃР°РЅРёРµ" className="wide"><textarea required rows={4} value={courseDraft.description} onChange={event => setCourseDraft(previous => ({ ...previous, description: event.target.value }))} placeholder="РљРѕСЂРѕС‚РєРѕ СЂР°СЃСЃРєР°Р¶РёС‚Рµ, С‡РµРјСѓ СѓС‡РµРЅРёРє РЅР°СѓС‡РёС‚СЃСЏ." /></Field>
                </div>

                <div className="manager-form-footer">
                  <label className="manager-check"><input type="checkbox" checked={courseDraft.is_published} onChange={event => setCourseDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РєСѓСЂСЃ</label>
                  <button type="submit" disabled={saving === 'course'} className="manager-button primary">{saving === 'course' ? 'РЎРѕС…СЂР°РЅСЏСЋ...' : selectedCourseId ? 'РЎРѕС…СЂР°РЅРёС‚СЊ РєСѓСЂСЃ' : 'РЎРѕР·РґР°С‚СЊ РєСѓСЂСЃ'}</button>
                </div>
              </form>
            )}

            {activePanel === 'lesson' && (
              <form onSubmit={saveLesson} className="manager-panel manager-form">
                <PanelTitle eyebrow="РЈСЂРѕРє" title={lessonDraft.id ? 'Р РµРґР°РєС‚РёСЂРѕРІР°РЅРёРµ СѓСЂРѕРєР°' : 'РќРѕРІС‹Р№ СѓСЂРѕРє'}>
                  {lessonDraft.id && <StatusPill published={lessonDraft.is_published} />}
                  <button type="button" onClick={newLesson} disabled={!selectedCourseId} className="manager-button ghost">РќРѕРІС‹Р№ СѓСЂРѕРє</button>
                  <button type="button" onClick={deleteLesson} disabled={!selectedLessonId || saving === 'lesson-delete'} className="manager-button danger">РЈРґР°Р»РёС‚СЊ</button>
                </PanelTitle>

                {!selectedCourseId ? <EmptyHint title="РљСѓСЂСЃ РЅРµ РІС‹Р±СЂР°РЅ" text="Р’С‹Р±РµСЂРёС‚Рµ РєСѓСЂСЃ СЃР»РµРІР° РёР»Рё СЃРѕР·РґР°Р№С‚Рµ РЅРѕРІС‹Р№ РєСѓСЂСЃ." /> : (
                  <>
                    <div className="manager-form-grid two">
                      <Field label="РќР°Р·РІР°РЅРёРµ СѓСЂРѕРєР°"><input required value={lessonDraft.title} onChange={event => setLessonDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="1-СЃР°Р±Р°Рє, 1-Р±У©Р»ТЇРј" /></Field>
                      <Field label="YouTube СЃСЃС‹Р»РєР°"><input type="url" value={lessonDraft.youtube_url} onChange={event => setLessonDraft(previous => ({ ...previous, youtube_url: event.target.value }))} placeholder="https://youtube.com/watch?v=..." /></Field>
                      <Field label="РљСЂР°С‚РєРѕРµ РѕРїРёСЃР°РЅРёРµ" className="wide"><textarea rows={3} value={lessonDraft.description} onChange={event => setLessonDraft(previous => ({ ...previous, description: event.target.value }))} placeholder="Р§С‚Рѕ СѓС‡РµРЅРёРє РїРѕР№РјС‘С‚ РїРѕСЃР»Рµ СѓСЂРѕРєР°?" /></Field>
                      <Field label="РњР°С‚РµСЂРёР°Р» СѓСЂРѕРєР°" className="wide"><textarea rows={9} value={lessonDraft.content} onChange={event => setLessonDraft(previous => ({ ...previous, content: event.target.value }))} placeholder="РўРµРєСЃС‚ СѓСЂРѕРєР°, РєРѕРЅСЃРїРµРєС‚, РїСЂРёРјРµСЂС‹ РєРѕРґР°..." /></Field>
                      <Field label="РџРѕСЂСЏРґРѕРє"><input type="number" min="0" value={lessonDraft.order} onChange={event => setLessonDraft(previous => ({ ...previous, order: event.target.value }))} /></Field>
                      <Field label="XP"><input type="number" min="0" value={lessonDraft.xp_reward} onChange={event => setLessonDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                      <Field label="РњРёРЅСѓС‚С‹"><input type="number" min="0" value={lessonDraft.duration_minutes} onChange={event => setLessonDraft(previous => ({ ...previous, duration_minutes: event.target.value }))} /></Field>
                    </div>
                    <div className="manager-form-footer">
                      <label className="manager-check"><input type="checkbox" checked={lessonDraft.is_published} onChange={event => setLessonDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ СѓСЂРѕРє</label>
                      <button type="submit" disabled={saving === 'lesson'} className="manager-button primary">{saving === 'lesson' ? 'РЎРѕС…СЂР°РЅСЏСЋ...' : lessonDraft.id ? 'РЎРѕС…СЂР°РЅРёС‚СЊ СѓСЂРѕРє' : 'РЎРѕР·РґР°С‚СЊ СѓСЂРѕРє'}</button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activePanel === 'quiz' && (
              <div className="manager-panel">
                <PanelTitle eyebrow="РўРµСЃС‚С‹" title="Р’РѕРїСЂРѕСЃС‹ СѓСЂРѕРєР°"><button type="button" onClick={resetQuizForm} disabled={!selectedLessonId} className="manager-button ghost">РќРѕРІС‹Р№ С‚РµСЃС‚</button></PanelTitle>

                {!selectedLessonId ? <EmptyHint title="РЈСЂРѕРє РЅРµ РІС‹Р±СЂР°РЅ" text="Р’С‹Р±РµСЂРёС‚Рµ СѓСЂРѕРє, С‡С‚РѕР±С‹ РґРѕР±Р°РІРёС‚СЊ С‚РµСЃС‚С‹." /> : (
                  <div className="manager-split">
                    <div className="manager-list">
                      {quizzes.length ? quizzes.map((quiz, index) => (
                        <article key={quiz.id} className="manager-card-row">
                          <div><span>Р’РѕРїСЂРѕСЃ {index + 1}</span><strong>{quiz.question}</strong><small>РћС‚РІРµС‚: {quiz.correct?.toUpperCase()} В· +{quiz.xp_reward} XP</small></div>
                          <div><button type="button" onClick={() => setQuizDraft(toQuizDraft(quiz, selectedLessonId))} className="manager-button ghost">РР·РјРµРЅРёС‚СЊ</button><button type="button" onClick={() => deleteQuiz(quiz.id)} disabled={saving === `quiz-${quiz.id}`} className="manager-button danger">Г—</button></div>
                        </article>
                      )) : <EmptyHint title="РўРµСЃС‚РѕРІ РїРѕРєР° РЅРµС‚" text="Р”РѕР±Р°РІСЊС‚Рµ РїРµСЂРІС‹Р№ РІРѕРїСЂРѕСЃ РґР»СЏ РІС‹Р±СЂР°РЅРЅРѕРіРѕ СѓСЂРѕРєР°." />}
                    </div>

                    <form onSubmit={saveQuiz} className="manager-subform">
                      <h3>{quizDraft.id ? 'РР·РјРµРЅРёС‚СЊ С‚РµСЃС‚' : 'РќРѕРІС‹Р№ С‚РµСЃС‚'}</h3>
                      <Field label="Р’РѕРїСЂРѕСЃ"><textarea required rows={3} value={quizDraft.question} onChange={event => setQuizDraft(previous => ({ ...previous, question: event.target.value }))} placeholder="Р§С‚Рѕ РІС‹РІРµРґРµС‚ print(2 + 2)?" /></Field>
                      {['a', 'b', 'c', 'd'].map(option => (
                        <Field key={option} label={`Р’Р°СЂРёР°РЅС‚ ${option.toUpperCase()}`}>
                          <div className="answer-row">
                            <input required value={quizDraft[`option_${option}`]} onChange={event => setQuizDraft(previous => ({ ...previous, [`option_${option}`]: event.target.value }))} />
                            <button type="button" onClick={() => setQuizDraft(previous => ({ ...previous, correct: option }))} className={`manager-button ${quizDraft.correct === option ? 'primary' : 'ghost'}`}>Р’РµСЂРЅС‹Р№</button>
                          </div>
                        </Field>
                      ))}
                      <Field label="XP"><input type="number" min="0" value={quizDraft.xp_reward} onChange={event => setQuizDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                      <div className="manager-form-footer right"><button type="submit" disabled={saving === 'quiz'} className="manager-button primary">{saving === 'quiz' ? 'РЎРѕС…СЂР°РЅСЏСЋ...' : quizDraft.id ? 'РЎРѕС…СЂР°РЅРёС‚СЊ С‚РµСЃС‚' : 'Р”РѕР±Р°РІРёС‚СЊ С‚РµСЃС‚'}</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activePanel === 'task' && (
              <div className="manager-panel">
                <PanelTitle eyebrow="Р—Р°РґР°С‡Рё" title="РђРІС‚РѕРїСЂРѕРІРµСЂРєР° РєРѕРґР°"><button type="button" onClick={resetTaskForm} disabled={!selectedLessonId} className="manager-button ghost">РќРѕРІР°СЏ Р·Р°РґР°С‡Р°</button></PanelTitle>

                {!selectedLessonId ? <EmptyHint title="РЈСЂРѕРє РЅРµ РІС‹Р±СЂР°РЅ" text="Р’С‹Р±РµСЂРёС‚Рµ СѓСЂРѕРє, С‡С‚РѕР±С‹ РґРѕР±Р°РІРёС‚СЊ Р·Р°РґР°С‡Рё." /> : (
                  <div className="manager-split wide">
                    <div className="manager-list">
                      {tasks.length ? tasks.map((task, index) => (
                        <article key={task.id} className="manager-card-row">
                          <div><span>Р—Р°РґР°С‡Р° {index + 1}</span><strong>{task.title_ru}</strong><small>{task.tests_count ?? task.tests?.length ?? 0} С‚РµСЃС‚Р° В· +{task.xp_reward} XP</small></div>
                          <div><button type="button" onClick={() => setTaskDraft(toTaskDraft(task, selectedLessonId))} className="manager-button ghost">РР·РјРµРЅРёС‚СЊ</button><button type="button" onClick={() => deleteTask(task.id)} disabled={saving === `task-${task.id}`} className="manager-button danger">Г—</button></div>
                        </article>
                      )) : <EmptyHint title="Р—Р°РґР°С‡ РїРѕРєР° РЅРµС‚" text="Р”РѕР±Р°РІСЊС‚Рµ РїСЂР°РєС‚РёС‡РµСЃРєСѓСЋ Р·Р°РґР°С‡Сѓ СЃ С‚РµСЃС‚Р°РјРё РїСЂРѕРІРµСЂРєРё." />}
                    </div>

                    <form onSubmit={saveTask} className="manager-subform">
                      <h3>{taskDraft.id ? 'РР·РјРµРЅРёС‚СЊ Р·Р°РґР°С‡Сѓ' : 'РќРѕРІР°СЏ Р·Р°РґР°С‡Р°'}</h3>
                      <div className="manager-form-grid two">
                        <Field label="РќР°Р·РІР°РЅРёРµ RU"><input required value={taskDraft.title_ru} onChange={event => setTaskDraft(previous => ({ ...previous, title_ru: event.target.value }))} placeholder="Р—РЅР°Рє С‡РёСЃР»Р°" /></Field>
                        <Field label="РќР°Р·РІР°РЅРёРµ KG"><input value={taskDraft.title_kg} onChange={event => setTaskDraft(previous => ({ ...previous, title_kg: event.target.value }))} placeholder="РЎР°РЅРґС‹РЅ Р±РµР»РіРёСЃРё" /></Field>
                        <Field label="РЈСЃР»РѕРІРёРµ RU" className="wide"><textarea required rows={4} value={taskDraft.description_ru} onChange={event => setTaskDraft(previous => ({ ...previous, description_ru: event.target.value }))} /></Field>
                        <Field label="РЈСЃР»РѕРІРёРµ KG" className="wide"><textarea rows={4} value={taskDraft.description_kg} onChange={event => setTaskDraft(previous => ({ ...previous, description_kg: event.target.value }))} /></Field>
                        <Field label="РЎС‚Р°СЂС‚РѕРІС‹Р№ РєРѕРґ" className="wide"><textarea rows={6} value={taskDraft.starter_code} onChange={event => setTaskDraft(previous => ({ ...previous, starter_code: event.target.value }))} /></Field>
                        <Field label="РџСЂРёРјРµСЂ РІС…РѕРґР°"><textarea rows={3} value={taskDraft.sample_input} onChange={event => setTaskDraft(previous => ({ ...previous, sample_input: event.target.value }))} /></Field>
                        <Field label="РџСЂРёРјРµСЂ РІС‹РІРѕРґР°"><textarea rows={3} value={taskDraft.sample_output} onChange={event => setTaskDraft(previous => ({ ...previous, sample_output: event.target.value }))} /></Field>
                      </div>

                      <section className="task-test-editor">
                        <div className="task-test-editor-head"><h4>РўРµСЃС‚С‹ РїСЂРѕРІРµСЂРєРё</h4><button type="button" onClick={addTaskTest} className="manager-button ghost">+ РўРµСЃС‚</button></div>
                        {taskDraft.tests.map((test, index) => (
                          <div key={`${index}-${taskDraft.tests.length}`} className="manager-test-row">
                            <strong>#{index + 1}</strong>
                            <Field label="Р’РІРѕРґ"><textarea rows={2} value={test.input} onChange={event => updateTaskTest(index, 'input', event.target.value)} /></Field>
                            <Field label="РћР¶РёРґР°РµРјС‹Р№ РІС‹РІРѕРґ"><textarea rows={2} value={test.expected} onChange={event => updateTaskTest(index, 'expected', event.target.value)} /></Field>
                            <label className="manager-check compact"><input type="checkbox" checked={test.hidden} onChange={event => updateTaskTest(index, 'hidden', event.target.checked)} /> РЎРєСЂС‹С‚С‹Р№</label>
                            <button type="button" onClick={() => removeTaskTest(index)} className="manager-button danger">Г—</button>
                          </div>
                        ))}
                      </section>

                      <div className="manager-form-grid three">
                        <Field label="РџРѕСЂСЏРґРѕРє"><input type="number" min="0" value={taskDraft.order} onChange={event => setTaskDraft(previous => ({ ...previous, order: event.target.value }))} /></Field>
                        <Field label="XP"><input type="number" min="0" value={taskDraft.xp_reward} onChange={event => setTaskDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                        <label className="manager-check with-offset"><input type="checkbox" checked={taskDraft.is_published} onChange={event => setTaskDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> РћРїСѓР±Р»РёРєРѕРІР°РЅР°</label>
                      </div>

                      <div className="manager-form-footer right"><button type="submit" disabled={saving === 'task'} className="manager-button primary">{saving === 'task' ? 'РЎРѕС…СЂР°РЅСЏСЋ...' : taskDraft.id ? 'РЎРѕС…СЂР°РЅРёС‚СЊ Р·Р°РґР°С‡Сѓ' : 'Р”РѕР±Р°РІРёС‚СЊ Р·Р°РґР°С‡Сѓ'}</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}