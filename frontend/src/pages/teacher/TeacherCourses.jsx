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
  video_urls: [''],
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
  starter_code: '# Напиши решение здесьn',
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

function normaliseVideoUrls(value, fallback = '') {
  const source = Array.isArray(value) ? value : []
  const cleaned = source
    .map(item => String(item ?? '').trim())
    .filter(Boolean)

  const legacyUrl = String(fallback ?? '').trim()
  if (legacyUrl && !cleaned.includes(legacyUrl)) cleaned.unshift(legacyUrl)

  return cleaned.length ? cleaned : ['']
}

function filledVideoUrls(value, fallback = '') {
  return normaliseVideoUrls(value, fallback).filter(Boolean)
}

function editableVideoUrls(value, fallback = '') {
  const source = Array.isArray(value) ? value.map(item => String(item ?? '')) : []
  const legacyUrl = String(fallback ?? '').trim()

  if (!source.length) return legacyUrl ? [legacyUrl] : ['']

  const hasLegacy = source.some(item => item.trim() === legacyUrl)
  if (legacyUrl && !hasLegacy) source.unshift(legacyUrl)

  return source.length ? source : ['']
}

function toLessonDraft(lesson, courseId = '') {
  const videoUrls = normaliseVideoUrls(lesson?.video_urls, lesson?.youtube_url)

  return {
    id: lesson?.id ?? null,
    course: String(lesson?.course ?? courseId ?? ''),
    title: lesson?.title ?? '',
    description: lesson?.description ?? '',
    youtube_url: videoUrls[0] ?? '',
    video_urls: videoUrls,
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
    starter_code: task?.starter_code ?? '# Напиши решение здесьn',
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
      {published ? 'Опубликовано' : 'Черновик'}
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
    { label: 'Курсов', value: courses.length, caption: 'в программе' },
    { label: 'Уроков', value: lessons.length, caption: selectedCourse ? selectedCourse.title : 'выберите курс' },
    { label: 'Тестов', value: quizzes.length, caption: selectedLesson ? selectedLesson.title : 'выберите урок' },
    { label: 'Задач', value: tasks.length, caption: 'автопроверка' },
  ]

  const tabs = [
    { id: 'course', label: 'Курс', count: selectedCourseId ? 1 : 0 },
    { id: 'lesson', label: 'Урок', count: lessons.length },
    { id: 'quiz', label: 'Тесты', count: quizzes.length, disabled: !selectedLessonId },
    { id: 'task', label: 'Задачи', count: tasks.length, disabled: !selectedLessonId },
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
        if (active) setMessage('Не удалось загрузить курсы. Проверьте подключение к API.')
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
      setMessage('Не получилось открыть урок.')
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
      setMessage('Не получилось открыть курс.')
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
    if (showMessage) setMessage('Создайте курс, затем добавьте к нему уроки, тесты и задачи.')
  }

  function newLesson() {
    if (!selectedCourseId) {
      setMessage('Сначала выберите или создайте курс.')
      setActivePanel('course')
      return
    }

    setActivePanel('lesson')
    resetLessonState(selectedCourseId)
    setMessage('Заполните данные нового урока.')
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
        setMessage('Курс сохранён.')
      } else {
        const response = await api.post('courses/', courseDraft)
        setCourses(previous => [...previous, response.data])
        setMessage('Курс создан. Теперь можно добавить уроки.')
        await selectCourse(response.data.id, 'lesson')
      }
      await refreshNotifications()
    } catch {
      setMessage('Не удалось сохранить курс. Проверьте название и описание.')
    } finally {
      setSaving('')
    }
  }

  async function deleteCourse() {
    if (!selectedCourseId) return
    if (!confirm('Удалить курс вместе с уроками, тестами и задачами?')) return

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
      setMessage('Курс удалён.')
    } catch {
      setMessage('Не удалось удалить курс.')
    } finally {
      setSaving('')
    }
  }

  function updateLessonVideo(index, value) {
    setLessonDraft(previous => {
      const nextVideos = editableVideoUrls(previous.video_urls, previous.youtube_url)
      nextVideos[index] = value
      return { ...previous, video_urls: nextVideos, youtube_url: nextVideos[0] ?? '' }
    })
  }

  function addLessonVideo() {
    setLessonDraft(previous => ({
      ...previous,
      video_urls: [...editableVideoUrls(previous.video_urls, previous.youtube_url), ''],
    }))
  }

  function removeLessonVideo(index) {
    setLessonDraft(previous => {
      const nextVideos = editableVideoUrls(previous.video_urls, previous.youtube_url)
      nextVideos.splice(index, 1)
      const safeVideos = nextVideos.length ? nextVideos : ['']
      return { ...previous, video_urls: safeVideos, youtube_url: safeVideos[0] ?? '' }
    })
  }

  function moveLessonVideo(index, direction) {
    setLessonDraft(previous => {
      const nextVideos = editableVideoUrls(previous.video_urls, previous.youtube_url)
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= nextVideos.length) return previous
      const [item] = nextVideos.splice(index, 1)
      nextVideos.splice(nextIndex, 0, item)
      return { ...previous, video_urls: nextVideos, youtube_url: nextVideos[0] ?? '' }
    })
  }

  async function saveLesson(event) {
    event.preventDefault()

    if (!selectedCourseId) {
      setMessage('Сначала выберите курс.')
      setActivePanel('course')
      return
    }

    const videoUrls = filledVideoUrls(lessonDraft.video_urls, lessonDraft.youtube_url)

    const payload = {
      title: lessonDraft.title,
      description: lessonDraft.description,
      youtube_url: videoUrls[0] ?? '',
      video_urls: videoUrls,
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
        setMessage('Урок сохранён.')
      } else {
        const response = await api.post(`courses/${selectedCourseId}/lessons/`, payload)
        const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
        setLessons(Array.isArray(lessonsResponse.data) ? lessonsResponse.data : [])
        await loadLessonData(response.data.id, selectedCourseId)
        await refreshCourses(selectedCourseId)
        setActivePanel('quiz')
        setMessage('Урок создан. Теперь можно добавить тесты или задачи.')
      }
    } catch {
      setMessage('Не удалось сохранить урок. Проверьте ссылку YouTube и обязательные поля.')
    } finally {
      setSaving('')
    }
  }

  async function deleteLesson() {
    if (!selectedLessonId) return
    if (!confirm('Удалить этот урок вместе с тестами и задачами?')) return

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
      setMessage('Урок удалён.')
    } catch {
      setMessage('Не удалось удалить урок.')
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
      setMessage('Сначала выберите урок.')
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
        setMessage('Тест обновлён.')
      } else {
        await api.post(`lessons/${selectedLessonId}/quizzes/`, payload)
        setMessage('Тест добавлен к уроку.')
      }

      const response = await api.get(`lessons/${selectedLessonId}/quizzes/`)
      setQuizzes(Array.isArray(response.data) ? response.data : [])
      resetQuizForm()
    } catch {
      setMessage('Не удалось сохранить тест. Заполните вопрос и четыре варианта.')
    } finally {
      setSaving('')
    }
  }

  async function deleteQuiz(quizId) {
    if (!confirm('Удалить этот тест?')) return

    setSaving(`quiz-${quizId}`)
    try {
      await api.delete(`quizzes/${quizId}/`)
      setQuizzes(previous => previous.filter(quiz => quiz.id !== quizId))
      if (quizDraft.id === quizId) resetQuizForm()
      setMessage('Тест удалён.')
    } catch {
      setMessage('Не удалось удалить тест.')
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
      setMessage('Сначала выберите урок.')
      setActivePanel('lesson')
      return
    }

    const payload = taskPayload()
    if (!payload) {
      setMessage('Добавьте хотя бы один тест проверки: входные данные и ожидаемый вывод.')
      return
    }

    setSaving('task')
    setMessage('')

    try {
      if (taskDraft.id) {
        await api.patch(`homework/tasks/${taskDraft.id}/`, payload)
        setMessage('Задача обновлена.')
      } else {
        await api.post('homework/tasks/', payload)
        setMessage('Задача добавлена к уроку.')
      }

      const response = await api.get(`homework/tasks/?lesson=${selectedLessonId}`)
      setTasks(Array.isArray(response.data) ? response.data : [])
      resetTaskForm()
    } catch {
      setMessage('Не удалось сохранить задачу. Проверьте название, описание и тесты.')
    } finally {
      setSaving('')
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('Удалить эту задачу?')) return

    setSaving(`task-${taskId}`)
    try {
      await api.delete(`homework/tasks/${taskId}/`)
      setTasks(previous => previous.filter(task => task.id !== taskId))
      if (taskDraft.id === taskId) resetTaskForm()
      setMessage('Задача удалена.')
    } catch {
      setMessage('Не удалось удалить задачу.')
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
            <span className="manager-kicker"><span /> Редактор программы</span>
            <h1>Управление курсом</h1>
            <p>Выберите курс и урок. Все материалы, тесты и задачи редактируются в одном месте.</p>
          </div>

          <div className="manager-actions">
            <button type="button" onClick={() => selectCourse(selectedCourseId)} disabled={!selectedCourseId || loading} className="manager-button ghost">
              <Icon name="refresh" size={17} />
              Обновить
            </button>
            <button type="button" onClick={() => newCourse()} className="manager-button primary">+ Новый курс</button>
          </div>
        </header>

        <section className="manager-toolbar" aria-label="Быстрый выбор">
          <label>
            <span>Курс</span>
            <select value={selectedCourseId} onChange={event => selectCourse(event.target.value)}>
              <option value="">Новый курс</option>
              {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label>
            <span>Урок</span>
            <select value={selectedLessonId} onChange={event => selectLesson(event.target.value)} disabled={!selectedCourseId || !lessons.length}>
              <option value="">Новый урок</option>
              {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.order}. {lesson.title}</option>)}
            </select>
          </label>
          <button type="button" onClick={newLesson} disabled={!selectedCourseId} className="manager-button ghost">+ Урок</button>
        </section>

        <section className="manager-context" aria-label="Текущий выбор">
          <div><span>Курс</span><strong>{selectedCourse?.title || 'Новый курс'}</strong></div>
          <i />
          <div><span>Урок</span><strong>{selectedLesson?.title || (selectedCourseId ? 'Новый урок' : 'Сначала выберите курс')}</strong></div>
          <div className="manager-context-actions">
            <button type="button" onClick={() => setActivePanel('course')} className={activePanel === 'course' ? 'active' : ''}>Курс</button>
            <button type="button" onClick={() => setActivePanel('lesson')} className={activePanel === 'lesson' ? 'active' : ''}>Урок</button>
            <button type="button" onClick={() => setActivePanel('quiz')} disabled={!selectedLessonId} className={activePanel === 'quiz' ? 'active' : ''}>Тесты</button>
            <button type="button" onClick={() => setActivePanel('task')} disabled={!selectedLessonId} className={activePanel === 'task' ? 'active' : ''}>Задачи</button>
          </div>
        </section>

        {message && <div className="manager-message">{message}</div>}

        <section className="manager-metrics" aria-label="Сводка курса">
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
                <div><span>Программа</span><h2>Курсы</h2></div>
                <strong>{courses.length}</strong>
              </div>
              <label className="manager-search">
                <Icon name="search" size={16} />
                <input value={courseQuery} onChange={event => setCourseQuery(event.target.value)} placeholder="Найти курс" />
              </label>
              <div className="manager-list compact">
                {loading ? <div className="manager-list-note">Загрузка...</div> : filteredCourses.length ? filteredCourses.map(course => (
                  <button key={course.id} type="button" onClick={() => selectCourse(course.id)} className={`manager-list-item ${String(course.id) === String(selectedCourseId) ? 'active' : ''}`}>
                    <span className="manager-list-title">{course.title}</span>
                    <span className="manager-list-meta">{course.lessons_count ?? 0} уроков</span>
                    <StatusPill published={course.is_published} />
                  </button>
                )) : <div className="manager-list-note">Курсов не найдено</div>}
              </div>
            </section>

            <section className="manager-rail-card">
              <div className="manager-rail-head">
                <div><span>Содержание</span><h2>Уроки</h2></div>
                <strong>{lessons.length}</strong>
              </div>
              <div className="manager-list compact">
                {!selectedCourseId ? <div className="manager-list-note">Выберите курс</div> : loadingLesson ? <div className="manager-list-note">Открываю...</div> : lessons.length ? lessons.map(lesson => (
                  <button key={lesson.id} type="button" onClick={() => selectLesson(lesson.id)} className={`manager-list-item ${String(lesson.id) === String(selectedLessonId) ? 'active purple' : ''}`}>
                    <span className="manager-list-title">{lesson.title}</span>
                    <span className="manager-list-meta">№{lesson.order} · {lesson.duration_minutes || 0} мин · {filledVideoUrls(lesson.video_urls, lesson.youtube_url).length || 0} видео · +{lesson.xp_reward || 0} XP</span>
                    <StatusPill published={lesson.is_published} />
                  </button>
                )) : <div className="manager-list-note">Уроков пока нет</div>}
              </div>
            </section>
          </aside>

          <section className="manager-editor">
            <nav className="manager-tabs" aria-label="Раздел редактора">
              {tabs.map(tab => (
                <button key={tab.id} type="button" disabled={tab.disabled} onClick={() => setActivePanel(tab.id)} className={activePanel === tab.id ? 'active' : ''}>
                  <span>{tab.label}</span>
                  <strong>{tab.count}</strong>
                </button>
              ))}
            </nav>

            {activePanel === 'course' && (
              <form onSubmit={saveCourse} className="manager-panel manager-form">
                <PanelTitle eyebrow="Курс" title={selectedCourseId ? 'Редактирование курса' : 'Новый курс'}>
                  {selectedCourseId && <StatusPill published={courseDraft.is_published} />}
                  <button type="button" onClick={deleteCourse} disabled={!selectedCourseId || saving === 'course-delete'} className="manager-button danger">Удалить</button>
                </PanelTitle>

                <div className="manager-form-grid two">
                  <Field label="Название курса" className="wide"><input required value={courseDraft.title} onChange={event => setCourseDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="Python программалоо курсу" /></Field>
                  <Field label="Описание" className="wide"><textarea required rows={4} value={courseDraft.description} onChange={event => setCourseDraft(previous => ({ ...previous, description: event.target.value }))} placeholder="Коротко расскажите, чему ученик научится." /></Field>
                </div>

                <div className="manager-form-footer">
                  <label className="manager-check"><input type="checkbox" checked={courseDraft.is_published} onChange={event => setCourseDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> Опубликовать курс</label>
                  <button type="submit" disabled={saving === 'course'} className="manager-button primary">{saving === 'course' ? 'Сохраняю...' : selectedCourseId ? 'Сохранить курс' : 'Создать курс'}</button>
                </div>
              </form>
            )}

            {activePanel === 'lesson' && (
              <form onSubmit={saveLesson} className="manager-panel manager-form">
                <PanelTitle eyebrow="Урок" title={lessonDraft.id ? 'Редактирование урока' : 'Новый урок'}>
                  {lessonDraft.id && <StatusPill published={lessonDraft.is_published} />}
                  <button type="button" onClick={newLesson} disabled={!selectedCourseId} className="manager-button ghost">Новый урок</button>
                  <button type="button" onClick={deleteLesson} disabled={!selectedLessonId || saving === 'lesson-delete'} className="manager-button danger">Удалить</button>
                </PanelTitle>

                {!selectedCourseId ? <EmptyHint title="Курс не выбран" text="Выберите курс слева или создайте новый курс." /> : (
                  <>
                    <div className="manager-form-grid two">
                      <Field label="Название урока"><input required value={lessonDraft.title} onChange={event => setLessonDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="1-сабак, 1-бөлүм" /></Field>
                      <div className="manager-video-editor wide">
                        <div className="manager-video-head">
                          <div><span>Видео урока</span><strong>{filledVideoUrls(lessonDraft.video_urls, lessonDraft.youtube_url).length || 0} частей</strong></div>
                          <button type="button" onClick={addLessonVideo} className="manager-button ghost">+ Видео</button>
                        </div>
                        <div className="manager-video-list">
                          {editableVideoUrls(lessonDraft.video_urls, lessonDraft.youtube_url).map((url, index, list) => (
                            <div className="manager-video-row" key={`video-${index}`}>
                              <span>{index + 1}</span>
                              <input type="url" value={url} onChange={event => updateLessonVideo(index, event.target.value)} placeholder="https://youtube.com/watch?v=..." />
                              <button type="button" onClick={() => moveLessonVideo(index, -1)} disabled={index === 0} className="manager-icon-button" title="Выше">↑</button>
                              <button type="button" onClick={() => moveLessonVideo(index, 1)} disabled={index === list.length - 1} className="manager-icon-button" title="Ниже">↓</button>
                              <button type="button" onClick={() => removeLessonVideo(index)} disabled={list.length === 1 && !url} className="manager-icon-button danger" title="Удалить">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Field label="Краткое описание" className="wide"><textarea rows={3} value={lessonDraft.description} onChange={event => setLessonDraft(previous => ({ ...previous, description: event.target.value }))} placeholder="Что ученик поймёт после урока?" /></Field>
                      <Field label="Материал урока" className="wide"><textarea rows={9} value={lessonDraft.content} onChange={event => setLessonDraft(previous => ({ ...previous, content: event.target.value }))} placeholder="Текст урока, конспект, примеры кода..." /></Field>
                      <Field label="Порядок"><input type="number" min="0" value={lessonDraft.order} onChange={event => setLessonDraft(previous => ({ ...previous, order: event.target.value }))} /></Field>
                      <Field label="XP"><input type="number" min="0" value={lessonDraft.xp_reward} onChange={event => setLessonDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                      <Field label="Минуты"><input type="number" min="0" value={lessonDraft.duration_minutes} onChange={event => setLessonDraft(previous => ({ ...previous, duration_minutes: event.target.value }))} /></Field>
                    </div>
                    <div className="manager-form-footer">
                      <label className="manager-check"><input type="checkbox" checked={lessonDraft.is_published} onChange={event => setLessonDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> Опубликовать урок</label>
                      <button type="submit" disabled={saving === 'lesson'} className="manager-button primary">{saving === 'lesson' ? 'Сохраняю...' : lessonDraft.id ? 'Сохранить урок' : 'Создать урок'}</button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activePanel === 'quiz' && (
              <div className="manager-panel">
                <PanelTitle eyebrow="Тесты" title="Вопросы урока"><button type="button" onClick={resetQuizForm} disabled={!selectedLessonId} className="manager-button ghost">Новый тест</button></PanelTitle>

                {!selectedLessonId ? <EmptyHint title="Урок не выбран" text="Выберите урок, чтобы добавить тесты." /> : (
                  <div className="manager-split">
                    <div className="manager-list">
                      {quizzes.length ? quizzes.map((quiz, index) => (
                        <article key={quiz.id} className="manager-card-row">
                          <div><span>Вопрос {index + 1}</span><strong>{quiz.question}</strong><small>Ответ: {quiz.correct?.toUpperCase()} · +{quiz.xp_reward} XP</small></div>
                          <div><button type="button" onClick={() => setQuizDraft(toQuizDraft(quiz, selectedLessonId))} className="manager-button ghost">Изменить</button><button type="button" onClick={() => deleteQuiz(quiz.id)} disabled={saving === `quiz-${quiz.id}`} className="manager-button danger">×</button></div>
                        </article>
                      )) : <EmptyHint title="Тестов пока нет" text="Добавьте первый вопрос для выбранного урока." />}
                    </div>

                    <form onSubmit={saveQuiz} className="manager-subform">
                      <h3>{quizDraft.id ? 'Изменить тест' : 'Новый тест'}</h3>
                      <Field label="Вопрос"><textarea required rows={3} value={quizDraft.question} onChange={event => setQuizDraft(previous => ({ ...previous, question: event.target.value }))} placeholder="Что выведет print(2 + 2)?" /></Field>
                      {['a', 'b', 'c', 'd'].map(option => (
                        <Field key={option} label={`Вариант ${option.toUpperCase()}`}>
                          <div className="answer-row">
                            <input required value={quizDraft[`option_${option}`]} onChange={event => setQuizDraft(previous => ({ ...previous, [`option_${option}`]: event.target.value }))} />
                            <button type="button" onClick={() => setQuizDraft(previous => ({ ...previous, correct: option }))} className={`manager-button ${quizDraft.correct === option ? 'primary' : 'ghost'}`}>Верный</button>
                          </div>
                        </Field>
                      ))}
                      <Field label="XP"><input type="number" min="0" value={quizDraft.xp_reward} onChange={event => setQuizDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                      <div className="manager-form-footer right"><button type="submit" disabled={saving === 'quiz'} className="manager-button primary">{saving === 'quiz' ? 'Сохраняю...' : quizDraft.id ? 'Сохранить тест' : 'Добавить тест'}</button></div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activePanel === 'task' && (
              <div className="manager-panel">
                <PanelTitle eyebrow="Задачи" title="Автопроверка кода"><button type="button" onClick={resetTaskForm} disabled={!selectedLessonId} className="manager-button ghost">Новая задача</button></PanelTitle>

                {!selectedLessonId ? <EmptyHint title="Урок не выбран" text="Выберите урок, чтобы добавить задачи." /> : (
                  <div className="manager-split wide">
                    <div className="manager-list">
                      {tasks.length ? tasks.map((task, index) => (
                        <article key={task.id} className="manager-card-row">
                          <div><span>Задача {index + 1}</span><strong>{task.title_ru}</strong><small>{task.tests_count ?? task.tests?.length ?? 0} теста · +{task.xp_reward} XP</small></div>
                          <div><button type="button" onClick={() => setTaskDraft(toTaskDraft(task, selectedLessonId))} className="manager-button ghost">Изменить</button><button type="button" onClick={() => deleteTask(task.id)} disabled={saving === `task-${task.id}`} className="manager-button danger">×</button></div>
                        </article>
                      )) : <EmptyHint title="Задач пока нет" text="Добавьте практическую задачу с тестами проверки." />}
                    </div>

                    <form onSubmit={saveTask} className="manager-subform">
                      <h3>{taskDraft.id ? 'Изменить задачу' : 'Новая задача'}</h3>
                      <div className="manager-form-grid two">
                        <Field label="Название RU"><input required value={taskDraft.title_ru} onChange={event => setTaskDraft(previous => ({ ...previous, title_ru: event.target.value }))} placeholder="Знак числа" /></Field>
                        <Field label="Название KG"><input value={taskDraft.title_kg} onChange={event => setTaskDraft(previous => ({ ...previous, title_kg: event.target.value }))} placeholder="Сандын белгиси" /></Field>
                        <Field label="Условие RU" className="wide"><textarea required rows={4} value={taskDraft.description_ru} onChange={event => setTaskDraft(previous => ({ ...previous, description_ru: event.target.value }))} /></Field>
                        <Field label="Условие KG" className="wide"><textarea rows={4} value={taskDraft.description_kg} onChange={event => setTaskDraft(previous => ({ ...previous, description_kg: event.target.value }))} /></Field>
                        <Field label="Стартовый код" className="wide"><textarea rows={6} value={taskDraft.starter_code} onChange={event => setTaskDraft(previous => ({ ...previous, starter_code: event.target.value }))} /></Field>
                        <Field label="Пример входа"><textarea rows={3} value={taskDraft.sample_input} onChange={event => setTaskDraft(previous => ({ ...previous, sample_input: event.target.value }))} /></Field>
                        <Field label="Пример вывода"><textarea rows={3} value={taskDraft.sample_output} onChange={event => setTaskDraft(previous => ({ ...previous, sample_output: event.target.value }))} /></Field>
                      </div>

                      <section className="task-test-editor">
                        <div className="task-test-editor-head"><h4>Тесты проверки</h4><button type="button" onClick={addTaskTest} className="manager-button ghost">+ Тест</button></div>
                        {taskDraft.tests.map((test, index) => (
                          <div key={`${index}-${taskDraft.tests.length}`} className="manager-test-row">
                            <strong>#{index + 1}</strong>
                            <Field label="Ввод"><textarea rows={2} value={test.input} onChange={event => updateTaskTest(index, 'input', event.target.value)} /></Field>
                            <Field label="Ожидаемый вывод"><textarea rows={2} value={test.expected} onChange={event => updateTaskTest(index, 'expected', event.target.value)} /></Field>
                            <label className="manager-check compact"><input type="checkbox" checked={test.hidden} onChange={event => updateTaskTest(index, 'hidden', event.target.checked)} /> Скрытый</label>
                            <button type="button" onClick={() => removeTaskTest(index)} className="manager-button danger">×</button>
                          </div>
                        ))}
                      </section>

                      <div className="manager-form-grid three">
                        <Field label="Порядок"><input type="number" min="0" value={taskDraft.order} onChange={event => setTaskDraft(previous => ({ ...previous, order: event.target.value }))} /></Field>
                        <Field label="XP"><input type="number" min="0" value={taskDraft.xp_reward} onChange={event => setTaskDraft(previous => ({ ...previous, xp_reward: event.target.value }))} /></Field>
                        <label className="manager-check with-offset"><input type="checkbox" checked={taskDraft.is_published} onChange={event => setTaskDraft(previous => ({ ...previous, is_published: event.target.checked }))} /> Опубликована</label>
                      </div>

                      <div className="manager-form-footer right"><button type="submit" disabled={saving === 'task'} className="manager-button primary">{saving === 'task' ? 'Сохраняю...' : taskDraft.id ? 'Сохранить задачу' : 'Добавить задачу'}</button></div>
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
