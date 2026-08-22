import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import BrandLogo from './BrandLogo'
import LanguageSwitcher from './LanguageSwitcher'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const links = [
    { to: '/teacher/dashboard', icon: 'chart', label: t('sidebar.analytics') },
    { to: '/teacher/courses', icon: 'book', label: t('sidebar.courses') },
    { to: '/teacher/students', icon: 'users', label: t('sidebar.students') },
    { to: '/teacher/schedule', icon: 'calendar', label: t('sidebar.schedule') },
  ]
  
  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  return (
    <aside className="app-sidebar teacher" aria-label={t('sidebar.navigation')}>
      <div className="brand">
        <BrandLogo />
        <div className="brand-copy">
          <div className="brand-name">Python<span>Oku</span></div>
          <div className="brand-caption">{t('dashboard.teacherPanel')}</div>
        </div>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar"><Icon name="chart" size={18} /></div>
        <div className="profile-copy min-w-0">
          <div className="profile-name">{t('sidebar.workspace')}</div>
          <div className="profile-meta" style={{ color: 'var(--accent)' }}>{t('sidebar.management')}</div>
        </div>
      </div>

      <div className="sidebar-section-title">{t('sidebar.management')}</div>
      <nav className="sidebar-nav">
        {links.map(link => <NavItem key={link.to} {...link} />)}
        <NavItem to="/teacher/notifications" icon="bell" label={t('sidebar.notifications')} badge={notifCount} />
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <LanguageSwitcher />
        </div>
        <button type="button" onClick={logout} className="nav-item sidebar-logout" title={t('common.logout')}>
          <span className="nav-icon"><Icon name="logout" /></span>
          <span className="nav-label">{t('common.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
