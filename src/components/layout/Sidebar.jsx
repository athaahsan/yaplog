import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  LogIn,
  LogOut,
  NotebookPen,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_VERSION } from '@/data/appConfig'
import { cn } from '@/lib/utils'

const appLinks = [
  { label: 'Dashboard', icon: Home },
  { label: 'Journal', icon: NotebookPen },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Tasks', icon: CheckSquare },
  { label: 'Notes', icon: FileText },
]

const userMenuItemClassName =
  'h-8 justify-start gap-2 rounded-md px-2.5 text-[13px] leading-none text-popover-foreground hover:bg-muted/70 hover:text-popover-foreground disabled:pointer-events-none disabled:opacity-70'
const userMenuDividerClassName = 'my-1 h-px scale-y-50 bg-border'

function Sidebar({
  activeApp,
  authLoading,
  authProfile,
  onSelectApp,
  onCloseSidebar,
  onProfile,
  onSettings,
  onSignIn,
  onSignOut,
  sidebarOpen,
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('')
  const userMenuRef = useRef(null)
  const signedIn = Boolean(authProfile)
  const displayName = authProfile?.userName || 'Guest'
  const displaySubtitle = signedIn
    ? authProfile?.userEmail || 'Synced to cloud'
    : 'Stored on this device'
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || 'Y'

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
      <header className="flex min-h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <span
          className="flex-1 text-[19px] font-semibold underline decoration-double"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          YapLog
        </span>
        <Button
          className="hidden size-9 rounded-lg text-foreground max-[720px]:grid"
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseSidebar}
        >
          <X className="size-4.5" />
        </Button>
      </header>

      <nav className="flex flex-1 flex-col px-3 py-4">
        <section aria-label="Workspace">
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
      </nav>

      <div
        className="px-5 py-3 text-[11px] font-semibold leading-none text-muted-foreground"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        Version {APP_VERSION.replace(/^v/i, '')}
      </div>

      <footer
        className="relative border-t border-sidebar-border p-3"
        ref={userMenuRef}
      >
        <Button
          className="grid h-auto w-full grid-cols-[36px_1fr] items-center gap-2.5 rounded-lg p-2 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent/70"
          variant="ghost"
          type="button"
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          onClick={() => setUserMenuOpen((open) => !open)}
        >
          <span
            className="grid size-9 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
            aria-hidden="true"
          >
            {authProfile?.avatarUrl &&
            failedAvatarUrl !== authProfile.avatarUrl ? (
              <img
                className="size-full object-cover"
                src={authProfile.avatarUrl}
                alt=""
                onError={() => setFailedAvatarUrl(authProfile.avatarUrl)}
              />
            ) : (
              displayInitial
            )}
          </span>
          <span className="grid min-w-0">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
              {displayName}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
              {displaySubtitle}
            </span>
          </span>
        </Button>

        {userMenuOpen && (
          <div
            className="absolute inset-x-3 bottom-[calc(100%+6px)] grid gap-0 rounded-lg border border-sidebar-border bg-popover/95 p-1 font-sans text-popover-foreground shadow-[0_12px_32px_oklch(0_0_0/12%)] backdrop-blur-md"
            role="menu"
          >
            {signedIn ? (
              <>
                <Button
                  className={userMenuItemClassName}
                  variant="ghost"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onProfile()
                    setUserMenuOpen(false)
                  }}
                >
                  <UserRound size={16} />
                  <span>Account</span>
                </Button>

                <Button
                  className={userMenuItemClassName}
                  variant="ghost"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSettings()
                    setUserMenuOpen(false)
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  className={userMenuItemClassName}
                  variant="ghost"
                  type="button"
                  disabled={authLoading}
                  role="menuitem"
                  onClick={() => {
                    onSignIn()
                    setUserMenuOpen(false)
                  }}
                >
                  <LogIn size={16} />
                  <span>{authLoading ? 'Checking...' : 'Log in'}</span>
                </Button>

                <Button
                  className={userMenuItemClassName}
                  variant="ghost"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSettings()
                    setUserMenuOpen(false)
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Button>
              </>
            )}

            {signedIn && (
              <>
                <div className={userMenuDividerClassName} role="separator" />

                <Button
                  className={userMenuItemClassName}
                  variant="ghost"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSignOut()
                    setUserMenuOpen(false)
                  }}
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </Button>
              </>
            )}
          </div>
        )}
      </footer>
    </aside>
  )
}

export default Sidebar
