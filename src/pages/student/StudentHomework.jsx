import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Icon from '../../components/Icon'
import StudentSidebar from '../../components/StudentSidebar'

const getError = (error) => error?.response?.data?.code
  || error?.response?.data?.detail
  || 'Не удалось проверить решение. Попробуй ещё раз.'

export default function StudentHomework() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [tasks, setTasks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [codes, setCodes] = useState({})
  const [language, setLanguage] = useState('ru')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const lessonId = searchParams.get('lesson')
    const endpoint = lessonId ? `homework/tasks/?lesson=${lessonId}` : 'homework/tasks/'
    Promise.all([
      api.get('users/me/'),
      api.get(endpoint),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([userResponse, tasksResponse, notificationsResponse]) => {
      const receivedTasks = tasksResponse.data || []
      setUser(userResponse.data)
      setTasks(receivedTasks)
      setCodes(Object.fromEntries(receivedTasks.map(task => [
        task.id,
        task.my_submission?.code || task.starter_code || '',
      ])))
      setSelectedId(receivedTasks[0]?.id ?? null)
      setNotifCount((notificationsResponse.data || []).filter(item => !item.is_read).length)
    }).catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate, searchParams])

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const done = Boolean(task.my_submission?.completed)
    if (filter === 'done') return done
    if (filter === 'todo') return !done
    return true
  }), [tasks, filter])

  const effectiveSelectedId = visibleTasks.some(task => task.id === selectedId)
    ? selectedId
    : visibleTasks[0]?.id ?? null
  const selected = tasks.find(task => task.id === effectiveSelectedId)
  const submission = selected?.my_submission
  const completed = tasks.filter(task => task.my_submission?.completed).length
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const code = selected ? (codes[selected.id] ?? selected.starter_code ?? '') : ''
  const title = selected ? (language === 'kg' && selected.title_kg ? selected.title_kg : selected.title_ru) : ''
  const description = selected
    ? (language === 'kg' && selected.description_kg ? selected.description_kg : selected.description_ru)
    : ''

  const checkSolution = async () => {
    if (!selected) return
    setChecking(true)
    setError('')
    try {
      const response = await api.post(`homework/tasks/${selected.id}/check/`, { code })
      setTasks(items => items.map(item => item.id === selected.id
        ? { ...item, my_submission: response.data }
        : item))
      if (response.data.xp_gained) {
        setUser(current => ({
          ...current,
          xp: response.data.total_xp,
          streak: response.data.streak ?? current?.streak,
        }))
      } else if (response.data.streak_updated) {
        setUser(current => ({ ...current, streak: response.data.streak ?? current?.streak }))
      }
    } catch (requestError) {
      setError(getError(requestError))
    } finally {
      setChecking(false)
    }
  }

  if (loading) return (
    <div className="app-loader"><div className="loader-inner"><span className="loader-dot" /> Готовим задачи</div></div>
  )

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />
      <main className="ml-56 flex-1 homework-main">
        <header className="page-heading homework-heading">
          <div>
            <div className="page-kicker"><span /> Практика Python</div>
            <h1>Домашние задания</h1>
            <p>Решай задачи и сразу проверяй код на тестах.</p>
          </div>
          <div className="homework-progress-card">
            <div><span>Прогресс</span><strong>{completed} / {tasks.length}</strong></div>
            <div className="homework-progress-track"><i style={{ width: `${percent}%` }} /></div>
            <small>{percent}% заданий выполнено</small>
          </div>
        </header>

        {tasks.length === 0 ? (
          <section className="content-panel empty-state homework-empty">
            <div className="empty-icon"><Icon name="task" /></div>
            <h3>Заданий пока нет</h3>
            <p>Когда преподаватель опубликует задачу, она появится здесь.</p>
          </section>
        ) : (
          <section className="homework-workspace">
            <aside className="task-library">
              <div className="task-library-head">
                <div>
                  <span className="panel-kicker">Твоя очередь</span>
                  <h2>Задачи</h2>
                </div>
                <span className="task-total">{tasks.length}</span>
              </div>
              <div className="task-filters">
                {[
                  ['all', 'Все'], ['todo', 'Решить'], ['done', 'Готово'],
                ].map(([value, label]) => (
                  <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="task-list">
                {visibleTasks.map((task, index) => {
                  const done = Boolean(task.my_submission?.completed)
                  const failed = task.my_submission && !task.my_submission.passed
                  return (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => { setSelectedId(task.id); setError('') }}
                      className={`task-list-item${effectiveSelectedId === task.id ? ' active' : ''}`}
                    >
                      <span className={`task-index${done ? ' done' : failed ? ' failed' : ''}`}>
                        {done ? <Icon name="check" size={15} /> : String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="task-list-copy">
                        <small>{task.lesson_title}</small>
                        <strong>{language === 'kg' && task.title_kg ? task.title_kg : task.title_ru}</strong>
                      </span>
                      <span className="task-xp">+{task.xp_reward} XP</span>
                    </button>
                  )
                })}
                {visibleTasks.length === 0 && <div className="task-list-empty">В этом разделе пока пусто.</div>}
              </div>
            </aside>

            {selected && (
              <div className="task-studio">
                <article className="task-brief">
                  <div className="task-brief-top">
                    <div className="task-breadcrumb"><span>{selected.course_title}</span><i />{selected.lesson_title}</div>
                    <div className="language-toggle" aria-label="Язык задания">
                      <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
                      <button className={language === 'kg' ? 'active' : ''} onClick={() => setLanguage('kg')}>KG</button>
                    </div>
                  </div>
                  <h2>{title}</h2>
                  <p>{description}</p>
                  <div className="task-examples">
                    <div><small>Входные данные</small><pre>{selected.sample_input || '—'}</pre></div>
                    <div><small>Ожидаемый вывод</small><pre>{selected.sample_output || '—'}</pre></div>
                    <div className="task-tests-count"><Icon name="shield" size={17} /><span><strong>{selected.tests_count}</strong> теста</span></div>
                  </div>
                </article>

                <div className="code-editor-card">
                  <div className="editor-toolbar">
                    <div className="editor-file"><span className="python-dot">Py</span><span>solution.py</span><i>Python 3</i></div>
                    <button type="button" className="editor-reset" onClick={() => setCodes(items => ({ ...items, [selected.id]: selected.starter_code || '' }))}>
                      <Icon name="refresh" size={15} /> Сбросить
                    </button>
                  </div>
                  <div className="editor-body">
                    <div className="editor-lines" aria-hidden="true">
                      {Array.from({ length: Math.max(code.split('\n').length, 12) }, (_, index) => <span key={index}>{index + 1}</span>)}
                    </div>
                    <textarea
                      value={code}
                      onChange={event => setCodes(items => ({ ...items, [selected.id]: event.target.value }))}
                      onKeyDown={event => {
                        if (event.key === 'Tab') {
                          event.preventDefault()
                          const start = event.currentTarget.selectionStart
                          const end = event.currentTarget.selectionEnd
                          const next = `${code.slice(0, start)}    ${code.slice(end)}`
                          setCodes(items => ({ ...items, [selected.id]: next }))
                          requestAnimationFrame(() => {
                            event.target.selectionStart = event.target.selectionEnd = start + 4
                          })
                        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                          event.preventDefault()
                          checkSolution()
                        }
                      }}
                      spellCheck="false"
                      aria-label="Код решения"
                    />
                  </div>
                  <div className="editor-footer">
                    <div className="editor-hint"><Icon name="bolt" size={15} /> Ctrl + Enter — быстрая проверка</div>
                    <button type="button" className="run-code-button" disabled={checking} onClick={checkSolution}>
                      <Icon name={checking ? 'refresh' : 'play'} size={18} />
                      {checking ? 'Проверяем…' : 'Запустить тесты'}
                    </button>
                  </div>
                </div>

                {error && <div className="checker-message error"><Icon name="alert" /><span>{error}</span></div>}

                {submission && (
                  <section className={`test-report ${submission.passed ? 'passed' : 'failed'}`}>
                    <div className="test-report-head">
                      <div className="test-report-icon"><Icon name={submission.passed ? 'check' : 'alert'} /></div>
                      <div>
                        <span className="panel-kicker">Результат проверки</span>
                        <h3>{submission.passed ? 'Все тесты пройдены!' : 'Решение пока не прошло тесты'}</h3>
                        <p>{submission.passed
                          ? `Отличная работа${submission.xp_gained ? ` — получено ${submission.xp_gained} XP` : ''}.`
                          : submission.checker_error || 'Сравни результат и попробуй исправить код.'}</p>
                      </div>
                      <span className="attempt-counter">Попыток: {submission.attempts}</span>
                    </div>
                    <div className="test-results-grid">
                      {(submission.test_results || []).map(test => (
                        <div key={test.number} className={`test-result-card ${test.passed ? 'ok' : 'bad'}`}>
                          <div><span><Icon name={test.passed ? 'check' : 'alert'} size={14} /> Тест {test.number}</span><strong>{test.passed ? 'Пройден' : 'Ошибка'}</strong></div>
                          {test.hidden ? (
                            <p>Скрытый тест: данные откроются после урока.</p>
                          ) : test.error ? (
                            <p>{test.error}</p>
                          ) : (
                            <dl>
                              <div><dt>Ввод</dt><dd>{test.input || '—'}</dd></div>
                              <div><dt>Ожидалось</dt><dd>{test.expected || 'пустой вывод'}</dd></div>
                              {!test.passed && <div><dt>Получено</dt><dd>{test.actual || 'пустой вывод'}</dd></div>}
                            </dl>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
