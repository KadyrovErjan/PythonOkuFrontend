import { useEffect, useMemo, useState } from 'react'
import TeacherSidebar from '../../components/TeacherSidebar'
import api from '../../api/axios'

const emptyCourse = {
  title: '',
  description: '',
  is_published: false,
}

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
  starter_code: '# Напиши решение здесь\n',
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
  if (!Array.isArray(tests) || tests.length === 0) {
    return [{ input: '', expected: '', hidden: false }]
  }

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
    starter_code: task?.starter_code ?? '# Напиши решение здесь\n',
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
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${
      published
        ? 'border-teal-400/25 bg-teal-400/10 text-teal-200'
        : 'border-slate-600/60 bg-slate-800/70 text-slate-400'
    }`}>
      <span className={`h-2 w-2 rounded-full ${published ? 'bg-teal-300' : 'bg-slate-500'}`} />
      {published ? 'Опубликовано' : 'Черновик'}
    </span>
  )
}

function EmptyHint({ title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/35 p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-400/10 text-2xl">🧭</div>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-lg leading-8 text-slate-400">{text}</p>
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

  const stats = [
    { label: 'Курсов', value: courses.length, caption: 'в учебной программе' },
    { label: 'Уроков', value: lessons.length, caption: selectedCourse ? selectedCourse.title : 'выберите курс' },
    { label: 'Тестов', value: quizzes.length, caption: 'в выбранном уроке' },
    { label: 'Задач', value: tasks.length, caption: 'практика с автопроверкой' },
  ]

  const fieldClass = 'w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-5 py-4 text-lg text-white placeholder-slate-500 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-400/10'
  const labelClass = 'mb-2 block text-sm font-black uppercase tracking-[0.14em] text-slate-400'
  const primaryButtonClass = 'inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-teal-400 px-6 py-4 text-lg font-black text-slate-950 shadow-lg shadow-teal-500/15 transition hover:bg-teal-300 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400'
  const secondaryButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-base font-black text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
  const dangerButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-3 text-base font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50'

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

        const loadedCourses = courseResponse.data
        setCourses(loadedCourses)
        setNotifCount(Array.isArray(notificationResponse.data) ? notificationResponse.data.length : 0)

        const firstCourse = loadedCourses[0]
        if (!firstCourse) {
          setCourseDraft(emptyCourse)
          setLessonDraft(emptyLesson())
          setQuizDraft(emptyQuiz())
          setTaskDraft(emptyTask())
          return
        }

        setSelectedCourseId(String(firstCourse.id))
        setCourseDraft(toCourseDraft(firstCourse))

        const lessonsResponse = await api.get(`courses/${firstCourse.id}/lessons/`)
        if (!active) return

        const loadedLessons = lessonsResponse.data
        setLessons(loadedLessons)

        const firstLesson = loadedLessons[0]
        if (firstLesson) {
          const [lessonResponse, quizzesResponse, tasksResponse] = await Promise.all([
            api.get(`lessons/${firstLesson.id}/`),
            api.get(`lessons/${firstLesson.id}/quizzes/`),
            api.get(`homework/tasks/?lesson=${firstLesson.id}`),
          ])
          if (!active) return

          setSelectedLessonId(String(firstLesson.id))
          setLessonDraft(toLessonDraft(lessonResponse.data, firstCourse.id))
          setQuizzes(quizzesResponse.data)
          setTasks(tasksResponse.data)
          setQuizDraft(emptyQuiz(firstLesson.id))
          setTaskDraft(emptyTask(firstLesson.id))
        } else {
          setSelectedLessonId('')
          setLessonDraft(emptyLesson(firstCourse.id))
          setQuizzes([])
          setTasks([])
          setQuizDraft(emptyQuiz())
          setTaskDraft(emptyTask())
        }
      } catch {
        if (active) setMessage('Не удалось загрузить курсы. Проверьте, что сервер Django запущен.')
      } finally {
        if (active) setLoading(false)
      }
    }

    boot()
    return () => {
      active = false
    }
  }, [])

  async function refreshCourses(preferredCourseId = selectedCourseId) {
    const response = await api.get('courses/')
    setCourses(response.data)
    const preferred = response.data.find(course => String(course.id) === String(preferredCourseId))
    return preferred ?? response.data[0] ?? null
  }

  async function refreshNotifications() {
    const response = await api.get('notifications/?unread=1').catch(() => ({ data: [] }))
    setNotifCount(Array.isArray(response.data) ? response.data.length : 0)
  }

  async function selectCourse(courseId) {
    if (!courseId) return

    setSelectedCourseId(String(courseId))
    setSelectedLessonId('')
    setLoadingLesson(true)
    setMessage('')

    try {
      const [courseResponse, lessonsResponse] = await Promise.all([
        api.get(`courses/${courseId}/`),
        api.get(`courses/${courseId}/lessons/`),
      ])

      setCourseDraft(toCourseDraft(courseResponse.data))
      setLessons(lessonsResponse.data)

      const firstLesson = lessonsResponse.data[0]
      if (firstLesson) {
        await selectLesson(firstLesson.id, courseId)
      } else {
        setLessonDraft(emptyLesson(courseId))
        setQuizzes([])
        setTasks([])
        setQuizDraft(emptyQuiz())
        setTaskDraft(emptyTask())
      }
    } catch {
      setMessage('Не получилось открыть курс.')
    } finally {
      setLoadingLesson(false)
    }
  }

  async function selectLesson(lessonId, fallbackCourseId = selectedCourseId) {
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
      setQuizzes(quizzesResponse.data)
      setTasks(tasksResponse.data)
      setQuizDraft(emptyQuiz(lessonId))
      setTaskDraft(emptyTask(lessonId))
    } catch {
      setMessage('Не получилось открыть урок.')
    } finally {
      setLoadingLesson(false)
    }
  }

  function newCourse() {
    setSelectedCourseId('')
    setSelectedLessonId('')
    setCourseDraft(emptyCourse)
    setLessonDraft(emptyLesson())
    setLessons([])
    setQuizzes([])
    setTasks([])
    setQuizDraft(emptyQuiz())
    setTaskDraft(emptyTask())
    setMessage('Создайте курс, затем добавьте к нему уроки, тесты и задачи.')
  }

  function newLesson() {
    if (!selectedCourseId) {
      setMessage('Сначала выберите или создайте курс.')
      return
    }
    setSelectedLessonId('')
    setLessonDraft(emptyLesson(selectedCourseId))
    setQuizzes([])
    setTasks([])
    setQuizDraft(emptyQuiz())
    setTaskDraft(emptyTask())
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
        await selectCourse(response.data.id)
      }
      await refreshNotifications()
    } catch {
      setMessage('Не удалось сохранить курс. Проверьте заполнение полей.')
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
        newCourse()
      }
      setMessage('Курс удалён.')
    } catch {
      setMessage('Не удалось удалить курс.')
    } finally {
      setSaving('')
    }
  }

  async function saveLesson(event) {
    event.preventDefault()

    if (!selectedCourseId) {
      setMessage('Сначала выберите курс.')
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
        const response = await api.patch(`lessons/${lessonDraft.id}/`, {
          ...payload,
          course: Number(selectedCourseId),
        })
        setLessonDraft(toLessonDraft(response.data, selectedCourseId))
        const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
        setLessons(lessonsResponse.data)
        setMessage('Урок сохранён.')
      } else {
        const response = await api.post(`courses/${selectedCourseId}/lessons/`, payload)
        const lessonsResponse = await api.get(`courses/${selectedCourseId}/lessons/`)
        setLessons(lessonsResponse.data)
        await selectLesson(response.data.id, selectedCourseId)
        await refreshCourses(selectedCourseId)
        setMessage('Урок создан. Теперь добавьте тесты и задачи.')
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
      setLessons(lessonsResponse.data)

      const nextLesson = lessonsResponse.data[0]
      if (nextLesson) {
        await selectLesson(nextLesson.id, selectedCourseId)
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
      setQuizzes(response.data)
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
      .map(test => ({
        input: test.input ?? '',
        expected: test.expected ?? '',
        hidden: Boolean(test.hidden),
      }))
      .filter(test => test.input.trim() || test.expected.trim())

    if (!tests.length) {
      return null
    }

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
      setTasks(response.data)
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
    setTaskDraft(previous => ({
      ...previous,
      tests: [...previous.tests, { input: '', expected: '', hidden: false }],
    }))
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
    <div className="min-h-screen bg-slate-950">
      <TeacherSidebar notifCount={notifCount} />

      <main className="ml-56 flex-1 p-8 xl:p-12">
        <div className="mb-8 flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-teal-200">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-300 shadow-lg shadow-teal-300/40" />
              Пульт преподавателя
            </div>
            <h1 className="text-5xl font-black leading-tight text-white xl:text-7xl">
              Курсы, уроки, тесты и задачи
            </h1>
            <p className="mt-4 max-w-4xl text-xl leading-9 text-slate-400">
              Отдельную страницу ДЗ убрал из навигации. Теперь всё редактируется прямо здесь:
              выберите курс, выберите урок и меняйте материалы, тесты и задачи в одном экране.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={newCourse} className={primaryButtonClass}>
              + Новый курс
            </button>
            <button type="button" onClick={() => selectCourse(selectedCourseId)} disabled={!selectedCourseId || loading} className={secondaryButtonClass}>
              Обновить
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl border border-teal-400/20 bg-teal-400/10 px-6 py-5 text-lg font-bold text-teal-100">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {stats.map(item => (
            <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20">
              <div className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
              <div className="mt-3 text-4xl font-black text-white">{item.value}</div>
              <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-base text-slate-400">{item.caption}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[28rem_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Учебная программа</div>
                  <h2 className="mt-1 text-3xl font-black text-white">Курсы</h2>
                </div>
                <span className="rounded-2xl bg-slate-800 px-4 py-2 text-lg font-black text-teal-200">{courses.length}</span>
              </div>

              <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="rounded-3xl bg-slate-950/60 p-6 text-lg font-bold text-slate-400">Загрузка...</div>
                ) : courses.length ? courses.map(course => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => selectCourse(course.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      String(course.id) === String(selectedCourseId)
                        ? 'border-teal-300/50 bg-teal-400/10 shadow-lg shadow-teal-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-white">{course.title}</h3>
                        <p className="mt-2 text-base leading-7 text-slate-400">{course.description || 'Описание курса не заполнено.'}</p>
                      </div>
                      <StatusPill published={course.is_published} />
                    </div>
                    <div className="mt-4 text-base font-bold text-slate-500">📚 {course.lessons_count ?? 0} уроков</div>
                  </button>
                )) : (
                  <EmptyHint title="Курсов пока нет" text="Нажмите «Новый курс», заполните название и сохраните." />
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Выбранный курс</div>
                  <h2 className="mt-1 text-3xl font-black text-white">Уроки</h2>
                </div>
                <button type="button" onClick={newLesson} disabled={!selectedCourseId} className={secondaryButtonClass}>
                  + Урок
                </button>
              </div>

              <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {!selectedCourseId ? (
                  <EmptyHint title="Выберите курс" text="После выбора курса здесь появятся его уроки." />
                ) : loadingLesson ? (
                  <div className="rounded-3xl bg-slate-950/60 p-6 text-lg font-bold text-slate-400">Открываю уроки...</div>
                ) : lessons.length ? lessons.map(lesson => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => selectLesson(lesson.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      String(lesson.id) === String(selectedLessonId)
                        ? 'border-purple-300/50 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Урок №{lesson.order}</div>
                        <h3 className="mt-1 text-xl font-black text-white">{lesson.title}</h3>
                        <p className="mt-2 text-base text-slate-400">{lesson.duration_minutes || 0} мин · +{lesson.xp_reward || 0} XP</p>
                      </div>
                      <StatusPill published={lesson.is_published} />
                    </div>
                  </button>
                )) : (
                  <EmptyHint title="Уроков нет" text="Нажмите «+ Урок», чтобы добавить первый урок к курсу." />
                )}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 xl:p-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-teal-200">Курс</div>
                  <h2 className="mt-1 text-4xl font-black text-white">{selectedCourseId ? 'Редактирование курса' : 'Новый курс'}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedCourseId && <StatusPill published={courseDraft.is_published} />}
                  <button type="button" onClick={deleteCourse} disabled={!selectedCourseId || saving === 'course-delete'} className={dangerButtonClass}>
                    Удалить курс
                  </button>
                </div>
              </div>

              <form onSubmit={saveCourse} className="grid gap-5">
                <label>
                  <span className={labelClass}>Название курса</span>
                  <input
                    required
                    value={courseDraft.title}
                    onChange={event => setCourseDraft(previous => ({ ...previous, title: event.target.value }))}
                    className={fieldClass}
                    placeholder="Например: Python программалоо курсу"
                  />
                </label>

                <label>
                  <span className={labelClass}>Описание курса</span>
                  <textarea
                    required
                    rows={4}
                    value={courseDraft.description}
                    onChange={event => setCourseDraft(previous => ({ ...previous, description: event.target.value }))}
                    className={`${fieldClass} resize-y leading-8`}
                    placeholder="Коротко расскажите, чему ученик научится."
                  />
                </label>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <label className="inline-flex items-center gap-3 text-lg font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={courseDraft.is_published}
                      onChange={event => setCourseDraft(previous => ({ ...previous, is_published: event.target.checked }))}
                      className="h-5 w-5 accent-teal-400"
                    />
                    Опубликовать курс для учеников
                  </label>

                  <button type="submit" disabled={saving === 'course'} className={primaryButtonClass}>
                    {saving === 'course' ? 'Сохраняю...' : selectedCourseId ? 'Сохранить курс' : 'Создать курс'}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 xl:p-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-purple-200">Урок</div>
                  <h2 className="mt-1 text-4xl font-black text-white">{lessonDraft.id ? 'Редактирование урока' : 'Новый урок'}</h2>
                  <p className="mt-2 text-lg text-slate-400">{selectedCourse ? selectedCourse.title : 'Сначала выберите курс.'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {lessonDraft.id && <StatusPill published={lessonDraft.is_published} />}
                  <button type="button" onClick={newLesson} disabled={!selectedCourseId} className={secondaryButtonClass}>
                    Очистить для нового урока
                  </button>
                  <button type="button" onClick={deleteLesson} disabled={!selectedLessonId || saving === 'lesson-delete'} className={dangerButtonClass}>
                    Удалить урок
                  </button>
                </div>
              </div>

              {!selectedCourseId ? (
                <EmptyHint title="Курс не выбран" text="Выберите курс слева или создайте новый, чтобы редактировать уроки." />
              ) : (
                <form onSubmit={saveLesson} className="grid gap-5">
                  <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                    <label>
                      <span className={labelClass}>Название урока</span>
                      <input
                        required
                        value={lessonDraft.title}
                        onChange={event => setLessonDraft(previous => ({ ...previous, title: event.target.value }))}
                        className={fieldClass}
                        placeholder="Например: 1-сабак, 1-бөлүм"
                      />
                    </label>

                    <label>
                      <span className={labelClass}>YouTube ссылка</span>
                      <input
                        type="url"
                        value={lessonDraft.youtube_url}
                        onChange={event => setLessonDraft(previous => ({ ...previous, youtube_url: event.target.value }))}
                        className={fieldClass}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </label>
                  </div>

                  <label>
                    <span className={labelClass}>Краткое описание урока</span>
                    <textarea
                      rows={3}
                      value={lessonDraft.description}
                      onChange={event => setLessonDraft(previous => ({ ...previous, description: event.target.value }))}
                      className={`${fieldClass} resize-y leading-8`}
                      placeholder="Что ученик поймёт после этого урока?"
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Материал урока</span>
                    <textarea
                      rows={8}
                      value={lessonDraft.content}
                      onChange={event => setLessonDraft(previous => ({ ...previous, content: event.target.value }))}
                      className={`${fieldClass} resize-y font-mono leading-8`}
                      placeholder="Текст урока, конспект, примеры кода..."
                    />
                  </label>

                  <div className="grid gap-5 md:grid-cols-3">
                    <label>
                      <span className={labelClass}>Порядок</span>
                      <input
                        type="number"
                        min="0"
                        value={lessonDraft.order}
                        onChange={event => setLessonDraft(previous => ({ ...previous, order: event.target.value }))}
                        className={fieldClass}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Награда XP</span>
                      <input
                        type="number"
                        min="0"
                        value={lessonDraft.xp_reward}
                        onChange={event => setLessonDraft(previous => ({ ...previous, xp_reward: event.target.value }))}
                        className={fieldClass}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Минуты видео</span>
                      <input
                        type="number"
                        min="0"
                        value={lessonDraft.duration_minutes}
                        onChange={event => setLessonDraft(previous => ({ ...previous, duration_minutes: event.target.value }))}
                        className={fieldClass}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <label className="inline-flex items-center gap-3 text-lg font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={lessonDraft.is_published}
                        onChange={event => setLessonDraft(previous => ({ ...previous, is_published: event.target.checked }))}
                        className="h-5 w-5 accent-purple-400"
                      />
                      Опубликовать урок для учеников
                    </label>

                    <button type="submit" disabled={saving === 'lesson'} className={primaryButtonClass}>
                      {saving === 'lesson' ? 'Сохраняю...' : lessonDraft.id ? 'Сохранить урок' : 'Создать урок'}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {selectedLessonId ? (
              <div className="grid gap-6 2xl:grid-cols-2">
                <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 xl:p-8">
                  <div className="mb-6">
                    <div className="text-sm font-black uppercase tracking-[0.14em] text-blue-200">Тесты урока</div>
                    <h2 className="mt-1 text-4xl font-black text-white">Вопросы</h2>
                    <p className="mt-2 text-lg text-slate-400">{selectedLesson?.title || lessonDraft.title}</p>
                  </div>

                  <div className="mb-6 grid gap-3">
                    {quizzes.length ? quizzes.map((quiz, index) => (
                      <div key={quiz.id} className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Вопрос {index + 1}</div>
                            <h3 className="mt-1 text-xl font-black text-white">{quiz.question}</h3>
                            <p className="mt-2 text-base font-bold text-slate-400">Правильный вариант: {quiz.correct?.toUpperCase()} · +{quiz.xp_reward} XP</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setQuizDraft(toQuizDraft(quiz, selectedLessonId))} className={secondaryButtonClass}>Изменить</button>
                            <button type="button" onClick={() => deleteQuiz(quiz.id)} disabled={saving === `quiz-${quiz.id}`} className={dangerButtonClass}>×</button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <EmptyHint title="Тестов пока нет" text="Добавьте вопросы, которые ученик будет проходить после урока." />
                    )}
                  </div>

                  <form onSubmit={saveQuiz} className="grid gap-5 rounded-3xl border border-blue-400/10 bg-blue-400/5 p-5">
                    <h3 className="text-3xl font-black text-white">{quizDraft.id ? 'Изменить тест' : 'Новый тест'}</h3>
                    <label>
                      <span className={labelClass}>Вопрос</span>
                      <textarea
                        required
                        rows={3}
                        value={quizDraft.question}
                        onChange={event => setQuizDraft(previous => ({ ...previous, question: event.target.value }))}
                        className={`${fieldClass} resize-y leading-8`}
                        placeholder="Что выведет print(2 + 2)?"
                      />
                    </label>

                    {['a', 'b', 'c', 'd'].map(option => (
                      <label key={option}>
                        <span className={labelClass}>
                          Вариант {option.toUpperCase()}
                          {quizDraft.correct === option && <span className="ml-2 text-teal-200">✓ правильный</span>}
                        </span>
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
                          <input
                            required
                            value={quizDraft[`option_${option}`]}
                            onChange={event => setQuizDraft(previous => ({ ...previous, [`option_${option}`]: event.target.value }))}
                            className={fieldClass}
                            placeholder={`Ответ ${option.toUpperCase()}`}
                          />
                          <button
                            type="button"
                            onClick={() => setQuizDraft(previous => ({ ...previous, correct: option }))}
                            className={quizDraft.correct === option ? primaryButtonClass : secondaryButtonClass}
                          >
                            Верный
                          </button>
                        </div>
                      </label>
                    ))}

                    <label>
                      <span className={labelClass}>XP за правильный ответ</span>
                      <input
                        type="number"
                        min="0"
                        value={quizDraft.xp_reward}
                        onChange={event => setQuizDraft(previous => ({ ...previous, xp_reward: event.target.value }))}
                        className={fieldClass}
                      />
                    </label>

                    <div className="flex flex-col gap-3 xl:flex-row xl:justify-end">
                      <button type="button" onClick={resetQuizForm} className={secondaryButtonClass}>Очистить</button>
                      <button type="submit" disabled={saving === 'quiz'} className={primaryButtonClass}>
                        {saving === 'quiz' ? 'Сохраняю...' : quizDraft.id ? 'Сохранить тест' : 'Добавить тест'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 xl:p-8">
                  <div className="mb-6">
                    <div className="text-sm font-black uppercase tracking-[0.14em] text-teal-200">Практические задачи</div>
                    <h2 className="mt-1 text-4xl font-black text-white">Автопроверка кода</h2>
                    <p className="mt-2 text-lg text-slate-400">Это бывшее ДЗ: ученик решает задачу, сайт сам проверяет код по тестам.</p>
                  </div>

                  <div className="mb-6 grid gap-3">
                    {tasks.length ? tasks.map((task, index) => (
                      <div key={task.id} className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Задача {index + 1}</div>
                            <h3 className="mt-1 text-xl font-black text-white">{task.title_ru}</h3>
                            <p className="mt-2 text-base font-bold text-slate-400">{task.tests_count ?? task.tests?.length ?? 0} теста · +{task.xp_reward} XP</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setTaskDraft(toTaskDraft(task, selectedLessonId))} className={secondaryButtonClass}>Изменить</button>
                            <button type="button" onClick={() => deleteTask(task.id)} disabled={saving === `task-${task.id}`} className={dangerButtonClass}>×</button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <EmptyHint title="Задач пока нет" text="Добавьте задачу с тестами, и ученики смогут решать её прямо в уроке." />
                    )}
                  </div>

                  <form onSubmit={saveTask} className="grid gap-5 rounded-3xl border border-teal-400/10 bg-teal-400/5 p-5">
                    <h3 className="text-3xl font-black text-white">{taskDraft.id ? 'Изменить задачу' : 'Новая задача'}</h3>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <label>
                        <span className={labelClass}>Название RU</span>
                        <input
                          required
                          value={taskDraft.title_ru}
                          onChange={event => setTaskDraft(previous => ({ ...previous, title_ru: event.target.value }))}
                          className={fieldClass}
                          placeholder="Знак числа"
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Название KG</span>
                        <input
                          value={taskDraft.title_kg}
                          onChange={event => setTaskDraft(previous => ({ ...previous, title_kg: event.target.value }))}
                          className={fieldClass}
                          placeholder="Сандын белгиси"
                        />
                      </label>
                    </div>

                    <label>
                      <span className={labelClass}>Условие RU</span>
                      <textarea
                        required
                        rows={4}
                        value={taskDraft.description_ru}
                        onChange={event => setTaskDraft(previous => ({ ...previous, description_ru: event.target.value }))}
                        className={`${fieldClass} resize-y leading-8`}
                        placeholder="Пользователь вводит число. Определить, положительное оно или отрицательное."
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Условие KG</span>
                      <textarea
                        rows={4}
                        value={taskDraft.description_kg}
                        onChange={event => setTaskDraft(previous => ({ ...previous, description_kg: event.target.value }))}
                        className={`${fieldClass} resize-y leading-8`}
                        placeholder="Колдонуучу сан киргизет..."
                      />
                    </label>

                    <label>
                      <span className={labelClass}>Стартовый код</span>
                      <textarea
                        rows={7}
                        value={taskDraft.starter_code}
                        onChange={event => setTaskDraft(previous => ({ ...previous, starter_code: event.target.value }))}
                        className={`${fieldClass} resize-y font-mono leading-8`}
                      />
                    </label>

                    <div className="grid gap-5 xl:grid-cols-2">
                      <label>
                        <span className={labelClass}>Пример входа</span>
                        <textarea
                          rows={3}
                          value={taskDraft.sample_input}
                          onChange={event => setTaskDraft(previous => ({ ...previous, sample_input: event.target.value }))}
                          className={`${fieldClass} resize-y font-mono`}
                          placeholder="8"
                        />
                      </label>
                      <label>
                        <span className={labelClass}>Пример вывода</span>
                        <textarea
                          rows={3}
                          value={taskDraft.sample_output}
                          onChange={event => setTaskDraft(previous => ({ ...previous, sample_output: event.target.value }))}
                          className={`${fieldClass} resize-y font-mono`}
                          placeholder="Положительное"
                        />
                      </label>
                    </div>

                    <div className="rounded-3xl border border-slate-700/70 bg-slate-950/45 p-5">
                      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Тесты проверки</div>
                          <h4 className="mt-1 text-2xl font-black text-white">Вход → ожидаемый вывод</h4>
                        </div>
                        <button type="button" onClick={addTaskTest} className={secondaryButtonClass}>+ Добавить тест</button>
                      </div>

                      <div className="grid gap-4">
                        {taskDraft.tests.map((test, index) => (
                          <div key={`${index}-${taskDraft.tests.length}`} className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 xl:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_9rem_3rem] xl:items-end">
                            <div className="text-lg font-black text-slate-500">#{index + 1}</div>
                            <label>
                              <span className={labelClass}>Входные данные</span>
                              <textarea
                                rows={3}
                                value={test.input}
                                onChange={event => updateTaskTest(index, 'input', event.target.value)}
                                className={`${fieldClass} resize-y font-mono`}
                                placeholder="8"
                              />
                            </label>
                            <label>
                              <span className={labelClass}>Ожидаемый вывод</span>
                              <textarea
                                rows={3}
                                value={test.expected}
                                onChange={event => updateTaskTest(index, 'expected', event.target.value)}
                                className={`${fieldClass} resize-y font-mono`}
                                placeholder="Положительное"
                              />
                            </label>
                            <label className="inline-flex min-h-14 items-center gap-3 text-base font-bold text-slate-300">
                              <input
                                type="checkbox"
                                checked={test.hidden}
                                onChange={event => updateTaskTest(index, 'hidden', event.target.checked)}
                                className="h-5 w-5 accent-teal-400"
                              />
                              Скрытый
                            </label>
                            <button type="button" onClick={() => removeTaskTest(index)} className={dangerButtonClass}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                      <label>
                        <span className={labelClass}>Порядок</span>
                        <input
                          type="number"
                          min="0"
                          value={taskDraft.order}
                          onChange={event => setTaskDraft(previous => ({ ...previous, order: event.target.value }))}
                          className={fieldClass}
                        />
                      </label>
                      <label>
                        <span className={labelClass}>XP</span>
                        <input
                          type="number"
                          min="0"
                          value={taskDraft.xp_reward}
                          onChange={event => setTaskDraft(previous => ({ ...previous, xp_reward: event.target.value }))}
                          className={fieldClass}
                        />
                      </label>
                      <label className="flex items-center gap-3 pt-7 text-lg font-bold text-slate-200">
                        <input
                          type="checkbox"
                          checked={taskDraft.is_published}
                          onChange={event => setTaskDraft(previous => ({ ...previous, is_published: event.target.checked }))}
                          className="h-5 w-5 accent-teal-400"
                        />
                        Опубликована
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 xl:flex-row xl:justify-end">
                      <button type="button" onClick={resetTaskForm} className={secondaryButtonClass}>Очистить</button>
                      <button type="submit" disabled={saving === 'task'} className={primaryButtonClass}>
                        {saving === 'task' ? 'Сохраняю...' : taskDraft.id ? 'Сохранить задачу' : 'Добавить задачу'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            ) : (
              <EmptyHint
                title="Выберите урок"
                text="Когда урок выбран, ниже появятся большие формы для тестов и задач. Проверять работы студентов вручную не нужно — задачи проверяются автоматически."
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
