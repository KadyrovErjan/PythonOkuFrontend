import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import Icon from '../../components/Icon'
import BrandLogo from '../../components/BrandLogo'
import LanguageSwitcher from '../../components/LanguageSwitcher'

const extractError = (error) => {
  const data = error.response?.data
  if (!data) return 'errors.serverError'

  return Object.values(data)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .flatMap(value => typeof value === 'object' ? Object.values(value) : [value])
    .join(' ')
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [form, setForm] = useState({
    email: '', reset_code: '', new_password: '', confirm_password: '',
  })

  const update = (event) => {
    const { name, value } = event.target
    setForm(current => ({
      ...current,
      [name]: name === 'reset_code' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }))
    setError('')
  }

  const requestCode = async (event) => {
    event?.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('password_reset/', { email: form.email.trim() })
      setStep('code')
    } catch (requestError) {
      setError(extractError(requestError))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    if (form.reset_code.length !== 6) {
      setError(t('auth.reset.codeRequired'))
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('password_reset/verify_code/', {
        email: form.email.trim(),
        reset_code: form.reset_code,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      })
      setStep('success')
    } catch (requestError) {
      setError(extractError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell reset-shell">
      <section className="auth-story reset-story" aria-label={t('auth.reset.title')}>
        <div className="brand auth-brand">
          <BrandLogo />
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">{t('auth.reset.secureAccess')}</div>
          </div>
        </div>

        <div className="reset-story-content">
          <div className="reset-shield"><Icon name="shield" size={34} /></div>
          <div className="eyebrow"><span className="eyebrow-dot" /> {t('auth.reset.accountRecovery')}</div>
          <h1>{t('auth.reset.restoreTitle')}<br /><span>{t('auth.reset.restoreSubtitle')}</span></h1>
          <p>{t('auth.reset.description')}</p>
          <div className="reset-benefits">
            <span><Icon name="check" size={16} /> {t('auth.reset.benefit1')}</span>
            <span><Icon name="check" size={16} /> {t('auth.reset.benefit2')}</span>
            <span><Icon name="check" size={16} /> {t('auth.reset.benefit3')}</span>
          </div>
        </div>

        <button className="back-to-login" onClick={() => navigate('/login')}>
          <span>←</span> {t('auth.backToLogin')}
        </button>
      </section>

      <section className="auth-form-side reset-form-side">
        <div className="auth-form-wrap">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <LanguageSwitcher />
          </div>
          
          <div className="reset-steps" aria-label={t('auth.reset.steps')}>
            {['email', 'code', 'success'].map((item, index) => {
              const order = ['email', 'code', 'success']
              const activeIndex = order.indexOf(step)
              return <span key={item} className={index <= activeIndex ? 'active' : ''}>{index < activeIndex ? <Icon name="check" size={13} /> : index + 1}</span>
            })}
          </div>

          {step === 'email' && (
            <>
              <div className="auth-form-heading">
                <h2>{t('auth.forgotPassword')}</h2>
                <p>{t('auth.reset.emailPrompt')}</p>
              </div>
              <div className="auth-form reset-card">
                <form onSubmit={requestCode}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-email">{t('auth.email')}</label>
                    <div className="input-wrap">
                      <Icon name="mail" className="input-icon" />
                      <input id="reset-email" className="auth-input" type="email" name="email" value={form.email} onChange={update} placeholder="name@example.com" autoComplete="email" required autoFocus />
                    </div>
                  </div>
                  {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /><span>{t(error)}</span></div>}
                  <button className="auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? t('auth.reset.sendingCode') : t('auth.reset.getCode')}</span>
                    {!loading && <Icon name="arrow" size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="auth-form-heading">
                <h2>{t('auth.reset.checkEmail')}</h2>
                <p>{t('auth.reset.codeSent')} <strong>{form.email}</strong>. {t('auth.reset.checkSpam')}</p>
              </div>
              <div className="auth-form reset-card">
                <form onSubmit={resetPassword}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-code">{t('auth.reset.codeFromEmail')}</label>
                    <input id="reset-code" className="auth-input code-input" inputMode="numeric" name="reset_code" value={form.reset_code} onChange={update} placeholder="000000" autoComplete="one-time-code" required autoFocus />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">{t('auth.reset.newPassword')}</label>
                    <div className="input-wrap">
                      <Icon name="lock" className="input-icon" />
                      <input id="new-password" className="auth-input" type={showPasswords ? 'text' : 'password'} name="new_password" value={form.new_password} onChange={update} placeholder={t('auth.reset.passwordMinLength')} minLength={8} autoComplete="new-password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPasswords(value => !value)} aria-label={showPasswords ? t('auth.hidePassword') : t('auth.showPassword')}><Icon name={showPasswords ? 'eyeOff' : 'eye'} size={17} /></button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">{t('auth.reset.confirmPassword')}</label>
                    <div className="input-wrap">
                      <Icon name="lock" className="input-icon" />
                      <input id="confirm-password" className="auth-input" type={showPasswords ? 'text' : 'password'} name="confirm_password" value={form.confirm_password} onChange={update} placeholder={t('auth.reset.repeatPassword')} minLength={8} autoComplete="new-password" required />
                    </div>
                  </div>

                  {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /><span>{t(error)}</span></div>}
                  <button className="auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? t('common.saving') : t('auth.reset.changePassword')}</span>
                    {!loading && <Icon name="arrow" size={18} />}
                  </button>
                  <button type="button" className="resend-button" onClick={requestCode} disabled={loading}><Icon name="refresh" size={15} /> {t('auth.reset.resendCode')}</button>
                </form>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="auth-form reset-card success-card">
              <div className="success-icon"><Icon name="check" size={28} /></div>
              <h2>{t('auth.reset.passwordChanged')}</h2>
              <p>{t('auth.reset.successMessage')}</p>
              <button className="auth-submit" type="button" onClick={() => navigate('/login')}><span>{t('auth.reset.goToLogin')}</span><Icon name="arrow" size={18} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
