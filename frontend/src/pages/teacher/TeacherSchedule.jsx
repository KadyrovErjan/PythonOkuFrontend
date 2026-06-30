import { useEffect, useState } from 'react'
import api from '../../api/axios'
import TeacherSidebar from '../../components/TeacherSidebar'

const EMPTY_FORM = {
  title: '',
  description: '',
  meet_url: '',
  date: '',
  duration_minutes: 60,
}

export default function TeacherSchedule() {
  const [notifCount, setNotifCount] = useState(0)
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('schedule/'),
      api.get('notifications/').catch(() => ({ data: [] })),
    ]).then(([schedRes, notifRes]) => {
      setSchedule(schedRes.data || [])
      setNotifCount((notifRes.data || []).filter(item => !item.is_read).length)
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.date) {
      setError('Заполните название и дату урока.')
      return
    }

    setSubmitting(true)
    setError('')

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      meet_url: form.meet_url.trim(),
      duration_minutes: Number(form.duration_minutes) || 60,
    }

    try {
      if (editId) {
        const response = await api.put(`schedule/${editId}/`, payload)
        setSchedule(current => current.map(item => item.id === editId ? response.data : item))
      } else {
        const response = await api.post('schedule/', payload)
        setSchedule(current => [response.data, ...current])
      }
      closeForm()
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Ошибка сохранения.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      meet_url: item.meet_url || item.zoom_url || '',
      date: item.date?.slice(0, 16) || '',
      duration_minutes: item.duration_minutes || 60,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить урок из расписания?')) return
    try {
      await api.delete(`schedule/${id}/`)
      setSchedule(current => current.filter(item => item.id !== id))
    } catch {
      setError('Не удалось удалить урок.')
    }
  }

  const now = new Date()
  const upcoming = schedule
    .filter(item => new Date(item.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const past = schedule
    .filter(item => new Date(item.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const formatDateTime = (date) => new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const ScheduleCard = ({ item, isPast = false }) => {
    const meetUrl = item.meet_url || item.zoom_url

    return (
      <div className={`bg-slate-800/60 border rounded-xl p-4 ${isPast ? 'border-slate-700/30 opacity-60' : 'border-slate-700/50'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-white font-medium">{item.title}</h3>
            {item.description && (
              <p className="text-slate-400 text-sm mt-1">{item.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>📅 {formatDateTime(item.date)}</span>
              {item.duration_minutes && <span>⏱ {item.duration_minutes} мин</span>}
              {meetUrl && (
                <a href={meetUrl} target="_blank" rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
                  🎥 Google Meet-ссылка
                </a>
              )}
            </div>
          </div>

          {!isPast && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleEdit(item)}
                className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-inner"><span className="loader-dot" /> Загружаем расписание</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <TeacherSidebar notifCount={notifCount} />

      <main className="ml-56 flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Расписание</h1>
              <p className="text-slate-400 mt-1">Управление Google Meet-уроками</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(value => !value)
                setEditId(null)
                setForm(EMPTY_FORM)
                setError('')
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              + Добавить урок
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-800/60 border border-teal-500/30 rounded-2xl p-5 mb-5">
              <h3 className="text-white font-semibold mb-4">
                {editId ? 'Редактировать урок' : 'Новый Google Meet-урок'}
              </h3>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Название *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Урок 1: Введение в Python"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Описание</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Краткое описание урока..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Google Meet-ссылка</label>
                  <input
                    type="url"
                    name="meet_url"
                    value={form.meet_url}
                    onChange={handleChange}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Дата и время *</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Длительность (мин)</label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={form.duration_minutes}
                      onChange={handleChange}
                      min={15}
                      max={300}
                      step={15}
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {schedule.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              Расписание пустое. Добавь первый Google Meet-урок!
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <span>📅</span> Предстоящие ({upcoming.length})
                  </h2>
                  <div className="space-y-3">
                    {upcoming.map(item => <ScheduleCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <h2 className="text-slate-400 font-semibold mb-3 flex items-center gap-2">
                    <span>🕐</span> Прошедшие ({past.length})
                  </h2>
                  <div className="space-y-3">
                    {past.map(item => <ScheduleCard key={item.id} item={item} isPast />)}
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
