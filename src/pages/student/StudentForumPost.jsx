import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import StudentSidebar from '../../components/StudentSidebar'

const formatDate = (value) => new Date(value).toLocaleString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default function StudentForumPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadPost = useCallback(async () => {
    setError('')
    try {
      const [userRes, postRes, repliesRes, notifRes] = await Promise.all([
        api.get('users/me/'),
        api.get(`forum/${id}/`),
        api.get(`forum/${id}/replies/`).catch(() => ({ data: [] })),
        api.get('notifications/').catch(() => ({ data: [] })),
      ])
      setUser(userRes.data)
      setPost(postRes.data)
      setReplies(repliesRes.data?.length ? repliesRes.data : (postRes.data.replies || []))
      setNotifCount((notifRes.data || []).filter(item => !item.is_read).length)
    } catch {
      setError('Не удалось загрузить тему форума.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPost()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadPost])

  const handleReply = async (event) => {
    event.preventDefault()
    if (!replyText.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const response = await api.post(`forum/${id}/replies/`, {
        content: replyText.trim(),
      })
      setReplies(current => [...current, response.data])
      setReplyText('')
    } catch {
      setError('Не удалось отправить ответ. Попробуй ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-inner"><span className="loader-dot" /> Загружаем тему</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-900 flex">
        <StudentSidebar user={user} notifCount={notifCount} />
        <main className="ml-56 flex-1 p-8">
          <div className="content-panel empty-state">
            <h3>Пост не найден</h3>
            <p>{error || 'Возможно, тема была удалена.'}</p>
            <button className="button button-primary" onClick={() => navigate('/student/forum')}>Вернуться на форум</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <StudentSidebar user={user} notifCount={notifCount} />

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/student/forum')}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-5 transition-colors"
          >
            ← Вернуться на форум
          </button>

          {error && (
            <div className="auth-error mb-4">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <article className="content-panel mb-5">
            <div className="flex items-start gap-4">
              <div className="profile-avatar">
                {(post.author_username || post.author_name || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="page-kicker"><span /> Форум PythonOku</div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">{post.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                  <span>{post.author_username || post.author_name || 'Аноним'}</span>
                  <span>•</span>
                  <span>{formatDate(post.created_at)}</span>
                  <span>•</span>
                  <span>{post.views || 0} просмотров</span>
                  {post.lesson_title && (
                    <>
                      <span>•</span>
                      <span>{post.lesson_title}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-7 whitespace-pre-wrap mt-5">
              {post.content}
            </p>
          </article>

          <section className="content-panel mb-5">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Ответы</span>
                <h2>{replies.length} ответов</h2>
              </div>
            </div>

            {replies.length === 0 ? (
              <div className="empty-state py-10">
                <h3>Ответов пока нет</h3>
                <p>Если знаешь решение — помоги автору. Если тоже застрял, добавь детали.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map(reply => (
                  <article key={reply.id} className="bg-slate-900/45 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                        {(reply.author_username || reply.author_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <strong className="block text-white text-sm">{reply.author_username || reply.author_name || 'Аноним'}</strong>
                        <small className="text-slate-500">{formatDate(reply.created_at)}</small>
                      </div>
                      {reply.is_best_answer && <span className="submission-state done ml-auto">Лучший ответ</span>}
                    </div>
                    <p className="text-slate-300 text-sm leading-7 whitespace-pre-wrap">{reply.content}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Твой ответ</span>
                <h2>Написать сообщение</h2>
              </div>
            </div>
            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                placeholder="Напиши ответ, подсказку или попроси уточнить детали..."
                value={replyText}
                onChange={event => setReplyText(event.target.value)}
                rows={4}
                className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-purple-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="button button-primary"
                >
                  {submitting ? 'Отправляем…' : 'Ответить'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
