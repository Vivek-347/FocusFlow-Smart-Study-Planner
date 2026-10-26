import { Menu, Sun, Moon, LogOut } from 'lucide-react'

export default function Topbar({ theme, toggleTheme, onMenu, pageTitle, user, onLogout, syncStatus }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return <header className="topbar">
    <button className="icon-button menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button>
    <div className="topbar-heading"><span className="eyebrow">{greeting} 👋</span><strong>{pageTitle}</strong></div>
    <div className="topbar-actions">
      <button className="icon-button" title="Toggle theme" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
      <span className="sync-status" title="Database sync status">{syncStatus}</span><div className="avatar" title={user?.name || "Student profile"}>{(user?.name || "S").trim().charAt(0).toUpperCase()}</div><button className="icon-button logout-button" title="Log out" aria-label="Log out" onClick={onLogout}><LogOut size={18} /></button>
    </div>
  </header>
}