export const TITLE_WORD_THRESHOLD = 30
export const CONTENT_ASSISTANT_WORD_THRESHOLD = 50

export function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

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
