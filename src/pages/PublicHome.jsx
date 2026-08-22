import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '../components/Icon'
import BrandLogo from '../components/BrandLogo'
import LanguageSwitcher from '../components/LanguageSwitcher'

const HeroArt = () => (
  <svg viewBox="0 0 220 220" role="img" aria-label="PythonOku illustration" style={{ position: 'relative', zIndex: 1, width: 'min(52%, 18rem)', height: 'auto', filter: 'drop-shadow(0 22px 44px rgba(109,74,255,.22))' }}>
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

export default function PublicHome() {
  const { t } = useTranslation()
  
  const highlights = [
    { value: '20+', label: t('public.stats.lessons') },
    { value: '100%', label: t('public.features.practice') },
    { value: '1', label: t('dashboard.myProgress') },
  ]

  const program = [
    {
      icon: 'book',
      title: t('public.features.interactive'),
      text: t('public.features.interactiveDesc'),
    },
    {
      icon: 'task',
      title: t('homework.homework'),
      text: t('public.features.practiceDesc'),
    },
    {
      icon: 'trend',
      title: t('dashboard.myProgress'),
      text: t('public.features.communityDesc'),
    },
  ]

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link to="/" className="brand public-brand" aria-label="PythonOku">
          <BrandLogo />
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">{t('public.brand.tagline')}</div>
          </div>
        </Link>

        <nav className="public-nav" aria-label={t('sidebar.navigation')}>
          <a href="#program">{t('courses.course')}</a>
          <a href="#practice">{t('public.features.practice')}</a>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link to="/login" className="public-login">{t('auth.login')}</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="public-hero" aria-labelledby="public-title">
          <div className="public-hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> {t('public.hero.title')}</div>
            <h1 id="public-title">PythonOku</h1>
            <p className="public-lead">{t('public.hero.subtitle')}</p>
            <div className="public-actions">
              <Link to="/login" className="public-primary">
                <span>{t('public.hero.cta')}</span>
                <Icon name="arrow" size={18} />
              </Link>
              <a href="#program" className="public-secondary">{t('courses.course')}</a>
              <a href="/logo.svg" download="pythonoku-logo.svg" className="public-secondary public-download">
                <Icon name="download" size={17} />
                <span>{t('common.download')}</span>
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
            <span>{t('courses.course')}</span>
            <h2 id="program-title">{t('public.hero.subtitle')}</h2>
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
            <span>{t('public.features.practice')}</span>
            <h2 id="practice-title">{t('public.features.practiceDesc')}</h2>
          </div>
          <p>{t('public.hero.subtitle')}</p>
          <Link to="/login" className="public-band-action">{t('auth.login')}</Link>
        </section>
      </main>
    </div>
  )
}
