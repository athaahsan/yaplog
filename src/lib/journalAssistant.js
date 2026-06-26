export const TITLE_ASSISTANT_MIN_CHARS = 150
export const CONTENT_ASSISTANT_MIN_CHARS = 250
export const AI_ASSISTANT_MAX_CHARS = 12000
const assistantEndpoints = [
  '/api/journal-assistant',
  '/.netlify/functions/journal-assistant',
]

export async function requestJournalAssistant({ action, content, signal }) {
  let lastError = null

  for (const endpoint of assistantEndpoints) {
    try {
      return await requestJournalAssistantEndpoint({
        action,
        content,
        endpoint,
        signal,
      })
    } catch (error) {
      lastError = error

      if (error.status !== 404 || endpoint === assistantEndpoints.at(-1)) {
        throw error
      }
    }
  }

  throw lastError || new Error('AI assistant request failed.')
}

async function requestJournalAssistantEndpoint({
  action,
  content,
  endpoint,
  signal,
}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, content }),
    signal,
  })

  let payload = null
  let responseText = ''

  try {
    responseText = await response.text()
    payload = responseText ? JSON.parse(responseText) : null
  } catch {
    // Keep the user-facing error clear even if the server returns non-JSON.
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error || `AI assistant request failed (${response.status}).`,
    )
    error.status = response.status
    throw error
  }

  return payload
}
