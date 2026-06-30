import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios'
import StudentSidebar from './StudentSidebar'
import TeacherSidebar from './TeacherSidebar'

const REFRESH_MS = 15000

const notificationIcon = {
  hw_feedback: '📝',
  new_lesson: '📚',
  achievement: '🔥',
  system: '🔔',
}

export default function NotificationsPage({ role }) {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const requests = [api.get('notifications/')]
      if (role === 'student') requests.unshift(api.get('users/me/'))

      const responses = await Promise.all(requests)
      if (role === 'student') {
        setUser(responses[0].data)
        setNotifications(responses[1].data || [])
      } else {
        setNotifications(responses[0].data || [])
      }
    } catch {
      if (!silent) setError('Не удалось загрузить уведомления.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [role])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      loadNotifications()
    }, 0)
    const timer = window.setInterval(() => {
      loadNotifications({ silent: true })
    }, REFRESH_MS)

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [loadNotifications])

  const markRead = async (id) => {
    setNotifications(items => items.map(item => item.id === id ? { ...item, is_read: true } : item))
    try {
      await api.patch(`notifications/${id}/read/`)
    } catch {
      loadNotifications({ silent: true })
    }
  }

  const markAllRead = async () => {
    const previous = notifications
    setNotifications(items => items.map(item => ({ ...item, is_read: true })))
    try {
      await api.patch('notifications/read-all/')
    } catch {
      setNotifications(previous)
      setError('Не удалось отметить уведомления прочитанными.')
    }
  }

  const unreadCount = notifications.filter(item => !item.is_read).length
  const Sidebar = role === 'teacher' ? TeacherSidebar : StudentSidebar

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-inner"><span className="loader-dot" /> Загружаем уведомления</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${role === 'teacher' ? 'bg-slate-950' : 'bg-slate-900'} flex`}>
      <Sidebar user={user} notifCount={unreadCount} />
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="page-heading">
            <div>
              <div className="page-kicker"><span /> Центр событий</div>
              <h1>Уведомления</h1>
              <p>{unreadCount ? `${unreadCount} непрочитанных` : 'Всё прочитано. Новые события появятся здесь автоматически.'}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => loadNotifications()} className="button button-secondary">
                Обновить
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="button button-primary">
                  Прочитать всё
                </button>
              )}
            </div>
          </header>

          {error && (
            <div className="auth-error mb-4">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="content-panel empty-state">
              <h3>Уведомлений пока нет</h3>
              <p>Когда появятся новые ДЗ, ответы на форуме, достижения или проверки — они будут здесь.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.is_read && markRead(item.id)}
                  className={`w-full text-left content-panel transition-all ${!item.is_read ? 'border-purple-500/30 bg-purple-500/5' : 'opacity-80'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${!item.is_read ? 'bg-purple-500/20' : 'bg-slate-900/70'}`}>
                      {notificationIcon[item.type] || '🔔'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{item.title}</strong>
                        {!item.is_read && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[0.62rem] font-bold">
                            new
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.text || item.message}</p>
                      <small className="block text-slate-600 mt-3">
                        {new Date(item.created_at).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
