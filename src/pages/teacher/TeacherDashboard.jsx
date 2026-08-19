import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeacherSidebar from '../../components/TeacherSidebar'
import Icon from '../../components/Icon'
import api from '../../api/axios'

const formatDate = () => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date())

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('teacher/analytics/'),
      api.get('notifications/'),
    ]).then(([analyticsResponse, notificationsResponse]) => {
      setData(analyticsResponse.data)
      setNotifCount(notificationsResponse.data.filter(item => !item.is_read).length)
    }).catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return (
    <div className="app-loader teacher-loader"><div className="loader-inner"><span className="loader-dot" /> Обновляем аналитику</div></div>
  )

  const stats = [
    { icon: 'users', label: 'Активные ученики', value: data?.total_students ?? 0, suffix: 'чел.', tone: 'mint' },
    { icon: 'bolt', label: 'Средний результат', value: data?.avg_xp ?? 0, suffix: 'XP', tone: 'amber' },
    { icon: 'task', label: 'Ждут проверки', value: data?.pending_hw ?? 0, suffix: 'работ', tone: 'coral' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <TeacherSidebar notifCount={notifCount} />
      <main className="ml-56 flex-1 dashboard-main teacher-dashboard">
        <header className="page-heading">
          <div>
            <div className="page-kicker teacher-kicker"><span /> {formatDate()}</div>
            <h1>Панель преподавателя</h1>
            <p>Главное о группе — без лишнего шума и таблиц на пол-экрана.</p>
          </div>
          <button className="button button-primary teacher-button" onClick={() => navigate('/teacher/courses')}>
            <Icon name="book" size={18} /> Управление курсами
          </button>
        </header>

        <section className="teacher-hero">
          <div className="teacher-hero-copy">
            <div className="hero-label teacher-label"><Icon name="trend" size={15} /> Сводка группы</div>
            <h2>{data?.pending_hw > 0 ? 'Ученики ждут обратную связь.' : 'Все работы разобраны.'}</h2>
            <p>
              {data?.pending_hw > 0
                ? `${data.pending_hw} ${data.pending_hw === 1 ? 'работа готова' : 'работ готовы'} к проверке. Быстрый комментарий сейчас помогает сохранить темп обучения.`
                : 'Отличный момент, чтобы обновить материалы курса или посмотреть динамику учеников.'}
            </p>
            <div className="hero-actions">
              <button className="button button-primary teacher-button" onClick={() => navigate('/teacher/homeworks')}>
                <Icon name="task" size={17} /> Проверить работы
              </button>
              <button className="button button-secondary" onClick={() => navigate('/teacher/students')}>Список учеников <Icon name="arrow" size={16} /></button>
            </div>
          </div>
          <div className="teacher-hero-art" aria-hidden="true">
            <div className="art-chart">
              {[38, 54, 46, 72, 63, 88, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="art-caption"><Icon name="trend" size={16} /> Динамика обучения</div>
          </div>
        </section>

        <section className="metric-grid teacher-metrics">
          {stats.map(stat => (
            <article className={`metric-card tone-${stat.tone}`} key={stat.label}>
              <div className="metric-icon"><Icon name={stat.icon} /></div>
              <div className="metric-copy"><span>{stat.label}</span><strong>{stat.value} <small>{stat.suffix}</small></strong></div>
            </article>
          ))}
        </section>

        <section className="dashboard-columns teacher-columns">
          <article className="content-panel ranking-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">Лидеры недели</span><h2>Топ учеников</h2></div>
              <button className="text-button teacher-text" onClick={() => navigate('/teacher/students')}>Все ученики <Icon name="arrow" size={15} /></button>
            </div>

            {data?.top_students?.length ? (
              <div className="ranking-list">
                {data.top_students.slice(0, 5).map((student, index) => (
                  <div className="ranking-row" key={student.id}>
                    <span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="student-avatar">{student.username[0].toUpperCase()}</span>
                    <span className="student-name"><strong>{student.username}</strong><small>{index < 3 ? 'Стабильный прогресс' : 'Хороший темп'}</small></span>
                    <span className="student-score">{student.xp} <small>XP</small></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact"><div className="empty-icon"><Icon name="users" size={23} /></div><h3>Рейтинг ещё формируется</h3><p>Здесь появятся ученики после первых выполненных уроков.</p></div>
            )}
          </article>

          <article className="content-panel popular-panel">
            <div className="panel-heading"><div><span className="panel-kicker">Интерес группы</span><h2>Популярные уроки</h2></div></div>
            {data?.popular_lessons?.length ? (
              <div className="popular-list">
                {data.popular_lessons.slice(0, 5).map((lesson, index) => {
                  const max = Math.max(...data.popular_lessons.map(item => item.count), 1)
                  return (
                    <div className="popular-item" key={`${lesson.lesson__title}-${index}`}>
                      <div><span>{String(index + 1).padStart(2, '0')}</span><strong>{lesson.lesson__title}</strong><small>{lesson.count} прохождений</small></div>
                      <div className="mini-track"><i style={{ width: `${Math.max((lesson.count / max) * 100, 8)}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state compact"><div className="empty-icon"><Icon name="book" size={23} /></div><h3>Пока нет данных</h3><p>Статистика появится после прохождения уроков.</p></div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
