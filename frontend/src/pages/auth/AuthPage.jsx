import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Icon from '../../components/Icon'

export default function AuthPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    identifier: '',
    username: '',
    email: '',
    password: '',
  })

  const setMode = (loginMode) => {
    setIsLogin(loginMode)
    setError('')
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setError('')
  }

  const formatError = (data) => {
    if (!data) return 'Не удалось связаться с сервером. Попробуйте ещё раз.'
    if (typeof data === 'string') return data
    return Object.values(data).flat().map(String).join(' ')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = isLogin
        ? await api.post('auth/login/', {
            username: form.identifier.trim(),
            password: form.password,
          })
        : await api.post('auth/register/', {
            username: form.username.trim().replace(/\s+/g, ' '),
            email: form.email.trim(),
            password: form.password,
          })

      localStorage.setItem('access', response.data.access)
      localStorage.setItem('refresh', response.data.refresh)
      navigate('/app')
    } catch (err) {
      setError(formatError(err.response?.data))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-story" aria-label="О платформе PythonOku">
        <div className="brand auth-brand">
          <div className="brand-mark">Py</div>
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">платформа для роста</div>
          </div>
        </div>

        <div className="auth-hero">
          <div className="eyebrow"><span className="eyebrow-dot" /> Знания, которые остаются</div>
          <h1 className="auth-title">Python проще, когда <span>путь виден.</span></h1>
          <p className="auth-subtitle">
            Короткие уроки, практика и понятный прогресс — всё, что нужно,
            чтобы двигаться от первой строки кода к настоящим проектам.
          </p>

          <div className="code-card" aria-hidden="true">
            <div className="code-card-bar">
              <span /><span /><span />
              <span className="code-file">first_step.py</span>
            </div>
            <pre><span className="code-keyword">def</span> <span className="code-function">start_journey</span>(name):{`\n`}    skill = <span className="code-string">&quot;Python&quot;</span>{`\n`}    <span className="code-keyword">return</span> <span className="code-string">f&quot;{`{name}`}, твой путь в {`{skill}`} начался!&quot;</span>{`\n\n`}<span className="code-comment"># Маленькие шаги. Заметный результат.</span></pre>
          </div>
        </div>

        <div className="auth-features" aria-label="Возможности платформы">
          <span className="auth-feature">Практические уроки</span>
          <span className="auth-feature">Живой прогресс</span>
          <span className="auth-feature">Поддержка преподавателя</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <h2>{isLogin ? 'С возвращением' : 'Начните обучение'}</h2>
            <p>
              {isLogin
                ? 'Войдите по email или имени пользователя и продолжите с того места, где остановились.'
                : 'Создайте аккаунт — имя пользователя может быть с пробелом, как настоящее имя.'}
            </p>
          </div>

          <div className="auth-form">
            <div className="auth-tabs" role="tablist" aria-label="Авторизация">
              <button type="button" role="tab" aria-selected={isLogin} onClick={() => setMode(true)} className={`auth-tab${isLogin ? ' active' : ''}`}>Войти</button>
              <button type="button" role="tab" aria-selected={!isLogin} onClick={() => setMode(false)} className={`auth-tab${!isLogin ? ' active' : ''}`}>Регистрация</button>
            </div>

            <form onSubmit={handleSubmit}>
              {isLogin ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="identifier">Email или имя пользователя</label>
                  <div className="input-wrap">
                    <Icon name="user" className="input-icon" />
                    <input
                      id="identifier"
                      className="auth-input"
                      type="text"
                      name="identifier"
                      value={form.identifier}
                      onChange={handleChange}
                      placeholder="admin@gmail.com или Кадыров Эржан"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">Имя пользователя</label>
                    <div className="input-wrap">
                      <Icon name="user" className="input-icon" />
                      <input
                        id="username"
                        className="auth-input"
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Кадыров Эржан"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Электронная почта</label>
                    <div className="input-wrap">
                      <Icon name="mail" className="input-icon" />
                      <input
                        id="email"
                        className="auth-input"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="password">Пароль</label>
                  {isLogin && <button type="button" className="forgot-link" onClick={() => navigate('/forgot-password')}>Забыли пароль?</button>}
                </div>
                <div className="input-wrap">
                  <Icon name="lock" className="input-icon" />
                  <input
                    id="password"
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Минимум 6 символов"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /> <span>{error}</span></div>}

              <button type="submit" disabled={loading} className="auth-submit">
                <span>{loading ? 'Подождите…' : isLogin ? 'Продолжить' : 'Создать аккаунт'}</span>
                {!loading && <Icon name="arrow" size={18} />}
              </button>
            </form>
          </div>

          <p className="auth-note">
            Продолжая, вы соглашаетесь с правилами платформы.<br />PythonOku · 2026
          </p>
        </div>
      </section>
    </div>
  )
}
