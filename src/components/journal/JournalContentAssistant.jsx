import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AI_ASSISTANT_MAX_CHARS,
  CONTENT_ASSISTANT_MIN_CHARS,
  requestJournalAssistant,
} from '@/lib/journalAssistant'

const assistantDividerClassName =
  'h-[0.5px] flex-1 bg-muted-foreground/25'
const assistantDividerButtonClassName =
  'h-8 rounded-lg px-2 text-muted-foreground hover:text-foreground'

function tokenizeDiffText(value) {
  return value.match(/\s+|[^\s]+/g) || []
}

function normalizeDiffToken(value) {
  return value
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
}

function buildDiffParts(original, suggested) {
  const originalTokens = tokenizeDiffText(original)
  const suggestedTokens = tokenizeDiffText(suggested)
  const rowLength = suggestedTokens.length + 1
  const directions = new Uint8Array((originalTokens.length + 1) * rowLength)
  let previousRow = new Uint16Array(rowLength)
  let currentRow = new Uint16Array(rowLength)

  for (let originalIndex = 1; originalIndex <= originalTokens.length; originalIndex += 1) {
    for (let suggestedIndex = 1; suggestedIndex <= suggestedTokens.length; suggestedIndex += 1) {
      const cellIndex = originalIndex * rowLength + suggestedIndex

      if (
        normalizeDiffToken(originalTokens[originalIndex - 1]) ===
        normalizeDiffToken(suggestedTokens[suggestedIndex - 1])
      ) {
        currentRow[suggestedIndex] = previousRow[suggestedIndex - 1] + 1
        directions[cellIndex] = 1
      } else if (previousRow[suggestedIndex] >= currentRow[suggestedIndex - 1]) {
        currentRow[suggestedIndex] = previousRow[suggestedIndex]
        directions[cellIndex] = 2
      } else {
        currentRow[suggestedIndex] = currentRow[suggestedIndex - 1]
        directions[cellIndex] = 3
      }
    }

    const completedRow = previousRow
    previousRow = currentRow
    currentRow = completedRow
    currentRow.fill(0)
  }

  const parts = []
  let originalIndex = originalTokens.length
  let suggestedIndex = suggestedTokens.length

  function addPart(type, value) {
    if (!value) {
      return
    }

    const previousPart = parts[parts.length - 1]

    if (previousPart?.type === type) {
      previousPart.value = `${value}${previousPart.value}`
      return
    }

    parts.push({ type, value })
  }

  while (originalIndex > 0 || suggestedIndex > 0) {
    const cellIndex = originalIndex * rowLength + suggestedIndex
    const direction = directions[cellIndex]

    if (
      originalIndex > 0 &&
      suggestedIndex > 0 &&
      direction === 1
    ) {
      addPart('same', suggestedTokens[suggestedIndex - 1])
      originalIndex -= 1
      suggestedIndex -= 1
    } else if (suggestedIndex > 0 && (originalIndex === 0 || direction === 3)) {
      addPart('added', suggestedTokens[suggestedIndex - 1])
      suggestedIndex -= 1
    } else if (originalIndex > 0) {
      addPart('removed', originalTokens[originalIndex - 1])
      originalIndex -= 1
    }
  }

  return parts.reverse()
}

function DiffPreview({ original, suggested }) {
  const parts = buildDiffParts(original, suggested)

  return parts.map((part, index) => {
    const whitespaceOnly = !part.value.trim()
    const displayValue = whitespaceOnly
      ? part.value.replace(/(\r?\n)[\t ]*(\r?\n)+/g, '$1')
      : part.value

    if (whitespaceOnly) {
      return <span key={`${part.type}-${index}`}>{displayValue}</span>
    }

    if (part.type === 'added') {
      return (
        <ins
          className="rounded-[4px] bg-emerald-500/16 px-0.5 text-foreground no-underline ring-1 ring-inset ring-emerald-500/18"
          key={`${part.type}-${index}`}
        >
          {part.value}
        </ins>
      )
    }

    if (part.type === 'removed') {
      return (
        <del
          className="rounded-[4px] bg-red-500/14 px-0.5 text-muted-foreground decoration-red-500/70 ring-1 ring-inset ring-red-500/16"
          key={`${part.type}-${index}`}
        >
          {part.value}
        </del>
      )
    }

    return <span key={`${part.type}-${index}`}>{part.value}</span>
  })
}

