import { useEffect, useState } from 'react'
import TeacherSidebar from '../../components/TeacherSidebar'
import api from '../../api/axios'

export default function TeacherStudents() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('users/').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <TeacherSidebar />
      <main className="ml-56 flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">👥 Ученики</h1>
            <p className="text-slate-400 text-sm mt-1">Всего: {users.filter(u => !u.is_admin).length}</p>
          </div>
          <input type="text" placeholder="Поиск ученика..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white placeholder-slate-500
                       rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition-all w-64" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-5 py-3 border-b border-slate-800 text-xs text-slate-500 font-medium">
            <span>Ученик</span>
            <span>XP</span>
            <span>Дней подряд</span>
            <span>Статус</span>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-teal-400 animate-pulse">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-slate-400 text-center">Ничего не найдено</div>
          ) : filtered.map(u => (
            <div key={u.id} className="grid grid-cols-4 px-5 py-4 border-b border-slate-800/50
                                       hover:bg-slate-800/30 transition-all items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600
                                flex items-center justify-center text-white text-sm font-bold">
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{u.username}</div>
                  {u.is_admin && <div className="text-teal-400 text-xs">Учитель</div>}
                </div>
              </div>
              <div className="text-yellow-400 font-bold text-sm">{u.xp} XP</div>
              <div className="text-orange-400 text-sm">🔥 {u.streak}</div>
              <div>
                <span className={`text-xs px-2 py-1 rounded-lg border ${
                  u.is_admin
                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                }`}>
                  {u.is_admin ? 'Учитель' : 'Ученик'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}