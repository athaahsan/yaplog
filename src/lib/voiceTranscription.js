import { supabase } from './supabaseClient'

const voiceBucketName = 'yaplog_voice_temp'
const audioFileMaxBytes = 19.5 * 1024 * 1024

export async function transcribeVoiceAudio({ audioBlob, audioName, userId }) {
  if (!supabase) {
    throw new Error('Voice transcription is not configured.')
  }

  if (!userId) {
    throw new Error('Sign in to use voice transcription.')
  }

  if (!audioBlob) {
    throw new Error('Choose or record audio first.')
  }

  if (audioBlob.size > audioFileMaxBytes) {
    throw new Error('Please choose an audio file under 19.5 MB.')
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Sign in again to use voice transcription.')
  }

  const storagePath = `${userId}/${crypto.randomUUID()}.${getAudioExtension(
    audioBlob,
    audioName,
  )}`
  let uploaded = false

  try {
    const { error: uploadError } = await supabase.storage
      .from(voiceBucketName)
      .upload(storagePath, audioBlob, {
        contentType: audioBlob.type || 'audio/webm',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    uploaded = true

    const response = await fetch('/api/transcribe-audio', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: audioBlob.type || 'audio/webm',
        name: audioName || 'voice-input',
        path: storagePath,
      }),
    })

    let payload = null

    try {
      payload = await response.json()
    } catch {
      // Keep the thrown error readable if the function returns non-JSON.
    }

    if (!response.ok) {
      throw new Error(payload?.error || 'Voice transcription failed.')
    }

    const transcript = payload?.text?.trim()

    if (!transcript) {
      throw new Error('Transcription returned empty text.')
    }

    return transcript
  } catch (error) {
    if (uploaded) {
      await supabase.storage.from(voiceBucketName).remove([storagePath])
    }

    throw error
  }
}

function getAudioExtension(audioBlob, audioName) {
  const nameExtension = audioName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()

  if (nameExtension) {
    return sanitizeExtension(nameExtension)
  }

  const mimeExtension = audioBlob.type
    ?.split(';')[0]
    ?.split('/')[1]
    ?.toLowerCase()

  return sanitizeExtension(mimeExtension || 'webm')
}

function sanitizeExtension(extension) {
  if (/^[a-z0-9]{2,8}$/.test(extension)) {
    return extension
  }

  return 'webm'
}
