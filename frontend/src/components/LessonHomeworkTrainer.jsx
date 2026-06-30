import { useMemo, useState } from 'react'
import api from '../api/axios'
import Icon from './Icon'

const requestError = error => error?.response?.data?.code
  || error?.response?.data?.detail
  || 'Не удалось проверить решение. Попробуй ещё раз.'

export default function LessonHomeworkTrainer({ initialTasks = [], onXpEarned }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedId, setSelectedId] = useState(initialTasks[0]?.id ?? null)
  const [language, setLanguage] = useState('ru')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [codes, setCodes] = useState(() => Object.fromEntries(initialTasks.map(task => [
    task.id,
    task.my_submission?.code || task.starter_code || '',
  ])))

  const selected = useMemo(
    () => tasks.find(task => task.id === selectedId) || tasks[0],
    [tasks, selectedId],
  )
  const submission = selected?.my_submission
  const code = selected ? (codes[selected.id] ?? selected.starter_code ?? '') : ''
  const title = selected
    ? (language === 'kg' && selected.title_kg ? selected.title_kg : selected.title_ru)
    : ''
  const description = selected
    ? (language === 'kg' && selected.description_kg ? selected.description_kg : selected.description_ru)
    : ''

  const checkSolution = async () => {
    if (!selected || checking) return
    setChecking(true)
    setError('')
    try {
      const response = await api.post(`homework/tasks/${selected.id}/check/`, { code })
      setTasks(items => items.map(item => item.id === selected.id
        ? { ...item, my_submission: response.data }
        : item))
      if (onXpEarned && (response.data.xp_gained || response.data.streak_updated)) {
        onXpEarned(response.data.total_xp, response.data.xp_gained || 0, response.data.streak)
      }
    } catch (errorResponse) {
      setError(requestError(errorResponse))
    } finally {
      setChecking(false)
    }
  }

  if (!tasks.length) {
    return (
      <div className="lesson-homework-empty">
        <div><Icon name="task" size={24} /></div>
        <h2>Задач по этому уроку пока нет</h2>
        <p>Когда преподаватель назначит практику именно к этой теме, она появится здесь.</p>
      </div>
    )
  }

  return (
    <div className="lesson-homework-trainer">
      <div className="lesson-task-header">
        <div>
          <span className="panel-kicker">Практика урока</span>
          <h2>Задачи по этой теме</h2>
          <p>Выбери задачу, напиши код и сразу запусти автоматические тесты.</p>
        </div>
        <div className="lesson-task-progress">
          <strong>{tasks.filter(task => task.my_submission?.completed).length}</strong>
          <span>из {tasks.length} решено</span>
        </div>
      </div>

      <div className="lesson-task-switcher">
        {tasks.map((task, index) => {
          const done = Boolean(task.my_submission?.completed)
          const failed = task.my_submission && !task.my_submission.passed
          return (
            <button
              type="button"
              key={task.id}
              className={`${selected?.id === task.id ? 'active' : ''}${done ? ' done' : failed ? ' failed' : ''}`}
              onClick={() => { setSelectedId(task.id); setError('') }}
            >
              <span>{done ? <Icon name="check" size={14} /> : index + 1}</span>
              <strong>{language === 'kg' && task.title_kg ? task.title_kg : task.title_ru}</strong>
              <small>+{task.xp_reward} XP</small>
            </button>
          )
        })}
      </div>

      <div className="task-studio lesson-task-studio">
        <article className="task-brief">
          <div className="task-brief-top">
            <div className="task-breadcrumb"><span>Домашнее задание</span><i />Задача №{tasks.findIndex(task => task.id === selected.id) + 1}</div>
            <div className="language-toggle" aria-label="Язык задания">
              <button type="button" className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
              <button type="button" className={language === 'kg' ? 'active' : ''} onClick={() => setLanguage('kg')}>KG</button>
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
                  const nextCode = `${code.slice(0, start)}    ${code.slice(end)}`
                  setCodes(items => ({ ...items, [selected.id]: nextCode }))
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
                  : submission.checker_error || 'Сравни результат и исправь код.'}</p>
              </div>
              <span className="attempt-counter">Попыток: {submission.attempts}</span>
            </div>
            <div className="test-results-grid">
              {(submission.test_results || []).map(test => (
                <div key={test.number} className={`test-result-card ${test.passed ? 'ok' : 'bad'}`}>
                  <div><span><Icon name={test.passed ? 'check' : 'alert'} size={14} /> Тест {test.number}</span><strong>{test.passed ? 'Пройден' : 'Ошибка'}</strong></div>
                  {test.hidden ? <p>Скрытый тест: входные данные не показываются.</p> : test.error ? <p>{test.error}</p> : (
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
    </div>
  )
}
