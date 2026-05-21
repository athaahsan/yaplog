import { useEffect, useState } from 'react'
import MobileHeader from './components/layout/MobileHeader'
import Sidebar from './components/layout/Sidebar'
import PlaceholderWorkspace from './components/PlaceholderWorkspace'
import JournalWorkspace from './components/journal/JournalWorkspace'
import './App.css'

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark)

  document.documentElement.classList.toggle('dark', shouldUseDark)
  document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
}

function App() {
  const [activeApp, setActiveApp] = useState('Journal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(
    () => localStorage.getItem('yaplog-theme') || 'system',
  )

  useEffect(() => {
    localStorage.setItem('yaplog-theme', theme)
    applyTheme(theme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    media.addEventListener('change', handleSystemThemeChange)
    return () => media.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  function exportData() {
    const storage = Object.fromEntries(
      Array.from({ length: localStorage.length }, (_, index) => {
        const key = localStorage.key(index)
        return [key, localStorage.getItem(key)]
      }).filter(([key]) => key),
    )

    const payload = {
      app: 'YapLog',
      version: 1,
      exportedAt: new Date().toISOString(),
      storage,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `yaplog-export-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function selectApp(app) {
    setActiveApp(app)
    setSidebarOpen(false)
  }

  return (
    <main className="app-shell">
      <MobileHeader
        sidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeApp={activeApp}
        onCloseSidebar={() => setSidebarOpen(false)}
        onExportData={exportData}
        onSelectApp={selectApp}
        onThemeChange={setTheme}
        sidebarOpen={sidebarOpen}
        theme={theme}
      />

      <section className="workspace" aria-label="YapLog workspace">
        {activeApp === 'Journal' ? (
          <JournalWorkspace />
        ) : (
          <PlaceholderWorkspace activeApp={activeApp} />
        )}
      </section>
    </main>
  )
}

export default App
