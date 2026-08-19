import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import Icon from '../../components/Icon'
import TeacherSidebar from '../../components/TeacherSidebar'

const blankTask = () => ({
  lesson: '', title_ru: '', title_kg: '', description_ru: '', description_kg: '',
  starter_code: '# Прочитай данные через input()\n# Напиши решение здесь\n\n',
  sample_input: '', sample_output: '', xp_reward: 10, is_published: true,
  tests: [{ input: '', expected: '', hidden: false }],
})

export default function TeacherHomeworks() {
  const [tab, setTab] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [lessons, setLessons] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blankTask())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('homework/tasks/'),
      api.get('homework/submissions/'),
      api.get('courses/'),
    ]).then(async ([taskResponse, submissionResponse, courseResponse]) => {
      const courseDetails = await Promise.all((courseResponse.data || []).map(course => api.get(`courses/${course.id}/`)))
      if (!active) return
      setTasks(taskResponse.data || [])
      setSubmissions(submissionResponse.data || [])
      setLessons(courseDetails.flatMap(response => (response.data.lessons || []).map(lesson => ({
        ...lesson, course_title: response.data.title,
      }))))
      setSelected(submissionResponse.data?.[0] || null)
    }).catch(() => {
      if (active) setError('Не удалось загрузить задания.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const passed = submissions.filter(item => item.completed).length
  const failed = submissions.filter(item => !item.completed).length
  const sortedSubmissions = useMemo(() => [...submissions].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)), [submissions])

  const updateTest = (index, key, value) => setForm(current => ({
    ...current,
    tests: current.tests.map((test, testIndex) => testIndex === index ? { ...test, [key]: value } : test),
  }))

  const createTask = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.lesson || !form.title_ru.trim() || !form.description_ru.trim()) {
      setError('Заполни тему, название и условие задачи.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, lesson: Number(form.lesson), order: tasks.length + 1 }
      const response = await api.post('homework/tasks/', payload)
      setTasks(items => [...items, response.data])
      setForm(blankTask())
      setShowForm(false)
    } catch (requestError) {
      setError(requestError?.response?.data?.tests?.[0] || 'Не удалось сохранить задачу.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async task => {
    const response = await api.patch(`homework/tasks/${task.id}/`, { is_published: !task.is_published })
    setTasks(items => items.map(item => item.id === task.id ? response.data : item))
  }

  const deleteTask = async task => {
    if (!window.confirm(`Удалить задачу «${task.title_ru}»?`)) return
    await api.delete(`homework/tasks/${task.id}/`)
    setTasks(items => items.filter(item => item.id !== task.id))
  }

  if (loading) return (
    <div className="app-loader"><div className="loader-inner"><span className="loader-dot" /> Загружаем задания</div></div>
  )

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <TeacherSidebar />
      <main className="ml-56 flex-1 homework-main teacher-homework-main">
        <header className="page-heading homework-heading">
          <div>
            <div className="page-kicker teacher-kicker"><span /> Практика учеников</div>
            <h1>Домашние задания</h1>
            <p>Создавай задачи по темам и смотри автоматическую проверку решений.</p>
          </div>
          <button className="button button-primary teacher-button" onClick={() => setShowForm(true)}>
            <span className="button-plus">+</span> Новая задача
          </button>
        </header>

        <div className="teacher-homework-stats">
          <div><span>Опубликовано</span><strong>{tasks.filter(task => task.is_published).length}</strong><small>задач</small></div>
          <div><span>Решения</span><strong>{submissions.length}</strong><small>попыток</small></div>
          <div className="success"><span>Выполнено</span><strong>{passed}</strong><small>успешно</small></div>
          <div className="warning"><span>Нужна работа</span><strong>{failed}</strong><small>решений</small></div>
        </div>

        <div className="teacher-homework-tabs">
          <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}><Icon name="task" size={17} /> Задачи <span>{tasks.length}</span></button>
          <button className={tab === 'submissions' ? 'active' : ''} onClick={() => setTab('submissions')}><Icon name="users" size={17} /> Решения учеников <span>{submissions.length}</span></button>
        </div>

        {error && <div className="checker-message error"><Icon name="alert" /><span>{error}</span></div>}

        {tab === 'tasks' ? (
          <section className="teacher-task-table content-panel">
            <div className="panel-heading"><div><span className="panel-kicker">Учебная программа</span><h2>Задачи по темам</h2></div></div>
            {tasks.length === 0 ? <div className="empty-state"><h3>Создай первую задачу</h3></div> : (
              <div className="teacher-task-rows">
                {tasks.map((task, index) => (
                  <div className="teacher-task-row" key={task.id}>
                    <span className="teacher-task-number">{String(index + 1).padStart(2, '0')}</span>
                    <div className="teacher-task-copy"><small>{task.course_title} · {task.lesson_title}</small><strong>{task.title_ru}</strong><span>{task.tests_count} теста · +{task.xp_reward} XP</span></div>
                    <button className={`publish-pill ${task.is_published ? 'published' : ''}`} onClick={() => togglePublished(task)}>
                      <i /> {task.is_published ? 'Опубликовано' : 'Черновик'}
                    </button>
                    <button className="icon-action danger" title="Удалить" onClick={() => deleteTask(task)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="teacher-submission-layout">
            <div className="submission-list content-panel">
              <div className="panel-heading"><div><span className="panel-kicker">Последние попытки</span><h2>Решения</h2></div></div>
              {sortedSubmissions.length === 0 ? <div className="empty-state"><h3>Решений пока нет</h3></div> : sortedSubmissions.map(item => (
                <button key={item.id} className={`submission-item ${selected?.id === item.id ? 'active' : ''}`} onClick={() => setSelected(item)}>
                  <span className={`submission-avatar ${item.completed ? 'done' : ''}`}>{item.student_name?.[0]?.toUpperCase()}</span>
                  <span className="submission-copy"><strong>{item.student_name}</strong><small>{item.task_title}</small><i>{item.attempts} попыток</i></span>
                  <span className={`submission-state ${item.completed ? 'done' : 'failed'}`}>{item.completed ? 'Решено' : 'Ошибка'}</span>
                </button>
              ))}
            </div>
            <div className="submission-detail content-panel">
              {!selected ? <div className="empty-state"><p>Выбери решение ученика.</p></div> : <>
                <div className="submission-detail-head"><div><span className="panel-kicker">{selected.course_title} · {selected.lesson_title}</span><h2>{selected.task_title}</h2><p>{selected.student_name} · попыток: {selected.attempts}</p></div><span className={`submission-state ${selected.completed ? 'done' : 'failed'}`}>{selected.completed ? 'Тесты пройдены' : 'Есть ошибки'}</span></div>
                <div className="teacher-code-view"><div><span>solution.py</span><i>Python 3</i></div><pre>{selected.code}</pre></div>
                {selected.checker_error && <div className="checker-message error"><Icon name="alert" /><span>{selected.checker_error}</span></div>}
                <div className="compact-test-list">
                  {(selected.test_results || []).map(test => <div key={test.number} className={test.passed ? 'ok' : 'bad'}><Icon name={test.passed ? 'check' : 'alert'} size={15} /><span>Тест {test.number}</span><strong>{test.passed ? 'Пройден' : 'Ошибка'}</strong></div>)}
                </div>
              </>}
            </div>
          </section>
        )}

        {showForm && (
          <div className="task-modal-backdrop" onMouseDown={() => setShowForm(false)}>
            <form className="task-modal" onSubmit={createTask} onMouseDown={event => event.stopPropagation()}>
              <div className="task-modal-head"><div><span className="panel-kicker">Новое домашнее задание</span><h2>Добавить задачу</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>
              <div className="task-form-grid">
                <label className="full"><span>Тема урока *</span><select value={form.lesson} onChange={event => setForm({ ...form, lesson: event.target.value })}><option value="">Выбери тему</option>{lessons.map(lesson => <option value={lesson.id} key={lesson.id}>{lesson.course_title} — {lesson.title}</option>)}</select></label>
                <label><span>Название RU *</span><input value={form.title_ru} onChange={event => setForm({ ...form, title_ru: event.target.value })} placeholder="Например: Деление на 5" /></label>
                <label><span>Название KG</span><input value={form.title_kg} onChange={event => setForm({ ...form, title_kg: event.target.value })} placeholder="5ке бөлүү" /></label>
                <label><span>Условие RU *</span><textarea rows="3" value={form.description_ru} onChange={event => setForm({ ...form, description_ru: event.target.value })} /></label>
                <label><span>Условие KG</span><textarea rows="3" value={form.description_kg} onChange={event => setForm({ ...form, description_kg: event.target.value })} /></label>
                <label><span>Пример ввода</span><textarea rows="2" value={form.sample_input} onChange={event => setForm({ ...form, sample_input: event.target.value })} /></label>
                <label><span>Пример вывода</span><textarea rows="2" value={form.sample_output} onChange={event => setForm({ ...form, sample_output: event.target.value })} /></label>
              </div>
              <div className="task-tests-editor">
                <div className="task-tests-title"><div><span className="panel-kicker">Автопроверка</span><h3>Тесты</h3></div><button type="button" onClick={() => setForm(current => ({ ...current, tests: [...current.tests, { input: '', expected: '', hidden: true }] }))}>+ Добавить тест</button></div>
                {form.tests.map((test, index) => <div className="task-test-row" key={index}><span>#{index + 1}</span><label><small>Ввод</small><textarea rows="2" value={test.input} onChange={event => updateTest(index, 'input', event.target.value)} /></label><label><small>Ожидаемый вывод *</small><textarea rows="2" value={test.expected} onChange={event => updateTest(index, 'expected', event.target.value)} /></label><label className="hidden-check"><input type="checkbox" checked={test.hidden} onChange={event => updateTest(index, 'hidden', event.target.checked)} /> Скрытый</label>{form.tests.length > 1 && <button type="button" className="remove-test" onClick={() => setForm(current => ({ ...current, tests: current.tests.filter((_, itemIndex) => itemIndex !== index) }))}>×</button>}</div>)}
              </div>
              <div className="task-modal-footer"><label><span>Награда</span><input type="number" min="0" max="100" value={form.xp_reward} onChange={event => setForm({ ...form, xp_reward: Number(event.target.value) })} /> XP</label><div><button type="button" className="button button-ghost" onClick={() => setShowForm(false)}>Отмена</button><button className="button button-primary teacher-button" disabled={saving}>{saving ? 'Сохраняем…' : 'Опубликовать задачу'}</button></div></div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
