import { useEffect, useState } from 'react'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'

export default function StudentRating() {
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('users/me/'),
      api.get('leaderboard/').catch(() => ({ data: [] })),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([userRes, lbRes, notifRes]) => {
      setUser(userRes.data)
      const lb = lbRes.data.slice(0, 50)
      setLeaders(lb)
      const rank = lb.findIndex(u => u.username === userRes.data.username)
      setMyRank(rank >= 0 ? rank + 1 : null)
      setNotifCount((notifRes.data || []).filter(n => !n.is_read).length)
    }).finally(() => setLoading(false))
  }, [])

  const getMedal = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400">Загрузка...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />

      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl mx-auto">

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Рейтинг</h1>
            <p className="text-slate-400 mt-1">Топ-50 учеников по XP</p>
          </div>

          {/* Моя позиция */}
          {myRank && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl px-5 py-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-bold text-lg">#{myRank}</span>
                <span className="text-slate-300 text-sm">Твоя позиция</span>
              </div>
              <span className="text-yellow-400 font-semibold">⚡ {user?.xp} XP</span>
            </div>
          )}

          {/* Топ-3 */}
          {leaders.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[leaders[1], leaders[0], leaders[2]].map((u, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3
                const sizes = { 1: 'pt-0', 2: '-mt-3', 3: 'pt-2' }
                return u ? (
                  <div key={u.id} className={`text-center ${sizes[rank]}`}>
                    <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold mb-1
                      ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-600'}`}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="text-sm">{getMedal(rank)}</div>
                    <div className="text-white text-xs font-medium truncate">{u.username}</div>
                    <div className="text-yellow-400 text-xs">⚡ {u.xp}</div>
                  </div>
                ) : null
              })}
            </div>
          )}

          {/* Полный список */}
          <div className="space-y-1.5">
            {leaders.map((u, idx) => {
              const rank = idx + 1
              const isMe = u.username === user?.username
              const medal = getMedal(rank)

              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isMe
                      ? 'bg-purple-500/15 border border-purple-500/30'
                      : 'bg-slate-800/40 border border-slate-700/30'}`}
                >
                  <div className="w-7 text-center">
                    {medal
                      ? <span className="text-base">{medal}</span>
                      : <span className="text-slate-500 text-sm font-medium">#{rank}</span>
                    }
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                    ${isMe ? 'bg-purple-500' : 'bg-slate-600'}`}>
                    {u.username[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm ${isMe ? 'text-purple-300' : 'text-white'}`}>
                      {u.username}
                      {isMe && <span className="ml-2 text-xs text-purple-400">(ты)</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-yellow-400 text-sm">⚡</span>
                    <span className="text-white text-sm font-semibold">{u.xp}</span>
                    <span className="text-slate-500 text-xs">XP</span>
                  </div>
                </div>
              )
            })}
          </div>

          {leaders.length === 0 && (
            <div className="text-center py-20 text-slate-500">Список пуст</div>
          )}

        </div>
      </main>
    </div>
  )
}
