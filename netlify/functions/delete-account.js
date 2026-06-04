import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const tableName = 'yaplog_user_data'
const avatarBucketName = 'yaplog_avatars'
const voiceBucketName = 'yaplog_voice_temp'

export async function handler(event) {
  const env = getEnv()

  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, null)
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' })
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, {
      error: 'Account deletion is not configured.',
    })
  }

  const accessToken = getBearerToken(event.headers)

  if (!accessToken) {
    return jsonResponse(401, { error: 'Sign in again before deleting your account.' })
  }

  let requestBody

  try {
    requestBody = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' })
  }

  const confirmEmail =
    typeof requestBody.confirmEmail === 'string'
      ? requestBody.confirmEmail.trim().toLowerCase()
      : ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken)

    if (userError || !userData.user) {
      return jsonResponse(401, {
        error: 'Sign in again before deleting your account.',
      })
    }

    const user = userData.user
    const userEmail = user.email?.trim().toLowerCase() || ''

    if (!userEmail || confirmEmail !== userEmail) {
      return jsonResponse(400, {
        error: 'Type your account email to confirm deletion.',
      })
    }

    await deleteUserDataRow(supabase, user.id)
    await cleanupUserStorage(supabase, user.id)

    const { error: deleteUserError } =
      await supabase.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      throw deleteUserError
    }

    return jsonResponse(200, { deleted: true })
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || 'Could not delete your account.',
    })
  }
}

async function deleteUserDataRow(supabase, userId) {
  const { error } = await supabase.from(tableName).delete().eq('user_id', userId)

  if (error) {
    throw error
  }
}

async function cleanupUserStorage(supabase, userId) {
  await removeStorageObjects(supabase, avatarBucketName, [`${userId}/avatar.webp`])
  await removeStorageFolder(supabase, voiceBucketName, userId)
}

async function removeStorageFolder(supabase, bucketName, folderName) {
  const { data, error } = await supabase.storage.from(bucketName).list(folderName)

  if (error || !data?.length) {
    return
  }

  const paths = data
    .filter((item) => item.name)
    .map((item) => `${folderName}/${item.name}`)

  await removeStorageObjects(supabase, bucketName, paths)
}

async function removeStorageObjects(supabase, bucketName, paths) {
  if (!paths.length) {
    return
  }

  await supabase.storage.from(bucketName).remove(paths).catch(() => {})
}

function getBearerToken(headers) {
  const authorization =
    headers.authorization || headers.Authorization || headers.AUTHORIZATION || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  return match?.[1] || ''
}

function getEnv() {
  const env = { ...(globalThis.process?.env || {}) }

  if (env.SUPABASE_SERVICE_ROLE_KEY && (env.VITE_SUPABASE_URL || env.SUPABASE_URL)) {
    return env
  }

  try {
    const envText = readFileSync(join(globalThis.process.cwd(), '.env'), 'utf8')
    for (const line of envText.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/)

      if (!match || env[match[1]]) {
        continue
      }

      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // Netlify production should use configured environment variables.
  }

  return env
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : '',
  }
}
