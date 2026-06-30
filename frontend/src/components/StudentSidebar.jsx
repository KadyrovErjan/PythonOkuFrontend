import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import BrandLogo from './BrandLogo'

const links = [
  { to: '/student/dashboard', icon: 'home', label: 'Главная' },
  { to: '/student/courses', icon: 'book', label: 'Уроки' },
  { to: '/student/forum', icon: 'chat', label: 'Форум' },
  { to: '/student/rating', icon: 'trophy', label: 'Рейтинг' },
  { to: '/student/schedule', icon: 'calendar', label: 'Расписание' },
  { to: '/student/profile', icon: 'user', label: 'Профиль' },
]

function Brand() {
  return (
    <div className="brand">
      <BrandLogo />
      <div className="brand-copy">
        <div className="brand-name">Python<span>Oku</span></div>
        <div className="brand-caption">учись в своём ритме</div>
      </div>
    </div>
  )
}

function NavItem({ to, icon, label, badge }) {
  return (
    <NavLink to={to} title={label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="nav-icon"><Icon name={icon} /></span>
      <span className="nav-label">{label}</span>
      {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  )
}

export default function StudentSidebar({ user, notifCount = 0 }) {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  return (
    <aside className="app-sidebar" aria-label="Навигация ученика">
      <Brand />
      {user && (
        <div className="sidebar-profile">
          <div className="profile-avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
          <div className="profile-copy min-w-0">
            <div className="profile-name">{user.username}</div>
            <div className="profile-meta">✦ {user.xp ?? 0} XP</div>
          </div>
        </div>
      )}

      <div className="sidebar-section-title">Навигация</div>
      <nav className="sidebar-nav">
        {links.map(link => <NavItem key={link.to} {...link} />)}
        <NavItem to="/student/notifications" icon="bell" label="Уведомления" badge={notifCount} />
      </nav>

      {user?.streak > 0 && (
        <div className="sidebar-streak" title={`${user.streak} дней подряд`}>
          <Icon name="flame" size={18} />
          <span className="streak-copy">Серия: {user.streak} дней</span>
        </div>
      )}

      <div className="sidebar-footer">
        <button type="button" onClick={logout} className="nav-item sidebar-logout" title="Выйти">
          <span className="nav-icon"><Icon name="logout" /></span>
          <span className="nav-label">Выйти</span>
        </button>
      </div>
    </aside>
  )
}
