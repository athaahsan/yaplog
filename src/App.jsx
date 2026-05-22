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

function applyFont(font) {
  const fontStacks = {
    default: "'Geist Variable', sans-serif",
    serif: "'Lora', serif",
    mono: "'Space Mono', monospace",
  }

  document.documentElement.style.setProperty(
    '--app-font-family',
    fontStacks[font] || fontStacks.default,
  )
}

function App() {
  const [activeApp, setActiveApp] = useState('Journal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [font, setFont] = useState(
    () => localStorage.getItem('yaplog-font') || 'default',
  )
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
    localStorage.setItem('yaplog-font', font)
    applyFont(font)
  }, [font])

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
    <main className="grid h-dvh grid-cols-[264px_1fr] overflow-hidden bg-background text-foreground max-[720px]:block max-[720px]:min-h-dvh max-[720px]:w-full max-[720px]:max-w-full max-[720px]:overflow-x-hidden max-[720px]:overflow-y-hidden">
      <MobileHeader
        sidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {sidebarOpen && (
        <button
          className="hidden max-[720px]:fixed max-[720px]:inset-0 max-[720px]:z-40 max-[720px]:block max-[720px]:border-0 max-[720px]:bg-black/35"
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeApp={activeApp}
        font={font}
        onCloseSidebar={() => setSidebarOpen(false)}
        onExportData={exportData}
        onFontChange={setFont}
        onSelectApp={selectApp}
        onThemeChange={setTheme}
        sidebarOpen={sidebarOpen}
        theme={theme}
      />

      <section
        className="h-dvh min-w-0 overflow-hidden p-7 max-[720px]:h-[calc(100dvh-56px)] max-[720px]:min-h-0 max-[720px]:w-full max-[720px]:max-w-dvw max-[720px]:overflow-hidden max-[720px]:p-4 max-[720px]:px-3 max-[720px]:[contain:layout_paint]"
        aria-label="YapLog workspace"
      >
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
