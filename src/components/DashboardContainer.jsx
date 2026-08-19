import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const navLinks = [
  { to: '/student/dashboard', icon: 'home', label: 'Главная' },
  { to: '/student/courses', icon: 'book', label: 'Уроки' },
  { to: '/student/homework', icon: 'task', label: 'Задания' },
  { to: '/student/rating', icon: 'trophy', label: 'Рейтинг' },
  { to: '/student/schedule', icon: 'calendar', label: 'Расписание' },
  { to: '/student/forum', icon: 'chat', label: 'Форум' },
  { to: '/student/profile', icon: 'user', label: 'Профиль' },
]

/**
 * DashboardContainer
 * ----------------------------------------------------------------------------
 * Primary gamified learning shell established with the 60-30-10 palette:
 *   60% white canvas        -> crisp white / off-white backgrounds
 *   30% success green       -> navigation accents, progress, CTAs
 *   10% tech deep-blue      -> brand mark + small structural accents
 *
 * Renders a minimalist top navigation bar (brand + progress + nav links)
 * and a children area that pages fill with the dual-pane workspace.
 */
export default function DashboardContainer({
  username = 'Студент',
  progressPercent = 65,
  streak = 7,
  xp = 2140,
  children,
}) {
  return (
    <div className="gamified-shell">
      <header className="gamified-topbar">
        <a className="gamified-brand" href="/student/dashboard">
          <span className="gamified-brand-mark">Py</span>
          <span>
            <span className="gamified-brand-name">Python<span>Oku</span></span>
            <span className="gamified-brand-caption">учись в своём ритме</span>
          </span>
        </a>

        <nav className="gamified-nav" aria-label="Навигация ученика">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `gamified-nav-link${isActive ? ' active' : ''}`}
              title={link.label}
            >
              <Icon name={link.icon} size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="gamified-nav-stats">
          <span className="gamified-nav-chip">
            <Icon name="flame" size={15} />
            <span>{streak} дней</span>
          </span>
          <span className="gamified-nav-chip mint">
            <Icon name="bolt" size={15} />
            <span>{xp} XP</span>
          </span>
          <span className="gamified-nav-chip">
            <Icon name="user" size={15} />
            <span>{username}</span>
          </span>
        </div>
      </header>

      <div className="gamified-progress-bar" aria-label="Твой прогресс">
        <div className="gamified-progress-label">
          <span>Прогресс курса</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="gamified-progress-track">
          <span
            className="gamified-progress-fill"
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}