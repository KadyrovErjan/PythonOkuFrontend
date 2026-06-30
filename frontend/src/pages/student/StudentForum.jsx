import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'

const formatDate = (value) => new Date(value).toLocaleString('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

export default function StudentForum() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadForum = useCallback(async () => {
    setError('')
    try {
      const [userRes, postsRes, notifRes] = await Promise.all([
        api.get('users/me/'),
        api.get('forum/'),
        api.get('notifications/').catch(() => ({ data: [] })),
      ])
      setUser(userRes.data)
      setPosts(postsRes.data || [])
      setNotifCount((notifRes.data || []).filter(item => !item.is_read).length)
    } catch {
      setError('Не удалось загрузить форум. Проверь, что backend запущен.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadForum()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadForum])

  const filteredPosts = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return posts
    return posts.filter(post => (
      post.title?.toLowerCase().includes(value) ||
      post.content?.toLowerCase().includes(value) ||
      post.author_username?.toLowerCase().includes(value)
    ))
  }, [posts, query])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const response = await api.post('forum/', {
        title: form.title.trim(),
        content: form.content.trim(),
      })
      setPosts(current => [response.data, ...current])
      setForm({ title: '', content: '' })
      setShowForm(false)
    } catch {
      setError('Не получилось опубликовать пост. Заполни заголовок и текст.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-inner"><span className="loader-dot" /> Загружаем форум</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <header className="page-heading">
            <div>
              <div className="page-kicker"><span /> Сообщество PythonOku</div>
              <h1>Форум</h1>
              <p>Задавай вопросы, показывай ошибки и помогай другим ученикам.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(value => !value)}
              className="button button-primary"
            >
              {showForm ? 'Закрыть форму' : '+ Новый пост'}
            </button>
          </header>

          {error && (
            <div className="auth-error mb-4">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <section className="content-panel mb-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="panel-kicker">Темы</span>
                <h2>Все обсуждения</h2>
              </div>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Поиск по форуму..."
                className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500 min-w-[17rem]"
              />
            </div>
          </section>

          {showForm && (
            <section className="content-panel mb-5">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Новая тема</span>
                  <h2>Опиши вопрос</h2>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Например: почему TypeError при сложении строки и числа?"
                  value={form.title}
                  onChange={event => setForm({ ...form, title: event.target.value })}
                  className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-purple-500"
                />
                <textarea
                  placeholder="Добавь код, ошибку и что ты уже пробовал..."
                  value={form.content}
                  onChange={event => setForm({ ...form, content: event.target.value })}
                  rows={5}
                  className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-purple-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="button button-ghost">
                    Отмена
                  </button>
                  <button type="submit" disabled={submitting} className="button button-primary">
                    {submitting ? 'Публикуем…' : 'Опубликовать'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {filteredPosts.length === 0 ? (
            <div className="content-panel empty-state">
              <h3>{posts.length ? 'Ничего не найдено' : 'Пока нет постов'}</h3>
              <p>{posts.length ? 'Попробуй изменить поисковый запрос.' : 'Будь первым — задай вопрос или начни обсуждение.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/student/forum/${post.id}`)}
                  className="w-full text-left content-panel hover:border-purple-500/35 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="profile-avatar mt-1">
                      {(post.author_username || post.author_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold text-lg">{post.title}</h3>
                        {post.is_solved && <span className="submission-state done">Решено</span>}
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                        <span>{post.author_username || post.author_name || 'Аноним'}</span>
                        <span>•</span>
                        <span>{formatDate(post.created_at)}</span>
                        {post.lesson_title && (
                          <>
                            <span>•</span>
                            <span>{post.lesson_title}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-slate-400 text-sm">
                      <strong className="block text-white">{post.replies_count || 0}</strong>
                      <span>ответов</span>
                      <small className="block mt-2 text-slate-600">{post.views || 0} просмотров</small>
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
