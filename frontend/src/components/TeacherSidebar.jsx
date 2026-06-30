import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const links = [
  { to: '/teacher/dashboard', icon: 'chart', label: 'Аналитика' },
  { to: '/teacher/courses', icon: 'book', label: 'Курсы и уроки' },
  { to: '/teacher/students', icon: 'users', label: 'Ученики' },
  { to: '/teacher/schedule', icon: 'calendar', label: 'Расписание' },
]

function NavItem({ to, icon, label, badge }) {
  return (
    <NavLink to={to} title={label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="nav-icon"><Icon name={icon} /></span>
      <span className="nav-label">{label}</span>
      {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  )
}

export default function TeacherSidebar({ notifCount = 0 }) {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  return (
    <aside className="app-sidebar teacher" aria-label="Навигация преподавателя">
      <div className="brand">
        <div className="brand-mark">Py</div>
        <div className="brand-copy">
          <div className="brand-name">Python<span>Oku</span></div>
          <div className="brand-caption">панель преподавателя</div>
        </div>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar"><Icon name="chart" size={18} /></div>
        <div className="profile-copy min-w-0">
          <div className="profile-name">Рабочее пространство</div>
          <div className="profile-meta" style={{ color: 'var(--accent)' }}>Управление курсом</div>
        </div>
      </div>

      <div className="sidebar-section-title">Управление</div>
      <nav className="sidebar-nav">
        {links.map(link => <NavItem key={link.to} {...link} />)}
        <NavItem to="/teacher/notifications" icon="bell" label="Уведомления" badge={notifCount} />
      </nav>

      <div className="sidebar-footer">
        <button type="button" onClick={logout} className="nav-item sidebar-logout" title="Выйти">
          <span className="nav-icon"><Icon name="logout" /></span>
          <span className="nav-label">Выйти</span>
        </button>
      </div>
    </aside>
  )
}
