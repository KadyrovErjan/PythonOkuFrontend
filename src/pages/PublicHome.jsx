import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import BrandLogo from '../components/BrandLogo'

const HeroArt = () => (
  <svg viewBox="0 0 220 220" role="img" aria-label="Иллюстрация PythonOku" style={{ position: 'relative', zIndex: 1, width: 'min(52%, 18rem)', height: 'auto', filter: 'drop-shadow(0 22px 44px rgba(109,74,255,.22))' }}>
    <defs>
      <linearGradient id="py-ok-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6d4aff" />
        <stop offset="1" stopColor="#22c7b8" />
      </linearGradient>
    </defs>
    <rect x="28" y="20" width="164" height="180" rx="30" fill="#151d2e" stroke="rgba(164,174,194,.18)" strokeWidth="2" />
    <circle cx="62" cy="56" r="5" fill="#e85069" />
    <circle cx="82" cy="56" r="5" fill="#eba829" />
    <circle cx="102" cy="56" r="5" fill="#26b983" />
    <text x="58" y="108" fontFamily="ui-monospace,Consolas,monospace" fontSize="15" fill="#a591ff" fontWeight="700">for</text>
    <text x="96" y="108" fontFamily="ui-monospace,Consolas,monospace" fontSize="15" fill="#e9edf5"> step in</text>
    <text x="58" y="136" fontFamily="ui-monospace,Consolas,monospace" fontSize="15" fill="#e9edf5">  practice(step):</text>
    <text x="58" y="164" fontFamily="ui-monospace,Consolas,monospace" fontSize="15" fill="#8cebe2">  progress += 1</text>
  </svg>
)

const highlights = [
  { value: '20+', label: 'коротких уроков' },
  { value: '100%', label: 'практика в браузере' },
  { value: '1', label: 'понятный маршрут' },
]

const program = [
  {
    icon: 'book',
    title: 'Основы Python',
    text: 'Переменные, условия, циклы, функции и работа с данными на простых примерах.',
  },
  {
    icon: 'task',
    title: 'Задачи после урока',
    text: 'Каждая тема закрепляется практикой, чтобы знания не оставались только теорией.',
  },
  {
    icon: 'trend',
    title: 'Прогресс ученика',
    text: 'Ученик и преподаватель видят движение по курсу, домашние задания и результаты.',
  },
]

export default function PublicHome() {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link to="/" className="brand public-brand" aria-label="PythonOku">
          <BrandLogo />
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">онлайн-курс Python</div>
          </div>
        </Link>

        <nav className="public-nav" aria-label="Основная навигация">
          <a href="#program">Программа</a>
          <a href="#practice">Практика</a>
          <Link to="/login" className="public-login">Войти</Link>
        </nav>
      </header>

      <main>
        <section className="public-hero" aria-labelledby="public-title">
          <div className="public-hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> Python для начинающих</div>
            <h1 id="public-title">PythonOku</h1>
            <p className="public-lead">
              Онлайн-платформа для изучения Python: короткие уроки, практика,
              домашние задания и понятный прогресс для учеников.
            </p>
            <div className="public-actions">
              <Link to="/login" className="public-primary">
                <span>Начать обучение</span>
                <Icon name="arrow" size={18} />
              </Link>
              <a href="#program" className="public-secondary">Посмотреть курс</a>
              <a href="/logo.svg" download="pythonoku-logo.svg" className="public-secondary public-download">
                <Icon name="download" size={17} />
                <span>Скачать логотип</span>
              </a>
            </div>

            <dl className="public-stats">
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="public-visual" aria-hidden="true">
            <HeroArt />
            <div className="public-code-card">
              <div className="code-card-bar">
                <span /><span /><span />
                <span className="code-file">lesson.py</span>
              </div>
              <pre><span className="code-keyword">for</span> step <span className="code-keyword">in</span> <span className="code-string">&quot;PythonOku&quot;</span>:{`\n`}    practice(step){`\n`}    progress += 1</pre>
            </div>
          </div>
        </section>

        <section id="program" className="public-section" aria-labelledby="program-title">
          <div className="public-section-head">
            <span>Программа</span>
            <h2 id="program-title">От первой строки к уверенной практике</h2>
          </div>
          <div className="public-program-grid">
            {program.map((item) => (
              <article key={item.title} className="public-card">
                <div className="public-card-icon"><Icon name={item.icon} size={22} /></div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="practice" className="public-band" aria-labelledby="practice-title">
          <div>
            <span>Практика</span>
            <h2 id="practice-title">Код пишется сразу после объяснения</h2>
          </div>
          <p>
            PythonOku помогает ученику двигаться маленькими шагами: смотреть урок,
            решать задачи, отправлять домашние работы и видеть результат.
          </p>
          <Link to="/login" className="public-band-action">Перейти в кабинет</Link>
        </section>
      </main>
    </div>
  )
}
