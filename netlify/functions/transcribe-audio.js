import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const voiceBucketName = 'yaplog_voice_temp'
const signedUrlExpiresInSeconds = 120
const groqModel = 'whisper-large-v3'

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
  const groqApiKey = env.GROQ_API_KEY

  if (!supabaseUrl || !serviceRoleKey || !groqApiKey) {
    return jsonResponse(500, {
      error: 'Voice transcription is not configured.',
    })
  }

  const accessToken = getBearerToken(event.headers)

  if (!accessToken) {
    return jsonResponse(401, { error: 'Sign in to transcribe audio.' })
  }

  let requestBody

  try {
    requestBody = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' })
  }

  const path = normalizeStoragePath(requestBody.path)
  const audioName =
    typeof requestBody.name === 'string' && requestBody.name.trim()
      ? requestBody.name.trim()
      : 'voice-input.webm'

  if (!path) {
    return jsonResponse(400, { error: 'Audio storage path is required.' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  let shouldCleanup = false

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken)

    if (userError || !userData.user) {
      return jsonResponse(401, { error: 'Sign in to transcribe audio.' })
    }

    if (!path.startsWith(`${userData.user.id}/`)) {
      return jsonResponse(403, {
        error: 'You can only transcribe your own audio.',
      })
    }

    shouldCleanup = true

    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(voiceBucketName)
        .createSignedUrl(path, signedUrlExpiresInSeconds)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw signedUrlError || new Error('Could not create audio access URL.')
    }

    const groq = new Groq({ apiKey: groqApiKey })
    const transcription = await groq.audio.transcriptions.create({
      model: groqModel,
      response_format: 'verbose_json',
      temperature: 0,
      url: signedUrlData.signedUrl,
    })

    return jsonResponse(200, {
      duration: transcription.duration,
      language: transcription.language,
      name: audioName,
      text: transcription.text || '',
    })
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || 'Voice transcription failed.',
    })
  } finally {
    if (shouldCleanup) {
      await supabase.storage.from(voiceBucketName).remove([path]).catch(() => {})
    }
  }
}

function getBearerToken(headers) {
  const authorization =
    headers.authorization || headers.Authorization || headers.AUTHORIZATION || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  return match?.[1] || ''
}

function normalizeStoragePath(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const path = value.trim().replace(/^\/+/, '')

  if (!path || path.includes('..') || path.includes('\\')) {
    return ''
  }

  return path
}

function getEnv() {
  const env = { ...(globalThis.process?.env || {}) }

  if (
    env.GROQ_API_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    (env.VITE_SUPABASE_URL || env.SUPABASE_URL)
  ) {
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
