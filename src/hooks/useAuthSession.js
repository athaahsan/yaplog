import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createDefaultMasterData,
  loadMasterData,
  normalizeMasterData,
  touchMasterData,
} from '@/lib/masterData'
import { hasSupabaseConfig } from '@/lib/supabaseClient'
import {
  fetchUserData,
  getCurrentSession,
  getUserProfile,
  onAuthStateChange,
  deleteCurrentAccount,
  sendPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
  uploadUserAvatar,
  upsertUserData,
} from '@/lib/yaplogUserData'

export function useAuthSession({
  masterData,
  onPasswordRecovery,
  setMasterData,
}) {
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => hasSupabaseConfig())
  const [cloudReady, setCloudReady] = useState(false)
  const [authError, setAuthError] = useState('')
  const [savedAuthProfile, setSavedAuthProfile] = useState(null)
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
        const nextCloudData = touchMasterData(createDefaultMasterData())
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
  }, [setMasterData])

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
        onPasswordRecovery()

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
  }, [onPasswordRecovery, prepareSignedInUser, setMasterData])

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

  async function saveProfile(profile) {
    if (!authUser) {
      return
    }

    setAuthError('')

    try {
      const avatarUrl = profile.avatarBlob
        ? await uploadUserAvatar(authUser, profile.avatarBlob)
        : profile.avatarUrl
      const nextProfile = {
        userName: profile.userName,
        userEmail: profile.userEmail,
        avatarUrl,
      }

      setSavedAuthProfile(nextProfile)
      await upsertUserData(authUser, masterData, nextProfile)
    } catch (error) {
      setAuthError(error.message || 'Could not save your profile.')
      throw error
    }
  }

  async function deleteAccount(confirmEmail) {
    if (!authUser) {
      return
    }

    setAuthError('')

    try {
      await deleteCurrentAccount(confirmEmail)
      setAuthUser(null)
      setSavedAuthProfile(null)
      setCloudReady(false)
      setMasterData(loadMasterData())
    } catch (error) {
      setAuthError(error.message || 'Could not delete your account.')
      throw error
    }
  }

  return {
    authError,
    authLoading,
    authProfile,
    authUser,
    cloudReady,
    deleteAccount,
    resetPassword,
    saveProfile,
    setAuthError,
    setNewPassword,
    signIn,
    signInWithEmail,
    signOutUser,
    signUpWithEmail,
  }
}
