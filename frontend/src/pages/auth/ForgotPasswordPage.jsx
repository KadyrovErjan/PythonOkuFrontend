import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Icon from '../../components/Icon'

const extractError = (error) => {
  const data = error.response?.data
  if (!data) return 'Не удалось связаться с сервером. Попробуйте ещё раз.'

  return Object.values(data)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .flatMap(value => typeof value === 'object' ? Object.values(value) : [value])
    .join(' ')
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
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
      setError('Введите шестизначный код из письма.')
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
      <section className="auth-story reset-story" aria-label="Восстановление доступа">
        <div className="brand auth-brand">
          <div className="brand-mark">Py</div>
          <div className="brand-copy">
            <div className="brand-name">Python<span>Oku</span></div>
            <div className="brand-caption">безопасный доступ</div>
          </div>
        </div>

        <div className="reset-story-content">
          <div className="reset-shield"><Icon name="shield" size={34} /></div>
          <div className="eyebrow"><span className="eyebrow-dot" /> Восстановление аккаунта</div>
          <h1>Вернём доступ<br /><span>за пару минут.</span></h1>
          <p>Мы отправим одноразовый код на привязанную почту. Код действует один час и исчезнет после использования.</p>
          <div className="reset-benefits">
            <span><Icon name="check" size={16} /> Пароль не отправляется по email</span>
            <span><Icon name="check" size={16} /> Код можно использовать только один раз</span>
            <span><Icon name="check" size={16} /> Учебный прогресс останется на месте</span>
          </div>
        </div>

        <button className="back-to-login" onClick={() => navigate('/login')}>
          <span>←</span> Вернуться ко входу
        </button>
      </section>

      <section className="auth-form-side reset-form-side">
        <div className="auth-form-wrap">
          <div className="reset-steps" aria-label="Этапы восстановления">
            {['email', 'code', 'success'].map((item, index) => {
              const order = ['email', 'code', 'success']
              const activeIndex = order.indexOf(step)
              return <span key={item} className={index <= activeIndex ? 'active' : ''}>{index < activeIndex ? <Icon name="check" size={13} /> : index + 1}</span>
            })}
          </div>

          {step === 'email' && (
            <>
              <div className="auth-form-heading">
                <h2>Забыли пароль?</h2>
                <p>Введите email, указанный при регистрации. Мы отправим на него код подтверждения.</p>
              </div>
              <div className="auth-form reset-card">
                <form onSubmit={requestCode}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-email">Электронная почта</label>
                    <div className="input-wrap">
                      <Icon name="mail" className="input-icon" />
                      <input id="reset-email" className="auth-input" type="email" name="email" value={form.email} onChange={update} placeholder="name@example.com" autoComplete="email" required autoFocus />
                    </div>
                  </div>
                  {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /><span>{error}</span></div>}
                  <button className="auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? 'Отправляем письмо…' : 'Получить код'}</span>
                    {!loading && <Icon name="arrow" size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="auth-form-heading">
                <h2>Проверьте почту</h2>
                <p>Код отправлен на <strong>{form.email}</strong>. Иногда письмо попадает в папку «Спам».</p>
              </div>
              <div className="auth-form reset-card">
                <form onSubmit={resetPassword}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reset-code">Код из письма</label>
                    <input id="reset-code" className="auth-input code-input" inputMode="numeric" name="reset_code" value={form.reset_code} onChange={update} placeholder="000000" autoComplete="one-time-code" required autoFocus />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-password">Новый пароль</label>
                    <div className="input-wrap">
                      <Icon name="lock" className="input-icon" />
                      <input id="new-password" className="auth-input" type={showPasswords ? 'text' : 'password'} name="new_password" value={form.new_password} onChange={update} placeholder="Минимум 8 символов" minLength={8} autoComplete="new-password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPasswords(value => !value)} aria-label={showPasswords ? 'Скрыть пароль' : 'Показать пароль'}><Icon name={showPasswords ? 'eyeOff' : 'eye'} size={17} /></button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">Повторите пароль</label>
                    <div className="input-wrap">
                      <Icon name="lock" className="input-icon" />
                      <input id="confirm-password" className="auth-input" type={showPasswords ? 'text' : 'password'} name="confirm_password" value={form.confirm_password} onChange={update} placeholder="Ещё раз новый пароль" minLength={8} autoComplete="new-password" required />
                    </div>
                  </div>

                  {error && <div className="auth-error" role="alert"><Icon name="alert" size={17} /><span>{error}</span></div>}
                  <button className="auth-submit" type="submit" disabled={loading}>
                    <span>{loading ? 'Сохраняем…' : 'Изменить пароль'}</span>
                    {!loading && <Icon name="arrow" size={18} />}
                  </button>
                  <button type="button" className="resend-button" onClick={requestCode} disabled={loading}><Icon name="refresh" size={15} /> Отправить код ещё раз</button>
                </form>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="auth-form reset-card success-card">
              <div className="success-icon"><Icon name="check" size={28} /></div>
              <h2>Пароль изменён</h2>
              <p>Теперь можно войти в PythonOku с новым паролем.</p>
              <button className="auth-submit" type="button" onClick={() => navigate('/login')}><span>Перейти ко входу</span><Icon name="arrow" size={18} /></button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
