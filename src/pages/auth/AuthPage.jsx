import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Icon from '../../components/Icon'
import BrandLogo from '../../components/BrandLogo'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function AuthPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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

  const collectErrorMessages = (value) => {
    if (!value) return []
    if (typeof value === 'string') return [value]
    if (typeof value === 'number' || typeof value === 'boolean') return [String(value)]
    if (Array.isArray(value)) return value.flatMap(collectErrorMessages)

    if (typeof value === 'object') {
      return Object.entries(value).flatMap(([key, nestedValue]) => {
        const messages = collectErrorMessages(nestedValue)
        if (!messages.length) return []
        if (['detail', 'message', 'error', 'non_field_errors'].includes(key)) return messages
        return messages.map((message) => `${key}: ${message}`)
      })
    }

    return []
  }

  const formatError = (data) => {
    const messages = collectErrorMessages(data)
    return messages.length
      ? messages.join(' ')
      : t('errors.serverError')
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
      setError(err.response ? formatError(err.response.data) : t('errors.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-story" aria-label={t('public.brand.tagline')}>
        <div className="brand auth-brand">
          <BrandLogo />
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">{t('auth.platformTagline')}</div>
          </div>
        </div>

        <div className="auth-hero">
          <div className="eyebrow"><span className="eyebrow-dot" /> {t('auth.tagline')}</div>
          <h1 className="auth-title">{t('auth.hero.title')} <span>{t('auth.hero.highlight')}</span></h1>
          <p className="auth-subtitle">{t('auth.hero.description')}</p>

          <div className="code-card" aria-hidden="true">
            <div className="code-card-bar">
              <span /><span /><span />
              <span className="code-file">first_step.py</span>
            </div>
            <pre><span className="code-keyword">def</span> <span className="code-function">start_journey</span>(name):{`\n`}    skill = <span className="code-string">&quot;Python&quot;</span>{`\n`}    <span className="code-keyword">return</span> <span className="code-string">f&quot;{`{name}`}, твой путь в {`{skill}`} начался!&quot;</span>{`\n\n`}<span className="code-comment"># Маленькие шаги. Заметный результат.</span></pre>
          </div>
        </div>

        <div className="auth-features" aria-label={t('public.features.title')}>
          <span className="auth-feature">{t('public.features.interactive')}</span>
          <span className="auth-feature">{t('dashboard.myProgress')}</span>
          <span className="auth-feature">{t('auth.features.support')}</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <LanguageSwitcher />
          </div>
          
          <div className="auth-form-heading">
            <h2>{isLogin ? t('auth.welcomeBack') : t('auth.getStarted')}</h2>
            <p>{isLogin ? t('auth.loginPrompt') : t('auth.registerPrompt')}</p>
          </div>

          <div className="auth-form">
            <div className="auth-tabs" role="tablist" aria-label={t('auth.authentication')}>
              <button type="button" role="tab" aria-selected={isLogin} onClick={() => setMode(true)} className={`auth-tab${isLogin ? ' active' : ''}`}>{t('auth.login')}</button>
              <button type="button" role="tab" aria-selected={!isLogin} onClick={() => setMode(false)} className={`auth-tab${!isLogin ? ' active' : ''}`}>{t('auth.register')}</button>
            </div>

            <form onSubmit={handleSubmit}>
              {isLogin ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="identifier">{t('auth.emailOrUsername')}</label>
                  <div className="input-wrap">
                    <Icon name="user" className="input-icon" />
                    <input
                      id="identifier"
                      className="auth-input"
                      type="text"
                      name="identifier"
                      value={form.identifier}
                      onChange={handleChange}
                      placeholder={t('auth.emailPlaceholder')}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">{t('auth.username')}</label>
                    <div className="input-wrap">
                      <Icon name="user" className="input-icon" />
                      <input
                        id="username"
                        className="auth-input"
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder={t('auth.usernamePlaceholder')}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">{t('auth.email')}</label>
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
                  <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                  {isLogin && <button type="button" className="forgot-link" onClick={() => navigate('/forgot-password')}>{t('auth.forgotPassword')}</button>}
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
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(value => !value)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /> <span>{error}</span></div>}

              <button type="submit" disabled={loading} className="auth-submit">
                <span>{loading ? t('common.wait') : isLogin ? t('auth.continue') : t('auth.createAccount')}</span>
                {!loading && <Icon name="arrow" size={18} />}
              </button>
            </form>
          </div>

          <p className="auth-note">{t('auth.termsNotice')}<br />PythonOku · 2026</p>
        </div>
      </section>
    </div>
  )
}
