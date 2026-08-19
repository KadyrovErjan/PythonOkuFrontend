import { useState } from 'react'
import DashboardContainer from '../../components/DashboardContainer'
import Icon from '../../components/Icon'

const initialCode = `def hello(name):
    # Напиши приветствие здесь
    return f"Привет, {name}!"

print(hello("PythonOku"))`

const tasks = [
  { num: '01', title: 'Функции и аргументы', desc: 'Создай функцию, которая принимает имя и возвращает приветствие.', xp: 25, done: true },
  { num: '02', title: 'F-строки', desc: 'Собери строку с переменной внутри через f"...".', xp: 30, done: true },
  { num: '03', title: 'Вызов и вывод', desc: 'Вызови функцию и напечатай результат в терминал.', xp: 35, done: false },
  { num: '04', title: 'Бонус: обработка ошибок', desc: 'Добавь проверку, если имя пустое.', xp: 50, done: false },
]

const editorLines = [1, 2, 3, 4, 5, 6, 7]

export default function StudentLearn() {
  const [code, setCode] = useState(initialCode)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState([
    { kind: 'mint', text: 'Python 3.12.7 · PythonOku Sandbox' },
    { kind: 'dim', text: 'Готов к выполнению. Нажми «Запустить код» — результат появится ниже.' },
  ])

  const runCode = () => {
    setRunning(true)
    setOutput([
      { kind: 'mint', text: 'Python 3.12.7 · PythonOku Sandbox' },
      { kind: 'dim', text: 'Выполнение кода…' },
    ])
    window.setTimeout(() => {
      setRunning(false)
      setOutput([
        { kind: 'mint', text: '>>> print(hello("PythonOku"))' },
        { kind: 'plain', text: 'Привет, PythonOku!' },
        { kind: 'mint', text: '✓ Готово · 0 ошибок · 35 XP' },
      ])
    }, 900)
  }

  return (
    <DashboardContainer username="Али" progressPercent={65} streak={7} xp={2140}>
      <div className="gamified-workspace">
        {/* Left: reading panel — directions + theory task cards */}
        <section className="gamified-read-panel" aria-label="Материал урока">
          <article className="gamified-lesson-card">
            <div className="gamified-lesson-kicker">
              <Icon name="book" size={15} /> Урок 4 · Основы функций
            </div>
            <h2>Пишем первую функцию</h2>
            <p>
              Функции помогают переиспользовать код. Объяви функцию через{' '}
              <code>def</code>, прими аргумент <code>name</code> и верни строку с
              приветствием. Затем вызови её и выведи результат.
            </p>
          </article>

          <div className="gamified-task-list">
            {tasks.map((task, index) => (
              <article
                key={task.num}
                className={`gamified-task-card${task.done ? ' done' : ''}`}
              >
                <span className="gamified-task-state">
                  {task.done ? <Icon name="check" size={14} /> : String(index + 1).padStart(2, '0')}
                </span>
                <div className="gamified-task-copy">
                  <strong>{task.title}</strong>
                  <span>{task.desc}</span>
                </div>
                <span className="gamified-task-xp">+{task.xp} XP</span>
              </article>
            ))}
          </div>
        </section>

        {/* Right: dark coding pane — mock editor + mint console */}
        <section className="gamified-code-panel" aria-label="Код и терминал">
          <div className="gamified-editor">
            <div className="gamified-editor-titlebar">
              <span className="gamified-editor-file">
                <i>Py</i> main.py
              </span>
              <span className="gamified-editor-actions">
                <span className="gamified-editor-dot" />
                <span className="gamified-editor-dot" />
                <span className="gamified-editor-dot" />
              </span>
            </div>

            <div className="gamified-editor-body">
              <div className="gamified-editor-lines">
                {editorLines.map(n => <span key={n}>{n}</span>)}
              </div>
              <textarea
                className="gamified-editor-code"
                value={code}
                spellCheck={false}
                onChange={e => setCode(e.target.value)}
                aria-label="Редактор кода"
              />
            </div>

            <div className="gamified-editor-footer">
              <span className="gamified-editor-hint">
                <i /> Python 3.12 · автосохранение включено
              </span>
              <button
                type="button"
                className="gamified-run-button"
                onClick={runCode}
                disabled={running}
              >
                <Icon name="play" size={16} />
                {running ? 'Запускаем…' : 'Запустить код'}
              </button>
            </div>
          </div>

          <div className="gamified-console">
            <div className="gamified-console-titlebar">
              <span><i /> Терминал</span>
              <span>PythonOku Console</span>
            </div>
            <div className="gamified-console-body">
              {output.map((line, idx) => (
                <div key={idx} className={`gamified-console-line ${line.kind}`}>
                  <span className="gamified-console-prompt">{'>'}</span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardContainer>
  )
}