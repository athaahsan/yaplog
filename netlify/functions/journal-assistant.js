const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openai/gpt-5.4-mini'

const prompts = {
  title: {
    maxCompletionTokens: 80,
    system:
      'You are YapLog, a private journaling assistant. Generate concise journal titles only from the provided entry. Do not invent facts. Match the entry language.',
    user: (content) => `Create one title for this journal entry.

Rules:
- Return JSON only: {"title":"..."}
- Use 3 to 7 words.
- No emoji.
- No quotes around the title text beyond valid JSON.
- Do not add facts, names, places, or emotions that are not in the entry.
- Match the language of the entry.

Entry:
${content}`,
  },
  content: {
    maxCompletionTokens: 2400,
    system:
      "You are YapLog, a private journaling assistant. You turn messy raw thoughts into polished, readable markdown journal entries while preserving the user's meaning, point of view, tone, flow, language, and emotional texture.",
    user: (content) => `Rewrite this journal entry into a clean, readable markdown version while preserving the writer's original meaning, point of view, tone, language, and flow.

Rules:
- Return JSON only: {"content":"..."}
- Do not summarize.
- Do not add new ideas, events, emotions, advice, lessons, locations, or conclusions.
- Keep it in the writer's point of view.
- Preserve the original language.
- Keep it natural, like a cleaned-up private journal/monologue, not an article.
- Use markdown formatting to improve readability when helpful.
- Prefer paragraph breaks, gentle emphasis, and simple lists when they naturally fit.
- Do not over-format.
- Do not add a title or top-level heading.
- Do not use bullet points if the entry is meant to feel like a flowing monologue.
- Preserve existing markdown when it still fits.
- Fix punctuation, casing, grammar, markdown, and paragraph flow.
- Remove filler words, repeated false starts, and rough artifacts only when they do not change the meaning.
- If the writer rambles, make it readable but still preserve the rambling style.
- If the text is already clear, make only minimal edits.

Entry:
${content}`,
  },
}

export async function handler(event) {
  const env = globalThis.process?.env || {}

  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, null)
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' })
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse(500, {
      error: 'OpenRouter API key is not configured.',
    })
  }

  let requestBody

  try {
    requestBody = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' })
  }

  const action = requestBody.action
  const content =
    typeof requestBody.content === 'string' ? requestBody.content.trim() : ''

  if (!prompts[action]) {
    return jsonResponse(400, { error: 'Unsupported assistant action.' })
  }

  if (!content) {
    return jsonResponse(400, { error: 'Journal content is required.' })
  }

  try {
    const prompt = prompts[action]
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.URL || 'http://localhost:8888',
        'X-OpenRouter-Title': 'YapLog',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user(content) },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: prompt.maxCompletionTokens,
        temperature: prompt.temperature,
      }),
    })

    const responseText = await response.text()

    if (!response.ok) {
      return jsonResponse(response.status, {
        error: getOpenRouterError(responseText) || 'OpenRouter request failed.',
      })
    }

    const openRouterPayload = JSON.parse(responseText)
    const assistantContent =
      openRouterPayload.choices?.[0]?.message?.content || ''
    const assistantJson = parseAssistantJson(assistantContent)
    const value = assistantJson[action]?.trim()

    if (!value) {
      return jsonResponse(502, {
        error: 'AI response did not include the expected field.',
      })
    }

    return jsonResponse(200, { [action]: value })
  } catch (error) {
    return jsonResponse(500, {
      error: error.message || 'AI assistant request failed.',
    })
  }
}

function parseAssistantJson(content) {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')

  return JSON.parse(cleaned)
}

function getOpenRouterError(responseText) {
  try {
    const payload = JSON.parse(responseText)
    return payload.error?.message || payload.message
  } catch {
    return ''
  }
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
