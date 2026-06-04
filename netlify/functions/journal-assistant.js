const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'google/gemini-3-flash-preview'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODEL = 'gemini-3-flash-preview'
const PROVIDER_TIMEOUT_MS = 25000

const prompts = {
  title: {
    maxCompletionTokens: 40,
    geminiMaxOutputTokens: 256,
    system:
      'You are YapLog, a private journaling assistant. Generate short, natural journal titles only from the provided entry. Do not invent facts. Match the entry language.',
    user: (content) => `Create one title for this journal entry.

Rules:
- Return JSON only: {"title":"..."}
- Use 2 to 5 words.
- Keep it under 32 characters when possible.
- Prefer a punchy journal title over a descriptive summary.
- Avoid compound titles that try to cover every topic.
- No emoji.
- No quotes around the title text beyond valid JSON.
- Do not add facts, names, places, or emotions that are not in the entry.
- Match the language of the entry.

Entry:
${content}`,
  },
  content: {
    maxCompletionTokens: 2400,
    geminiMaxOutputTokens: 4096,
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
  const geminiApiKey =
    env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || env.GOOGLE_API_KEY

  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, null)
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' })
  }

  if (!geminiApiKey && !env.OPENROUTER_API_KEY) {
    return jsonResponse(500, {
      error: 'No AI assistant provider is configured.',
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

  const prompt = prompts[action]

  if (action === 'content' && geminiApiKey) {
    try {
      console.log(`[journal-assistant] Trying Gemini direct for ${action}.`)

      const value = await callGeminiDirect({
        action,
        apiKey: geminiApiKey,
        content,
        model: env.GEMINI_MODEL || GEMINI_MODEL,
        prompt,
      })

      console.log(`[journal-assistant] Gemini direct succeeded for ${action}.`)

      return jsonResponse(200, { [action]: value })
    } catch (error) {
      console.warn(
        `[journal-assistant] Gemini direct failed for ${action}; falling back to OpenRouter.`,
        {
          details: error.details,
          message: error.message,
          statusCode: error.statusCode,
        },
      )

      if (!env.OPENROUTER_API_KEY) {
        return jsonResponse(error.statusCode || 502, {
          error: error.message || 'Gemini request failed.',
        })
      }
    }
  } else if (action === 'content') {
    console.log(
      `[journal-assistant] Gemini direct skipped for ${action}; no Gemini API key configured.`,
    )
  } else {
    console.log(
      `[journal-assistant] Gemini direct skipped for ${action}; title generation uses OpenRouter.`,
    )
  }

  try {
    console.log(`[journal-assistant] Trying OpenRouter for ${action}.`)

    const value = await callOpenRouter({
      action,
      apiKey: env.OPENROUTER_API_KEY,
      content,
      prompt,
      siteUrl: env.URL || 'http://localhost:8888',
    })

    console.log(`[journal-assistant] OpenRouter succeeded for ${action}.`)

    return jsonResponse(200, { [action]: value })
  } catch (error) {
    console.error(`[journal-assistant] OpenRouter failed for ${action}.`, {
      message: error.message,
      statusCode: error.statusCode,
    })

    return jsonResponse(error.statusCode || 500, {
      error: error.message || 'AI assistant request failed.',
    })
  }
}

async function callGeminiDirect({ action, apiKey, content, model, prompt }) {
  const encodedModel = encodeURIComponent(model)
  const encodedApiKey = encodeURIComponent(apiKey)
  const url = `${GEMINI_API_URL}/${encodedModel}:generateContent?key=${encodedApiKey}`
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: prompt.system }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt.user(content) }],
        },
      ],
      generationConfig: {
        maxOutputTokens:
          prompt.geminiMaxOutputTokens || prompt.maxCompletionTokens,
        responseMimeType: 'application/json',
        responseSchema: getGeminiResponseSchema(action),
        temperature: prompt.temperature ?? 0.2,
        thinkingConfig: {
          thinkingLevel: 'minimal',
        },
      },
    }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    throwProviderError(
      response.status,
      getGeminiError(responseText) || 'Gemini request failed.',
    )
  }

  const geminiPayload = JSON.parse(responseText)
  const candidate = geminiPayload.candidates?.[0]
  const assistantContent =
    candidate?.content?.parts
      ?.map((part) => part.text || '')
      .join('') || ''
  const assistantJson = parseAssistantJson(assistantContent, {
    meta: {
      contentLength: assistantContent.length,
      finishReason: candidate?.finishReason,
    },
    provider: 'Gemini',
    statusCode: 502,
  })
  const value = assistantJson[action]?.trim()

  if (!value) {
    throwProviderError(502, 'AI response did not include the expected field.')
  }

  return value
}

function getGeminiResponseSchema(action) {
  return {
    type: 'OBJECT',
    properties: {
      [action]: {
        type: 'STRING',
      },
    },
    required: [action],
    propertyOrdering: [action],
  }
}

async function callOpenRouter({ action, apiKey, content, prompt, siteUrl }) {
  const response = await fetchWithTimeout(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-OpenRouter-Title': 'YapLog',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user(content) },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: prompt.maxCompletionTokens,
      reasoning: {
        effort: 'none',
        exclude: true,
      },
      temperature: prompt.temperature,
    }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    throwProviderError(
      response.status,
      getOpenRouterError(responseText) || 'OpenRouter request failed.',
    )
  }

  const openRouterPayload = JSON.parse(responseText)
  const assistantContent =
    openRouterPayload.choices?.[0]?.message?.content || ''
  const assistantJson = parseAssistantJson(assistantContent, {
    provider: 'OpenRouter',
    statusCode: 502,
  })
  const value = assistantJson[action]?.trim()

  if (!value) {
    throwProviderError(502, 'AI response did not include the expected field.')
  }

  return value
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throwProviderError(504, 'AI provider request timed out.')
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function throwProviderError(statusCode, message, details = {}) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  throw error
}

function parseAssistantJson(content, { meta = {}, provider, statusCode } = {}) {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    throwProviderError(
      statusCode || 502,
      `${provider || 'AI provider'} returned malformed JSON: ${error.message}`,
      {
        ...meta,
        contentPreview: cleaned.slice(0, 180),
      },
    )
  }
}

function getOpenRouterError(responseText) {
  try {
    const payload = JSON.parse(responseText)
    return payload.error?.message || payload.message
  } catch {
    return ''
  }
}

function getGeminiError(responseText) {
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
