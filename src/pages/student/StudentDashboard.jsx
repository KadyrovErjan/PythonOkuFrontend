import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StudentSidebar from '../../components/StudentSidebar'
import Icon from '../../components/Icon'
import api from '../../api/axios'

export default function StudentDashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const formatDate = () => {
    const locales = { ky: 'ky-KG', ru: 'ru-RU', en: 'en-US' }
    return new Intl.DateTimeFormat(locales[i18n.language] || 'ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    }).format(new Date())
  }

  useEffect(() => {
    Promise.all([
      api.get('users/me/'),
      api.get('progress/'),
      api.get('notifications/'),
    ]).then(([userResponse, progressResponse, notificationsResponse]) => {
      setUser(userResponse.data)
      setProgress(progressResponse.data)
      setNotifCount(notificationsResponse.data.filter(item => !item.is_read).length)
    }).catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  const completed = progress.filter(item => item.completed).length
  const total = progress.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const certificatePercent = Math.min(Math.round(((user?.xp ?? 0) / 500) * 100), 100)
  const nextLesson = useMemo(() => progress.find(item => !item.completed) ?? progress[0], [progress])

  const continueLearning = () => {
    navigate(nextLesson ? `/student/lessons/${nextLesson.lesson}` : '/student/courses')
  }

  if (loading) return (
    <div className="app-loader"><div className="loader-inner"><span className="loader-dot" /> {t('common.loading')}</div></div>
  )

  const stats = [
    { icon: 'bolt', label: t('dashboard.xpEarned'), value: user?.xp ?? 0, suffix: 'XP', tone: 'amber' },
    { icon: 'flame', label: t('dashboard.currentStreak'), value: user?.streak ?? 0, suffix: t('time.days'), tone: 'coral' },
    { icon: 'check', label: t('dashboard.lessonsCompleted'), value: completed, suffix: t('courses.lessons').toLowerCase(), tone: 'mint' },
    { icon: 'layers', label: t('dashboard.myProgress'), value: total, suffix: t('courses.lessons').toLowerCase(), tone: 'violet' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />
      <main className="ml-56 flex-1 dashboard-main">
        <header className="page-heading">
          <div>
            <div className="page-kicker"><span /> {formatDate()}</div>
            <h1>{t('dashboard.welcome')}, {user?.username}</h1>
            <p>{t('dashboard.continueWhere')}</p>
          </div>
          <button className="button button-ghost" onClick={() => navigate('/student/notifications')}>
            <Icon name="bell" size={18} />
            <span>{t('sidebar.notifications')}</span>
            {notifCount > 0 && <b>{notifCount}</b>}
          </button>
        </header>

        <section className="learning-hero">
          <div className="learning-hero-copy">
            <div className="hero-label"><Icon name="sparkles" size={15} /> {t('dashboard.myProgress')}</div>
            <h2>{total ? t('dashboard.continueWhere') : t('courses.start')}</h2>
            <p>
              {total
                ? `${t('lessons.completed')} ${completed} / ${total}. ${t('dashboard.continueWhere')}`
                : t('courses.selectCourse')}
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={continueLearning}>
                <Icon name="play" size={18} /> {nextLesson ? t('common.continue') : t('courses.selectCourse')}
              </button>
              <button className="button button-secondary" onClick={() => navigate('/student/courses')}>
                {t('courses.allCourses')} <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>

          <div className="progress-orbit" style={{ '--progress': `${percent * 3.6}deg` }}>
            <div className="progress-orbit-inner">
              <strong>{percent}%</strong>
              <span>{t('courses.completed').toLowerCase()}</span>
            </div>
            <i className="orbit-dot" />
          </div>
        </section>

        <section className="metric-grid">
          {stats.map(stat => (
            <article className={`metric-card tone-${stat.tone}`} key={stat.label}>
              <div className="metric-icon"><Icon name={stat.icon} /></div>
              <div className="metric-copy">
                <span>{stat.label}</span>
                <strong>{stat.value} <small>{stat.suffix}</small></strong>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-columns">
          <article className="content-panel lessons-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{t('common.continue')}</span>
                <h2>{t('dashboard.recentLessons')}</h2>
              </div>
              <button className="text-button" onClick={() => navigate('/student/courses')}>{t('courses.allCourses')} <Icon name="arrow" size={15} /></button>
            </div>

            {progress.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="book" size={24} /></div>
                <h3>{t('dashboard.welcome')}</h3>
                <p>{t('courses.selectCourse')}</p>
                <button className="button button-secondary" onClick={() => navigate('/student/courses')}>{t('courses.allCourses')}</button>
              </div>
            ) : (
              <div className="lesson-feed">
                {progress.slice(0, 5).map((item, index) => (
                  <button key={item.id} className="lesson-feed-item" onClick={() => navigate(`/student/lessons/${item.lesson}`)}>
                    <span className={`lesson-state ${item.completed ? 'done' : ''}`}>
                      {item.completed ? <Icon name="check" size={16} /> : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="lesson-info">
                      <strong>{item.lesson_title}</strong>
                      <small>{item.completed ? t('lessons.completed') : t('common.continue')}</small>
                    </span>
                    <span className="lesson-action"><Icon name="arrow" size={17} /></span>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="content-panel certificate-panel">
            <div className="certificate-visual"><Icon name="graduation" size={30} /></div>
            <span className="panel-kicker">{t('profile.certificates')}</span>
            <h2>{t('profile.certificates')} PythonOku</h2>
            <p>{certificatePercent >= 100 ? t('profile.certificateReady') : t('profile.xpLeft', { xp: Math.max(500 - (user?.xp ?? 0), 0) })}</p>
            <div className="goal-number"><strong>{certificatePercent}%</strong><span>{t('profile.certificates').toLowerCase()}</span></div>
            <div className="goal-track"><span style={{ width: `${certificatePercent}%` }} /></div>
            {certificatePercent >= 100 ? (
              <button className="button button-primary full-width"><Icon name="download" size={17} /> {t('common.download')}</button>
            ) : (
              <button className="button button-secondary full-width" onClick={continueLearning}>{t('common.continue')} <Icon name="arrow" size={16} /></button>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
