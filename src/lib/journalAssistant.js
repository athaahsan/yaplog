export const TITLE_ASSISTANT_MIN_CHARS = 150
export const CONTENT_ASSISTANT_MIN_CHARS = 250
export const AI_ASSISTANT_MAX_CHARS = 12000

export async function requestJournalAssistant({ action, content, signal }) {
  const response = await fetch('/api/journal-assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, content }),
    signal,
  })

  let payload = null

  try {
    payload = await response.json()
  } catch {
    // Keep the user-facing error clear even if the server returns non-JSON.
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'AI assistant request failed.')
  }

  return payload
}
