import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentSidebar from '../../components/StudentSidebar'
import Icon from '../../components/Icon'
import api from '../../api/axios'

const formatDate = () => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date())

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
    <div className="app-loader"><div className="loader-inner"><span className="loader-dot" /> Собираем твой прогресс</div></div>
  )

  const stats = [
    { icon: 'bolt', label: 'Опыт', value: user?.xp ?? 0, suffix: 'XP', tone: 'amber' },
    { icon: 'flame', label: 'Серия занятий', value: user?.streak ?? 0, suffix: 'дн.', tone: 'coral' },
    { icon: 'check', label: 'Пройдено', value: completed, suffix: 'уроков', tone: 'mint' },
    { icon: 'layers', label: 'В траектории', value: total, suffix: 'уроков', tone: 'violet' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />
      <main className="ml-56 flex-1 dashboard-main">
        <header className="page-heading">
          <div>
            <div className="page-kicker"><span /> {formatDate()}</div>
            <h1>Привет, {user?.username}</h1>
            <p>Небольшой шаг сегодня заметно меняет результат завтра.</p>
          </div>
          <button className="button button-ghost" onClick={() => navigate('/student/notifications')}>
            <Icon name="bell" size={18} />
            <span>Уведомления</span>
            {notifCount > 0 && <b>{notifCount}</b>}
          </button>
        </header>

        <section className="learning-hero">
          <div className="learning-hero-copy">
            <div className="hero-label"><Icon name="sparkles" size={15} /> Твоя траектория</div>
            <h2>{total ? 'Продолжай — ритм уже набран.' : 'Первая строка кода начинается здесь.'}</h2>
            <p>
              {total
                ? `Завершено ${completed} из ${total} уроков. Следующая цель уже на расстоянии одного занятия.`
                : 'Выбери первый курс, открой урок и начни собирать свою серию занятий.'}
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={continueLearning}>
                <Icon name="play" size={18} /> {nextLesson ? 'Продолжить урок' : 'Выбрать курс'}
              </button>
              <button className="button button-secondary" onClick={() => navigate('/student/courses')}>
                Все курсы <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>

          <div className="progress-orbit" style={{ '--progress': `${percent * 3.6}deg` }}>
            <div className="progress-orbit-inner">
              <strong>{percent}%</strong>
              <span>пройдено</span>
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
                <span className="panel-kicker">Продолжить обучение</span>
                <h2>Последние уроки</h2>
              </div>
              <button className="text-button" onClick={() => navigate('/student/courses')}>Смотреть все <Icon name="arrow" size={15} /></button>
            </div>

            {progress.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Icon name="book" size={24} /></div>
                <h3>Здесь появится твоя история</h3>
                <p>Начни любой курс — уроки и прогресс будут собраны на этой странице.</p>
                <button className="button button-secondary" onClick={() => navigate('/student/courses')}>Открыть каталог</button>
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
                      <small>{item.completed ? 'Материал освоен' : 'Можно продолжить с этого места'}</small>
                    </span>
                    <span className="lesson-action"><Icon name="arrow" size={17} /></span>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="content-panel certificate-panel">
            <div className="certificate-visual"><Icon name="graduation" size={30} /></div>
            <span className="panel-kicker">Большая цель</span>
            <h2>Сертификат PythonOku</h2>
            <p>{certificatePercent >= 100 ? 'Цель достигнута. Отличная работа!' : `Осталось набрать ${Math.max(500 - (user?.xp ?? 0), 0)} XP.`}</p>
            <div className="goal-number"><strong>{certificatePercent}%</strong><span>до сертификата</span></div>
            <div className="goal-track"><span style={{ width: `${certificatePercent}%` }} /></div>
            {certificatePercent >= 100 ? (
              <button className="button button-primary full-width"><Icon name="download" size={17} /> Скачать сертификат</button>
            ) : (
              <button className="button button-secondary full-width" onClick={continueLearning}>Продолжить путь <Icon name="arrow" size={16} /></button>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
