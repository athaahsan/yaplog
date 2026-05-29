import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const tableName = 'yaplog_user_data'

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
      error: 'Email availability check is not configured.',
    })
  }

  let requestBody

  try {
    requestBody = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' })
  }

  const email =
    typeof requestBody.email === 'string'
      ? requestBody.email.trim().toLowerCase()
      : ''

  if (!email) {
    return jsonResponse(400, { error: 'Email is required.' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('user_id')
      .ilike('user_email', email)
      .limit(1)

    if (error) {
      throw error
    }

    return jsonResponse(200, { exists: Boolean(data?.length) })
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || 'Email availability check failed.',
    })
  }
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
