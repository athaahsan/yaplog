import { normalizeMasterData } from './masterData'
import { supabase } from './supabaseClient'

const tableName = 'yaplog_user_data'

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
    },
  })

  if (error) {
    throw error
  }
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

export async function upsertUserData(user, masterData) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const profile = getUserProfile(user)
  const nextMasterData = normalizeMasterData(masterData)

  const { error } = await supabase.from(tableName).upsert({
    user_id: user.id,
    master_data: nextMasterData,
    updated_at: nextMasterData.updatedAt,
    user_name: profile.userName,
    user_email: profile.userEmail,
    avatar_url: profile.avatarUrl,
  })

  if (error) {
    throw error
  }

  return nextMasterData
}
