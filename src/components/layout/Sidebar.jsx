import { useEffect, useRef, useState } from 'react'
import {
  BookOpenText,
  CheckSquare,
  ChevronDown,
  Download,
  FileText,
  Laptop,
  LogIn,
  Moon,
  NotebookPen,
  Sun,
  X,
} from 'lucide-react'

const appLinks = [
  { label: 'Journal', icon: NotebookPen },
  { label: 'Tasks', icon: CheckSquare },
  { label: 'Memos', icon: FileText },
]

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
]

function Sidebar({
  activeApp,
  onSelectApp,
  onCloseSidebar,
  onExportData,
  sidebarOpen,
  theme,
  onThemeChange,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!userMenuRef.current?.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <aside
      className="sidebar"
      data-open={sidebarOpen}
      aria-label="Main navigation"
    >
      <header className="sidebar-header">
        <div className="brand-mark" aria-hidden="true">
          <BookOpenText size={20} strokeWidth={2.2} />
        </div>
        <span>YapLog</span>
        <button
          className="sidebar-close"
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseSidebar}
        >
          <X size={18} />
        </button>
      </header>

      <nav className="sidebar-content">
        <section className="sidebar-group" aria-labelledby="apps-heading">
          <h2 id="apps-heading">Workspace</h2>
          <div className="nav-list">
            {appLinks.map((item) => {
              const Icon = item.icon

              return (
                <button
                  className="nav-item"
                  type="button"
                  aria-current={activeApp === item.label ? 'page' : undefined}
                  key={item.label}
                  onClick={() => onSelectApp(item.label)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="sidebar-group" aria-labelledby="theme-heading">
          <h2 id="theme-heading">Theme</h2>
          <div className="theme-switcher">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const active = theme === option.value

              return (
                <button
                  className="theme-option"
                  type="button"
                  aria-pressed={active}
                  data-active={active}
                  key={option.value}
                  onClick={() => onThemeChange(option.value)}
                >
                  <Icon size={16} />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </section>
      </nav>

      <footer className="sidebar-footer" ref={userMenuRef}>
        <button
          className="user-button"
          type="button"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          onClick={() => setUserMenuOpen((open) => !open)}
        >
          <span className="avatar" aria-hidden="true">
            Y
          </span>
          <span className="user-copy">
            <span className="user-name">Local user</span>
            <span className="user-status">Phase one storage</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {userMenuOpen && (
          <div className="user-menu" role="menu">
            <button className="menu-item" type="button" disabled role="menuitem">
              <LogIn size={16} />
              <span>Sign in</span>
            </button>
            <button
              className="menu-item"
              type="button"
              role="menuitem"
              onClick={() => {
                onExportData()
                setUserMenuOpen(false)
              }}
            >
              <Download size={16} />
              <span>Export data</span>
            </button>
          </div>
        )}
      </footer>
    </aside>
  )
}

export default Sidebar
