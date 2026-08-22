import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'
import BrandLogo from './BrandLogo'
import LanguageSwitcher from './LanguageSwitcher'

function Brand() {
  const { t } = useTranslation()
  return (
    <div className="brand">
      <BrandLogo />
      <div className="brand-copy">
        <div className="brand-name">Python<span>Oku</span></div>
        <div className="brand-caption">{t('public.brand.tagline')}</div>
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const links = [
    { to: '/student/dashboard', icon: 'home', label: t('sidebar.dashboard') },
    { to: '/student/courses', icon: 'book', label: t('sidebar.lessons') },
    { to: '/student/homework', icon: 'task', label: t('sidebar.homework') },
    { to: '/student/forum', icon: 'chat', label: t('sidebar.forum') },
    { to: '/student/rating', icon: 'trophy', label: t('sidebar.rating') },
    { to: '/student/schedule', icon: 'calendar', label: t('sidebar.schedule') },
    { to: '/student/profile', icon: 'user', label: t('sidebar.profile') },
  ]
  
  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  return (
    <aside className="app-sidebar" aria-label={t('sidebar.navigation')}>
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

      <div className="sidebar-section-title">{t('sidebar.navigation')}</div>
      <nav className="sidebar-nav">
        {links.map(link => <NavItem key={link.to} {...link} />)}
        <NavItem to="/student/notifications" icon="bell" label={t('sidebar.notifications')} badge={notifCount} />
      </nav>

      {user?.streak > 0 && (
        <div className="sidebar-streak" title={`${user.streak} ${t('dashboard.daysInRow')}`}>
          <Icon name="flame" size={18} />
          <span className="streak-copy">{t('dashboard.currentStreak')}: {user.streak} {t('time.days')}</span>
        </div>
      )}

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
