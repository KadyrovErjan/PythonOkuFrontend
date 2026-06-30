import { useEffect, useState } from 'react'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'

export default function StudentSchedule() {
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('users/me/'),
      api.get('schedule/'),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([userRes, schedRes, notifRes]) => {
      setUser(userRes.data)
      setSchedule(schedRes.data || [])
      setNotifCount((notifRes.data || []).filter(item => !item.is_read).length)
    }).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = schedule
    .filter(item => new Date(item.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const past = schedule
    .filter(item => new Date(item.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isToday = (date) => new Date(date).toDateString() === now.toDateString()

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-inner"><span className="loader-dot" /> Загружаем расписание</div>
      </div>
    )
  }

  const LessonCard = ({ item, isPast = false }) => {
    const meetUrl = item.meet_url || item.zoom_url

    return (
      <div className={`bg-slate-800/60 border rounded-xl p-4 ${isPast ? 'border-slate-700/30 opacity-60' : 'border-slate-700/50'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isToday(item.date) && !isPast && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  Сегодня
                </span>
              )}
              <h3 className="text-white font-medium">{item.title}</h3>
            </div>
            {item.description && (
              <p className="text-slate-400 text-sm mb-2">{item.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>📅 {formatDate(item.date)}</span>
              <span>🕐 {formatTime(item.date)}</span>
              {item.duration_minutes && <span>⏱ {item.duration_minutes} мин</span>}
            </div>
          </div>

          {meetUrl && !isPast && (
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🎥</span> Google Meet
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />

      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Расписание</h1>
            <p className="text-slate-400 mt-1">Google Meet-уроки с учителем</p>
          </div>

          {schedule.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Уроков в расписании нет
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span>📅</span> Предстоящие ({upcoming.length})
                  </h2>
                  <div className="space-y-3">
                    {upcoming.map(item => <LessonCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <h2 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                    <span>🕐</span> Прошедшие ({past.length})
                  </h2>
                  <div className="space-y-3">
                    {past.map(item => <LessonCard key={item.id} item={item} isPast />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
