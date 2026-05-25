import { useEffect, useRef, useState } from 'react'
import {
  CheckSquare,
  ChevronDown,
  Download,
  FileText,
  Laptop,
  Moon,
  NotebookPen,
  Sun,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

const fontOptions = [
  {
    value: 'default',
    label: 'Default',
    fontFamily: "'Geist Variable', sans-serif",
  },
  {
    value: 'serif',
    label: 'Serif',
    fontFamily: "'Lora', serif",
  },
  {
    value: 'mono',
    label: 'Mono',
    fontFamily: "'Space Mono', monospace",
  },
]

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-2 3v2.4h3.2c1.9-1.7 3.1-4.2 3.1-7.1Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.4c-.9.6-2 .9-3.5.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.5C4.8 19.7 8.2 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.4l3.3-2.5Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2 8.2 2 4.8 4.3 3.1 7.6l3.3 2.5C7.2 7.8 9.4 6 12 6Z"
      />
    </svg>
  )
}

function Sidebar({
  activeApp,
  font,
  onSelectApp,
  onCloseSidebar,
  onExportData,
  onImportData,
  sidebarOpen,
  theme,
  onThemeChange,
  onFontChange,
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
      className="sticky top-0 flex h-dvh min-h-dvh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground max-[720px]:fixed max-[720px]:inset-y-0 max-[720px]:left-0 max-[720px]:top-auto max-[720px]:z-50 max-[720px]:w-[min(82vw,292px)] max-[720px]:-translate-x-full max-[720px]:border-b-0 max-[720px]:shadow-[18px_0_48px_oklch(0_0_0/18%)] max-[720px]:transition-transform max-[720px]:duration-200 max-[720px]:data-[open=true]:translate-x-0"
      data-open={sidebarOpen}
      aria-label="Main navigation"
    >
      <header className="flex min-h-16 items-center gap-2.5 border-b border-sidebar-border px-[18px] text-[17px] font-semibold">
        <span className="flex-1 underline decoration-double">YapLog</span>
        <Button
          className="hidden size-9 rounded-lg text-foreground max-[720px]:grid"
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseSidebar}
        >
          <X size={18} />
        </Button>
      </header>

      <nav className="flex flex-1 flex-col gap-7 px-3 py-[18px] max-[720px]:gap-[18px]">
        <section aria-labelledby="apps-heading">
          <h2
            className="mb-2 px-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground"
            id="apps-heading"
          >
            Workspace
          </h2>
          <div className="grid gap-1">
            {appLinks.map((item) => {
              const Icon = item.icon
              const active = activeApp === item.label

              return (
                <Button
                  className={cn(
                    'h-auto w-full justify-start gap-2.5 rounded-lg px-2.5 py-[9px] text-left text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    active &&
                      'bg-sidebar-accent font-semibold text-sidebar-accent-foreground',
                  )}
                  variant="ghost"
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  key={item.label}
                  onClick={() => onSelectApp(item.label)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="appearance-heading">
          <h2
            className="mb-2 px-2 text-xs font-semibold uppercase tracking-normal text-muted-foreground"
            id="appearance-heading"
          >
            Appearance
          </h2>
          <div className="grid grid-cols-3 gap-1">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const active = theme === option.value

              return (
                <Button
                  className={cn(
                    'h-[38px] w-full rounded-lg border border-transparent p-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    active &&
                      'bg-sidebar-accent text-sidebar-accent-foreground',
                  )}
                  variant="ghost"
                  size="icon"
                  type="button"
                  aria-label={`Use ${option.label.toLowerCase()} theme`}
                  aria-pressed={active}
                  data-active={active}
                  key={option.value}
                  onClick={() => onThemeChange(option.value)}
                  title={option.label}
                >
                  <Icon size={15} />
                </Button>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {fontOptions.map((option) => {
              const active = font === option.value

              return (
                <Button
                  className={cn(
                    'grid h-[72px] gap-1 rounded-lg border border-transparent px-1.5 py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    active &&
                      'bg-sidebar-accent text-sidebar-accent-foreground',
                  )}
                  variant="ghost"
                  type="button"
                  aria-label={`Use ${option.label.toLowerCase()} font`}
                  aria-pressed={active}
                  key={option.value}
                  onClick={() => onFontChange(option.value)}
                  style={{ fontFamily: option.fontFamily }}
                >
                  <span className="text-[26px] font-semibold leading-none">
                    Ag
                  </span>
                  <span className="text-[11px] font-semibold leading-none">
                    {option.label}
                  </span>
                </Button>
              )
            })}
          </div>
        </section>
      </nav>

      <footer
        className="relative border-t border-sidebar-border p-3"
        ref={userMenuRef}
      >
        <Button
          className="grid h-auto w-full grid-cols-[36px_1fr_16px] items-center gap-2.5 rounded-lg p-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent"
          variant="ghost"
          type="button"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          onClick={() => setUserMenuOpen((open) => !open)}
        >
          <span
            className="grid size-9 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
            aria-hidden="true"
          >
            Y
          </span>
          <span className="grid min-w-0">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
              Guest
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
              Stored on this device
            </span>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </Button>

        {userMenuOpen && (
          <div
            className="absolute inset-x-3 bottom-[calc(100%+8px)] grid gap-1 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_40px_oklch(0_0_0/14%)]"
            role="menu"
          >
            <Button
              className="h-auto justify-start gap-2.5 rounded-md border border-border bg-background p-2.5 text-foreground opacity-100 hover:bg-muted disabled:pointer-events-none disabled:opacity-100"
              variant="outline"
              type="button"
              disabled
              role="menuitem"
            >
              <GoogleIcon className="size-4" />
              <span className="font-semibold">Continue with Google</span>
            </Button>
            <Button
              className="h-auto justify-start gap-[9px] rounded-md p-2"
              variant="ghost"
              type="button"
              role="menuitem"
              onClick={() => {
                onExportData()
                setUserMenuOpen(false)
              }}
            >
              <Download size={16} />
              <span>Export data</span>
            </Button>
            <Button
              className="h-auto justify-start gap-[9px] rounded-md p-2"
              variant="ghost"
              type="button"
              role="menuitem"
              onClick={() => {
                onImportData()
                setUserMenuOpen(false)
              }}
            >
              <Upload size={16} />
              <span>Import data</span>
            </Button>
          </div>
        )}
      </footer>
    </aside>
  )
}

export default Sidebar
