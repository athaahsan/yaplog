import {
  AlignLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AI_ASSISTANT_MAX_CHARS,
  CONTENT_ASSISTANT_MIN_CHARS,
  requestJournalAssistant,
} from '@/lib/journalAssistant'

const assistantDividerClassName =
  'h-[0.5px] flex-1 bg-muted-foreground/25'
const assistantToggleButtonClassName =
  'grid size-8 place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45'
const assistantToggleActiveClassName =
  'bg-muted text-foreground shadow-sm'

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

function DiffPreview({ parts }) {
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

function JournalContentAssistant({
  body,
  children,
  onApplyContent,
  onResultActiveChange = () => {},
}) {
  const [status, setStatus] = useState('idle')
  const [diffParts, setDiffParts] = useState([])
  const [suggestedContent, setSuggestedContent] = useState('')
  const [suggestionBody, setSuggestionBody] = useState('')
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('original')
  const requestControllerRef = useRef(null)
  const bodyCharCount = body.trim().length
  const canAssist =
    bodyCharCount >= CONTENT_ASSISTANT_MIN_CHARS &&
    bodyCharCount <= AI_ASSISTANT_MAX_CHARS
  const suggestionMatchesBody = !suggestionBody || suggestionBody === body
  const assistantStatus = suggestionMatchesBody ? status : 'idle'
  const compareOpen =
    canAssist && viewMode === 'compare' && assistantStatus !== 'idle'

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
    onResultActiveChange(false)
    setViewMode('original')
    setStatus('idle')
    setDiffParts([])
    setSuggestedContent('')
    setSuggestionBody('')
    setError('')
  }

  function closeCompare() {
    setViewMode('original')
  }

  function openCompare() {
    if (assistantStatus === 'success') {
      setViewMode('compare')
      return
    }

    generateSuggestion()
  }

  async function generateSuggestion() {
    requestControllerRef.current?.abort()

    const controller = new AbortController()
    requestControllerRef.current = controller
    onResultActiveChange(false)
    setViewMode('compare')
    setStatus('loading')
    setDiffParts([])
    setSuggestedContent('')
    setSuggestionBody(body)
    setError('')

    try {
      const result = await requestJournalAssistant({
        action: 'content',
        content: body,
        signal: controller.signal,
      })

      const nextSuggestedContent = result.content || ''
      const nextDiffParts = buildDiffParts(body, nextSuggestedContent)

      setDiffParts(nextDiffParts)
      setSuggestedContent(nextSuggestedContent)
      setStatus('success')
      onResultActiveChange(true)
    } catch (requestError) {
      if (requestError.name === 'AbortError') {
        return
      }

      setError(requestError.message || 'Could not polish this entry.')
      setStatus('error')
      onResultActiveChange(false)
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
    <section className="flex-none text-foreground" aria-label="Content assistant">
      <div className="mb-4 flex h-8 items-center gap-2">
        {canAssist ? (
          <>
            <div className={assistantDividerClassName} aria-hidden="true" />
            <div
              className="flex overflow-hidden rounded-lg border border-border bg-background/35 animate-in fade-in-0 zoom-in-95 duration-200"
              role="group"
              aria-label="Content view"
            >
              <button
                className={`${assistantToggleButtonClassName} ${
                  !compareOpen ? assistantToggleActiveClassName : ''
                }`}
                type="button"
                aria-label="Show original entry"
                aria-pressed={!compareOpen}
                title="Show original entry"
                onClick={closeCompare}
              >
                <AlignLeft className="size-3.5" />
              </button>
              <button
                className={`${assistantToggleButtonClassName} border-l border-border ${
                  compareOpen ? assistantToggleActiveClassName : ''
                }`}
                type="button"
                aria-label="Show AI polish"
                aria-pressed={compareOpen}
                title="Show AI polish"
                onClick={openCompare}
              >
                <Sparkles className="size-3.5" />
              </button>
            </div>
            <div className={assistantDividerClassName} aria-hidden="true" />
          </>
        ) : (
          <div className={assistantDividerClassName} aria-hidden="true" />
        )}
      </div>

      {!compareOpen ? (
        children
      ) : (
        <div className="animate-in fade-in-0 slide-in-from-right-1 duration-200">
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
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={generateSuggestion}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {assistantStatus === 'success' && (
              <div className="min-w-0 max-w-full whitespace-pre-wrap break-words bg-muted/50 py-1 text-[17px] leading-[1.65] [overflow-wrap:anywhere] animate-in fade-in-0 slide-in-from-right-1 duration-200 max-md:text-base">
                <DiffPreview parts={diffParts} />
              </div>
            )}
          </div>

          {assistantStatus === 'success' && (
            <footer className="flex items-center justify-end gap-2 pb-3">
              <div className="flex flex-none items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={resetSuggestion}
                >
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