function JournalContentAssistant({ body, onApplyContent }) {
  const [status, setStatus] = useState('idle')
  const [suggestedContent, setSuggestedContent] = useState('')
  const [suggestionBody, setSuggestionBody] = useState('')
  const [error, setError] = useState('')
  const requestControllerRef = useRef(null)
  const bodyCharCount = body.trim().length
  const canAssist =
    bodyCharCount >= CONTENT_ASSISTANT_MIN_CHARS &&
    bodyCharCount <= AI_ASSISTANT_MAX_CHARS
  const suggestionMatchesBody = !suggestionBody || suggestionBody === body
  const assistantStatus = suggestionMatchesBody ? status : 'idle'
  const panelOpen = canAssist && assistantStatus !== 'idle'

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (suggestionMatchesBody) {
      return
    }

    requestControllerRef.current?.abort()
    requestControllerRef.current = null
  }, [suggestionMatchesBody])

  function resetSuggestion() {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    setStatus('idle')
    setSuggestedContent('')
    setSuggestionBody('')
    setError('')
  }

  async function generateSuggestion() {
    requestControllerRef.current?.abort()

    const controller = new AbortController()
    requestControllerRef.current = controller
    setStatus('loading')
    setSuggestedContent('')
    setSuggestionBody(body)
    setError('')

    try {
      const result = await requestJournalAssistant({
        action: 'content',
        content: body,
        signal: controller.signal,
      })

      setSuggestedContent(result.content || '')
      setStatus('success')
    } catch (requestError) {
      if (requestError.name === 'AbortError') {
        return
      }

      setError(requestError.message || 'Could not polish this entry.')
      setStatus('error')
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
    }
  }

  function replaceContent() {
    if (suggestedContent.trim()) {
      onApplyContent(suggestedContent)
    }

    resetSuggestion()
  }

  return (
    <section
      className="my-2 flex-none overflow-hidden text-foreground animate-in fade-in-0 slide-in-from-top-1"
      aria-label="Content assistant"
    >
      {!panelOpen ? (
        <div className="flex h-8 items-center gap-2">
          {canAssist ? (
            <>
              <div className={assistantDividerClassName} aria-hidden="true" />
              <Button
                className={`${assistantDividerButtonClassName} animate-in fade-in-0 zoom-in-95`}
                variant="ghost"
                size="sm"
                type="button"
                aria-label="Polish entry"
                title="Polish entry"
                onClick={generateSuggestion}
              >
                <Sparkles className="size-3.5" />
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
              <div className={assistantDividerClassName} aria-hidden="true" />
            </>
          ) : (
            <div className="h-px flex-1 bg-transparent" aria-hidden="true" />
          )}
        </div>
      ) : (
        <div className="border-b border-muted-foreground/25 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex h-8 items-center gap-2">
            <div className={assistantDividerClassName} aria-hidden="true" />
            <Button
              className={assistantDividerButtonClassName}
              variant="ghost"
              size="sm"
              type="button"
              aria-label="Collapse content suggestion"
              title="Collapse suggestion"
              onClick={resetSuggestion}
            >
              <Sparkles className="size-3.5" />
              <ChevronUp className="size-3.5 opacity-70" />
            </Button>
            <div className={assistantDividerClassName} aria-hidden="true" />
          </div>

          <div className="min-w-0 overflow-hidden pb-3">
            {assistantStatus === 'loading' && (
              <div className="grid min-h-28 place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Polishing your entry...</span>
                </div>
              </div>
            )}

            {assistantStatus === 'error' && (
              <div className="grid min-h-28 content-center gap-3 text-sm">
                <p className="text-foreground">Could not polish this entry.</p>
                <p className="text-muted-foreground">{error}</p>
                <div>
                  <Button variant="secondary" size="sm" type="button" onClick={generateSuggestion}>
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {assistantStatus === 'success' && (
              <div className="min-w-0 max-w-full whitespace-pre-wrap break-words bg-muted/50 py-1 text-[17px] leading-[1.65] [overflow-wrap:anywhere]">
                <DiffPreview
                  original={suggestionBody}
                  suggested={suggestedContent}
                />
              </div>
            )}
          </div>

          {assistantStatus === 'success' && (
            <footer className="flex items-center justify-end gap-2 pb-3">
              <div className="flex flex-none items-center gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={resetSuggestion}>
                  Reject
                </Button>
                <Button
                  size="sm"
                  type="button"
                  disabled={!suggestedContent.trim()}
                  onClick={replaceContent}
                >
                  Replace
                </Button>
              </div>
            </footer>
          )}
        </div>
      )}
    </section>
  )
}

export default JournalContentAssistant
