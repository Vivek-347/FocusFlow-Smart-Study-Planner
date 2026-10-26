import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, BookOpen, CalendarDays, ChartNoAxesColumn, Settings, Timer, X, Sparkles } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/planner', label: 'Study Planner', icon: CalendarDays },
  { to: '/focus', label: 'Focus Timer', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
  { to: '/smart-tools', label: 'Smart Study Tools', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  return <>
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark">F</div>
        <div><div className="brand-name">FocusFlow</div><div className="brand-subtitle">STUDY SMARTER</div></div>
        <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon size={19} strokeWidth={1.9} /><span>{label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="quote-icon">✦</div>
        <p className="quote-title">Small steps, big results.</p>
        <p className="quote-copy">A little progress each day adds up to big results.</p>
        <div className="sidebar-footer">Made for your next big goal ✨</div>
      </div>
    </aside>
  </>
}