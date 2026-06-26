import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthDialog from './components/auth/AuthDialog'
import ProfileDialog from './components/auth/ProfileDialog'
import AppRoutes from './components/AppRoutes'
import HomePage from './components/home/HomePage'
import LegalPage from './components/legal/LegalPage'
import SettingsDialog from './components/settings/SettingsDialog'
import {
  appRouteMap,
  getActiveAppFromPath,
  getBreadcrumbItems,
  getJournalEntryRoute,
} from './routes/appRoutes'
import AppShell from './components/AppShell'
import { Button } from '@/components/ui/button'
import { useAppearance } from './hooks/useAppearance'
import { useAuthSession } from './hooks/useAuthSession'
import {
  useMasterData,
  useMasterDataPersistence,
} from './hooks/useMasterData'
import './App.css'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState('signIn')
  const authScopeReadyRef = useRef(false)
  const previousAuthScopeRef = useRef('guest')
  const {
    cancelImport,
    exportData,
    handleImportFileChange,
    importError,
    importInputRef,
    masterData,
    mergeImport,
    openImportPicker,
    pendingImport,
    replaceWithImport,
    setImportError,
    setMasterData,
    updateCalendarEvents,
    updateJournalEntries,
    updateMemoItems,
    updateSetting,
    updateTaskItems,
  } = useMasterData()
  const font = masterData.settings.font
  const theme = masterData.settings.theme
  const activeApp = getActiveAppFromPath(location.pathname)
  const breadcrumbs = getBreadcrumbItems(location.pathname, masterData)
  const legalPageType =
    location.pathname === '/privacy'
      ? 'privacy'
      : location.pathname === '/terms'
        ? 'terms'
        : ''

  const handlePasswordRecovery = useCallback(() => {
    setSignInDialogOpen(true)
    setAuthDialogMode('reset')
  }, [])

  const auth = useAuthSession({
    masterData,
    onPasswordRecovery: handlePasswordRecovery,
    setMasterData,
  })
  const authScopeKey = auth.authUser?.id || 'guest'

  useAppearance({ font, theme })
  useMasterDataPersistence({
    authLoading: auth.authLoading,
    authProfile: auth.authProfile,
    authUser: auth.authUser,
    cloudReady: auth.cloudReady,
    masterData,
    onSyncError: auth.setAuthError,
  })

  useEffect(() => {
    if (legalPageType) {
      return
    }

    if (auth.authLoading) {
      return
    }

    if (!authScopeReadyRef.current) {
      authScopeReadyRef.current = true
      previousAuthScopeRef.current = authScopeKey
      return
    }

    if (previousAuthScopeRef.current === authScopeKey) {
      return
    }

    previousAuthScopeRef.current = authScopeKey
    navigate('/dashboard', { replace: true })
  }, [auth.authLoading, authScopeKey, legalPageType, navigate])

  useEffect(() => {
    const legacyEntryId = new URLSearchParams(location.search).get('journalEntry')

    if (!legacyEntryId) {
      return
    }

    navigate(getJournalEntryRoute(legacyEntryId), { replace: true })
  }, [location.search, navigate])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  function selectApp(app) {
    navigate(appRouteMap[app] || '/journal')
    setSidebarOpen(false)
  }

  if (legalPageType) {
    return <LegalPage type={legalPageType} />
  }

  if (auth.authLoading) {
    return <AppLoadingScreen />
  }

  const authErrorToast = auth.authError && (
    <ToastAlert
      align="left"
      message={auth.authError}
      onDismiss={() => auth.setAuthError('')}
    />
  )
  const signInDialog = signInDialogOpen && (
    <AuthDialog
      authLoading={auth.authLoading}
      initialMode={authDialogMode}
      key={authDialogMode}
      onClose={() => setSignInDialogOpen(false)}
      onForgotPassword={auth.resetPassword}
      onGoogleSignIn={auth.signIn}
      onPasswordSignIn={auth.signInWithEmail}
      onPasswordSignUp={auth.signUpWithEmail}
      onPasswordUpdate={auth.setNewPassword}
    />
  )
  const profileDialog = profileDialogOpen && auth.authProfile && (
    <ProfileDialog
      profile={auth.authProfile}
      onDeleteAccount={auth.deleteAccount}
      onClose={() => setProfileDialogOpen(false)}
      onSave={auth.saveProfile}
    />
  )
  const settingsDialog = settingsDialogOpen && (
    <SettingsDialog
      font={font}
      theme={theme}
      onClose={() => setSettingsDialogOpen(false)}
      onExportData={() => {
        exportData()
        setSettingsDialogOpen(false)
      }}
      onFontChange={(value) => updateSetting('font', value)}
      onImportData={() => {
        openImportPicker()
        setSettingsDialogOpen(false)
      }}
      onThemeChange={(value) => updateSetting('theme', value)}
    />
  )

  if (location.pathname === '/') {
    if (auth.authUser) {
      return <Navigate to="/dashboard" replace />
    }

    return (
      <>
        <HomePage
          entriesCount={masterData.journal.entries.length}
          signedIn={Boolean(auth.authUser)}
          onOpenJournal={() => navigate('/journal')}
          onSignIn={() => {
            setAuthDialogMode('signIn')
            setSignInDialogOpen(true)
          }}
          onStartWriting={() => navigate('/journal/new')}
        />
        {authErrorToast}
        {signInDialog}
        {settingsDialog}
      </>
    )
  }

  return (
    <AppShell
      activeApp={activeApp}
      authLoading={auth.authLoading}
      authProfile={auth.authProfile}
      breadcrumbs={breadcrumbs}
      onCloseSidebar={() => setSidebarOpen(false)}
      onOpenSidebar={() => setSidebarOpen(true)}
      onProfile={() => {
        setSidebarOpen(false)
        setProfileDialogOpen(true)
      }}
      onSelectApp={selectApp}
      onSettings={() => {
        setSidebarOpen(false)
        setSettingsDialogOpen(true)
      }}
      onSignIn={() => {
        setSidebarOpen(false)
        setAuthDialogMode('signIn')
        setSignInDialogOpen(true)
      }}
      onSignOut={auth.signOutUser}
      sidebarOpen={sidebarOpen}
    >
      <AppRoutes
        authScopeKey={authScopeKey}
        calendarEvents={masterData.calendar.events}
        entries={masterData.journal.entries}
        memoItems={masterData.memos.items}
        onCalendarEventsChange={updateCalendarEvents}
        onEntriesChange={updateJournalEntries}
        onMemoItemsChange={updateMemoItems}
        onTaskItemsChange={updateTaskItems}
        taskItems={masterData.tasks.items}
        voiceInputEnabled={Boolean(auth.authUser)}
        voiceInputUserId={auth.authUser?.id || ''}
      />

      <input
        ref={importInputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleImportFileChange}
      />

      {importError && (
        <ToastAlert
          align="right"
          message={importError}
          onDismiss={() => setImportError('')}
        />
      )}

      {authErrorToast}

      {pendingImport && (
        <ImportDialog
          onCancel={cancelImport}
          onMerge={mergeImport}
          onReplace={replaceWithImport}
        />
      )}

      {signInDialog}

      {profileDialog}

      {settingsDialog}
    </AppShell>
  )
}

