import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthDialog from './components/auth/AuthDialog'
import ProfileDialog from './components/auth/ProfileDialog'
import AppRoutes from './components/AppRoutes'
import {
  appRouteMap,
  getActiveAppFromPath,
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
    updateJournalEntries,
    updateSetting,
  } = useMasterData()
  const font = masterData.settings.font
  const theme = masterData.settings.theme
  const activeApp = getActiveAppFromPath(location.pathname)

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
    navigate('/journal', { replace: true })
  }, [auth.authLoading, authScopeKey, navigate])

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

  return (
    <AppShell
      activeApp={activeApp}
      authLoading={auth.authLoading}
      authProfile={auth.authProfile}
      font={font}
      onCloseSidebar={() => setSidebarOpen(false)}
      onExportData={exportData}
      onFontChange={(value) => updateSetting('font', value)}
      onImportData={openImportPicker}
      onOpenSidebar={() => setSidebarOpen(true)}
      onProfile={() => {
        setSidebarOpen(false)
        setProfileDialogOpen(true)
      }}
      onSelectApp={selectApp}
      onSignIn={() => {
        setSidebarOpen(false)
        setAuthDialogMode('signIn')
        setSignInDialogOpen(true)
      }}
      onSignOut={auth.signOutUser}
      onThemeChange={(value) => updateSetting('theme', value)}
      sidebarOpen={sidebarOpen}
      theme={theme}
    >
      <AppRoutes
        authScopeKey={authScopeKey}
        entries={masterData.journal.entries}
        onEntriesChange={updateJournalEntries}
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

      {auth.authError && (
        <ToastAlert
          align="left"
          message={auth.authError}
          onDismiss={() => auth.setAuthError('')}
        />
      )}

      {pendingImport && (
        <ImportDialog
          onCancel={cancelImport}
          onMerge={mergeImport}
          onReplace={replaceWithImport}
        />
      )}

      {signInDialogOpen && (
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
      )}

      {profileDialogOpen && auth.authProfile && (
        <ProfileDialog
          profile={auth.authProfile}
          onClose={() => setProfileDialogOpen(false)}
          onSave={auth.saveProfile}
        />
      )}
    </AppShell>
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
          Replace swaps your local master JSON with this file. Merge keeps
          your settings and appends the imported journal entries.
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
