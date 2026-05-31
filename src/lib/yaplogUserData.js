import { normalizeMasterData } from './masterData'
import { supabase } from './supabaseClient'

const tableName = 'yaplog_user_data'
const avatarBucketName = 'yaplog_avatars'

export function getUserProfile(user) {
  const metadata = user?.user_metadata || {}

  return {
    userName:
      metadata.full_name ||
      metadata.name ||
      metadata.user_name ||
      user?.email?.split('@')[0] ||
      null,
    userEmail: user?.email || metadata.email || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
  }
}

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    throw error
  }
}

export async function signInWithPassword({ email, password }) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message?.toLowerCase().includes('invalid login credentials')) {
      throw new Error("Couldn't sign in with that email and password.")
    }

    throw error
  }

  return data
}

export async function signUpWithPassword({ email, password }) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  await assertEmailIsAvailable(email)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) {
    throw error
  }

  return data
}

async function assertEmailIsAvailable(email) {
  const response = await fetch('/api/auth-email-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Email availability check failed.')
  }

  if (payload.exists) {
    throw new Error('This email is already in use.')
  }
}

export async function sendPasswordReset(email) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })

  if (error) {
    throw error
  }

  return data
}

export async function updatePassword(password) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw error
  }

  return data
}

export async function uploadUserAvatar(user, avatarBlob) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (!user?.id) {
    throw new Error('You need to be signed in to upload an avatar.')
  }

  const avatarPath = `${user.id}/avatar.webp`
  const { error } = await supabase.storage
    .from(avatarBucketName)
    .upload(avatarPath, avatarBlob, {
      cacheControl: '3600',
      contentType: 'image/webp',
      upsert: true,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from(avatarBucketName)
    .getPublicUrl(avatarPath)

  return `${data.publicUrl}?v=${Date.now()}`
}

export async function signOut() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getCurrentSession() {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    return () => {}
  }

  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}

export async function fetchUserData(userId) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('user_id, master_data, updated_at, user_name, user_email, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function upsertUserData(user, masterData, profileOverride = null) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const profile = {
    ...getUserProfile(user),
    ...(profileOverride || {}),
  }
  const nextMasterData = normalizeMasterData(masterData)
  const payload = {
    user_id: user.id,
    master_data: nextMasterData,
    updated_at: nextMasterData.updatedAt,
    user_name: profile.userName,
    user_email: profile.userEmail,
    avatar_url: profile.avatarUrl,
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from(tableName)
    .update(payload)
    .eq('user_id', user.id)
    .select('user_id')
    .maybeSingle()

  if (updateError) {
    throw updateError
  }

  if (updatedRow) {
    return nextMasterData
  }

  const { error } = await supabase.from(tableName).insert(payload)

  if (error) {
    throw error
  }

  return nextMasterData
}