function AppLoadingScreen() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background p-6 text-foreground">
      <div
        className="absolute inset-0 bg-popover/35 backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--foreground)_8%,transparent),transparent_42%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 grid place-items-center gap-5 text-popover-foreground">
        <div
          className="text-2xl font-bold underline decoration-double underline-offset-4"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          YapLog
        </div>
        <Loader2
          className="size-5 animate-spin text-muted-foreground"
          aria-label="Loading YapLog"
        />
      </div>
    </main>
  )
}

function ToastAlert({ align, message, onDismiss }) {
  return (
    <div
      className={`fixed bottom-4 ${align === 'left' ? 'left-4' : 'right-4'} z-[70] flex max-w-sm items-start gap-2 rounded-lg border border-destructive/35 bg-popover p-3 text-sm text-popover-foreground shadow-lg`}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-4 text-destructive" />
      <span>{message}</span>
      <Button
        className="ml-auto h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        variant="ghost"
        type="button"
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  )
}

function ImportDialog({ onCancel, onMerge, onReplace }) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="w-full max-w-[420px] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
        <h2
          className="text-lg font-semibold text-foreground"
          id="import-dialog-title"
        >
          Import data
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Replace swaps your current YapLog data with this file. Merge keeps
          your current settings and adds the imported journals, tasks, calendar
          events, and notes.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Button type="button" onClick={onReplace}>
            Replace
          </Button>
          <Button type="button" variant="secondary" onClick={onMerge}>
            Merge
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
