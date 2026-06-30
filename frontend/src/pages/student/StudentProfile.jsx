import { useEffect, useState } from 'react'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'

const CERT_XP = 500

export default function StudentProfile() {
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('users/me/'),
      api.get('achievements/me/').catch(() => ({ data: [] })),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([userRes, achRes, notifRes]) => {
      setUser(userRes.data)
      setBio(userRes.data.bio || '')
      setAchievements(achRes.data)
      setNotifCount((notifRes.data || []).filter(n => !n.is_read).length)
    }).finally(() => setLoading(false))
  }, [])

  const saveBio = async () => {
    setSaving(true)
    try {
      const res = await api.patch('users/me/', { bio })
      setUser({ ...user, bio: res.data.bio })
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">Загрузка...</div>
    </div>
  )

  const xp = user?.xp || 0
  const certProgress = Math.min(100, Math.round((xp / CERT_XP) * 100))
  const xpLeft = Math.max(0, CERT_XP - xp)

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />

      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Профиль</h1>
          </div>

          {/* Карточка профиля */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-5">
              {/* Аватар */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700
                              flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {user?.username?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                <div className="text-slate-400 text-sm mt-0.5">{user?.email}</div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-400 text-sm">⚡</span>
                    <span className="text-white font-semibold">{xp}</span>
                    <span className="text-slate-500 text-sm">XP</span>
                  </div>
                  {user?.streak > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-orange-400 text-sm">🔥</span>
                      <span className="text-white font-semibold">{user.streak}</span>
                      <span className="text-slate-500 text-sm">дней подряд</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-5 pt-5 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">О себе</span>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Редактировать
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Напиши что-нибудь о себе..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditing(false); setBio(user?.bio || '') }}
                      className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveBio}
                      disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300 text-sm">
                  {user?.bio || <span className="text-slate-500 italic">Ничего не написано</span>}
                </p>
              )}
            </div>
          </div>

          {/* Прогресс к сертификату */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h3 className="text-white font-semibold">Прогресс к сертификату</h3>
              </div>
              <span className="text-purple-400 font-bold">{certProgress}%</span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full transition-all"
                style={{ width: `${certProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{xp} / {CERT_XP} XP</span>
              {xpLeft > 0
                ? <span>Ещё {xpLeft} XP до сертификата</span>
                : <span className="text-green-400">🎉 Можно получить сертификат!</span>
              }
            </div>
          </div>

          {/* Достижения */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">
              Достижения ({achievements.length})
            </h3>

            {achievements.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Пока нет достижений. Продолжай учиться!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map(ach => (
                  <div
                    key={ach.id}
                    className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-3 text-center"
                  >
                    <div className="text-2xl mb-1">{ach.achievement_icon || '🏅'}</div>
                    <div className="text-white text-xs font-medium">{ach.achievement_name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{ach.achievement_description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
