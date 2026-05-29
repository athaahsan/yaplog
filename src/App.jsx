import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import AuthDialog from './components/auth/AuthDialog'
import ProfileDialog from './components/auth/ProfileDialog'
import MobileHeader from './components/layout/MobileHeader'
import Sidebar from './components/layout/Sidebar'
import PlaceholderWorkspace from './components/PlaceholderWorkspace'
import JournalWorkspace from './components/journal/JournalWorkspace'
import { Button } from '@/components/ui/button'
import {
  loadMasterData,
  mergeMasterData,
  normalizeMasterData,
  saveMasterData,
  touchMasterData,
} from './lib/masterData'
import { hasSupabaseConfig } from './lib/supabaseClient'
import {
  fetchUserData,
  getCurrentSession,
  getUserProfile,
  onAuthStateChange,
  sendPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
  upsertUserData,
} from './lib/yaplogUserData'
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
  const [masterData, setMasterData] = useState(() => loadMasterData())
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => hasSupabaseConfig())
  const [cloudReady, setCloudReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState('signIn')
  const [savedAuthProfile, setSavedAuthProfile] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState('')
  const importInputRef = useRef(null)
  const cloudSaveTimeoutRef = useRef(null)
  const font = masterData.settings.font
  const theme = masterData.settings.theme
  const authProfile = useMemo(() => {
    if (!authUser) {
      return null
    }

    return {
      ...getUserProfile(authUser),
      ...(savedAuthProfile || {}),
    }
  }, [authUser, savedAuthProfile])

  const prepareSignedInUser = useCallback(async (user) => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const cloudRow = await fetchUserData(user.id)

      setAuthUser(user)

      if (!cloudRow) {
        const localData = loadMasterData()
        const nextCloudData = touchMasterData(localData)
        const profile = getUserProfile(user)
        const savedCloudData = await upsertUserData(user, nextCloudData, profile)

        setSavedAuthProfile(profile)
        setMasterData(savedCloudData)
        setCloudReady(true)
        return
      }

      const cloudData = normalizeMasterData(cloudRow.master_data)
      const providerProfile = getUserProfile(user)
      const profile = {
        ...providerProfile,
        userName: cloudRow.user_name || providerProfile.userName,
        userEmail: cloudRow.user_email || providerProfile.userEmail,
        avatarUrl: cloudRow.avatar_url || providerProfile.avatarUrl,
      }

      setSavedAuthProfile(profile)
      setMasterData(cloudData)
      setCloudReady(true)
    } catch (error) {
      setAuthError(error.message || 'Could not load your cloud data.')
      setAuthUser(null)
      setSavedAuthProfile(null)
      setCloudReady(false)
      setMasterData(loadMasterData())
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
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
    applyFont(font)
  }, [font])

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      return undefined
    }

    let active = true

    async function initializeAuth() {
      try {
        const session = await getCurrentSession()

        if (!active) {
          return
        }

        if (session?.user) {
          await prepareSignedInUser(session.user)
        } else {
          setAuthUser(null)
          setSavedAuthProfile(null)
          setCloudReady(false)
          setAuthLoading(false)
        }
      } catch (error) {
        if (active) {
          setAuthError(error.message || 'Could not initialize sign in.')
          setAuthLoading(false)
        }
      }
    }

    initializeAuth()

    const unsubscribe = onAuthStateChange((event, session) => {
      if (!active) {
        return
      }

      if (event === 'SIGNED_OUT') {
        setAuthUser(null)
        setCloudReady(false)
        setMasterData(loadMasterData())
        setAuthLoading(false)
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        prepareSignedInUser(session.user)
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        setSignInDialogOpen(true)
        setAuthDialogMode('reset')

        if (session?.user) {
          prepareSignedInUser(session.user)
        } else {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [prepareSignedInUser])

  useEffect(() => {
    window.clearTimeout(cloudSaveTimeoutRef.current)

    if (authLoading) {
      return undefined
    }

    if (authUser && cloudReady) {
      cloudSaveTimeoutRef.current = window.setTimeout(() => {
        upsertUserData(authUser, masterData, authProfile).catch((error) => {
          setAuthError(error.message || 'Could not sync your cloud data.')
        })
      }, 400)

      return () => window.clearTimeout(cloudSaveTimeoutRef.current)
    }

    saveMasterData(masterData)
    return undefined
  }, [authLoading, authProfile, authUser, cloudReady, masterData])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  function updateMasterData(updater) {
    setMasterData((current) => {
      const nextData =
        typeof updater === 'function' ? updater(current) : updater
      return touchMasterData(normalizeMasterData(nextData))
    })
  }

  function updateSetting(key, value) {
    updateMasterData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value,
      },
    }))
  }

  function updateJournalEntries(updater) {
    updateMasterData((current) => {
      const currentEntries = current.journal.entries
      const nextEntries =
        typeof updater === 'function' ? updater(currentEntries) : updater

      return {
        ...current,
        journal: {
          ...current.journal,
          entries: nextEntries,
        },
      }
    })
  }

  async function signIn() {
    setAuthError('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setAuthError(error.message || 'Could not start Google sign in.')
    }
  }

  async function signInWithEmail(credentials) {
    setAuthError('')
    return signInWithPassword(credentials)
  }

  async function signUpWithEmail(credentials) {
    setAuthError('')
    return signUpWithPassword(credentials)
  }

  async function resetPassword(email) {
    setAuthError('')
    return sendPasswordReset(email)
  }

  async function setNewPassword(password) {
    setAuthError('')
    return updatePassword(password)
  }

  async function signOutUser() {
    setAuthError('')

    try {
      await signOut()
      setAuthUser(null)
      setSavedAuthProfile(null)
      setCloudReady(false)
      setMasterData(loadMasterData())
    } catch (error) {
      setAuthError(error.message || 'Could not sign out.')
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(masterData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `yaplog-master-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function openImportPicker() {
    setImportError('')
    importInputRef.current?.click()
  }

  async function handleImportFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const fileText = await file.text()
      const importedData = normalizeMasterData(JSON.parse(fileText), {
        strict: true,
      })
      setPendingImport(importedData)
      setImportError('')
    } catch (error) {
      setPendingImport(null)
      setImportError(error.message || 'Could not import that JSON file.')
    }
  }

  function cancelImport() {
    setPendingImport(null)
  }

  function replaceWithImport() {
    setMasterData(pendingImport)
    setPendingImport(null)
    setImportError('')
  }

  function mergeImport() {
    setMasterData((current) => mergeMasterData(current, pendingImport))
    setPendingImport(null)
    setImportError('')
  }

  function selectApp(app) {
    setActiveApp(app)
    setSidebarOpen(false)
  }

  async function saveProfile(profile) {
    if (!authUser) {
      return
    }

    setAuthError('')
    setSavedAuthProfile(profile)

    try {
      await upsertUserData(authUser, masterData, profile)
    } catch (error) {
      setAuthError(error.message || 'Could not save your profile.')
      throw error
    }
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
        authLoading={authLoading}
        authProfile={authProfile}
        font={font}
        onCloseSidebar={() => setSidebarOpen(false)}
        onExportData={exportData}
        onImportData={openImportPicker}
        onFontChange={(value) => updateSetting('font', value)}
        onProfile={() => setProfileDialogOpen(true)}
        onSelectApp={selectApp}
        onSignIn={() => {
          setAuthDialogMode('signIn')
          setSignInDialogOpen(true)
        }}
        onSignOut={signOutUser}
        onThemeChange={(value) => updateSetting('theme', value)}
        sidebarOpen={sidebarOpen}
        theme={theme}
      />

      <section
        className="h-dvh min-w-0 overflow-hidden p-7 max-[720px]:h-[calc(100dvh-56px)] max-[720px]:min-h-0 max-[720px]:w-full max-[720px]:max-w-dvw max-[720px]:overflow-hidden max-[720px]:p-4 max-[720px]:px-3 max-[720px]:[contain:layout_paint]"
        aria-label="YapLog workspace"
      >
        {activeApp === 'Journal' ? (
          <JournalWorkspace
            entries={masterData.journal.entries}
            onEntriesChange={updateJournalEntries}
          />
        ) : (
          <PlaceholderWorkspace activeApp={activeApp} />
        )}
      </section>

      <input
        ref={importInputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleImportFileChange}
      />

      {importError && (
        <div
          className="fixed bottom-4 right-4 z-[70] flex max-w-sm items-start gap-2 rounded-lg border border-destructive/35 bg-popover p-3 text-sm text-popover-foreground shadow-lg"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 text-destructive" />
          <span>{importError}</span>
          <Button
            className="ml-auto h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            variant="ghost"
            type="button"
            onClick={() => setImportError('')}
          >
            Dismiss
          </Button>
        </div>
      )}

      {authError && (
        <div
          className="fixed bottom-4 left-4 z-[70] flex max-w-sm items-start gap-2 rounded-lg border border-destructive/35 bg-popover p-3 text-sm text-popover-foreground shadow-lg"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 text-destructive" />
          <span>{authError}</span>
          <Button
            className="ml-auto h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            variant="ghost"
            type="button"
            onClick={() => setAuthError('')}
          >
            Dismiss
          </Button>
        </div>
      )}

      {pendingImport && (
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
              <Button type="button" onClick={replaceWithImport}>
                Replace
              </Button>
              <Button type="button" variant="secondary" onClick={mergeImport}>
                Merge
              </Button>
              <Button type="button" variant="ghost" onClick={cancelImport}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {signInDialogOpen && (
        <AuthDialog
          authLoading={authLoading}
          initialMode={authDialogMode}
          key={authDialogMode}
          onClose={() => setSignInDialogOpen(false)}
          onForgotPassword={resetPassword}
          onGoogleSignIn={signIn}
          onPasswordSignIn={signInWithEmail}
          onPasswordSignUp={signUpWithEmail}
          onPasswordUpdate={setNewPassword}
        />
      )}

      {profileDialogOpen && authProfile && (
        <ProfileDialog
          profile={authProfile}
          onClose={() => setProfileDialogOpen(false)}
          onSave={saveProfile}
        />
      )}
    </main>
  )
}

export default App
