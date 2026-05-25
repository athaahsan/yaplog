import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CONTENT_ASSISTANT_WORD_THRESHOLD,
  countWords,
  requestJournalAssistant,
} from '@/lib/journalAssistant'

function JournalContentAssistant({ body, onApplyContent }) {
  const [status, setStatus] = useState('idle')
  const [suggestedContent, setSuggestedContent] = useState('')
  const [suggestionBody, setSuggestionBody] = useState('')
  const [error, setError] = useState('')
  const requestControllerRef = useRef(null)
  const wordCount = countWords(body)
  const canAssist = wordCount >= CONTENT_ASSISTANT_WORD_THRESHOLD
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
        <div className="flex min-h-8 items-center gap-2">
          {!canAssist ? (
            <div className="h-px flex-1 bg-muted-foreground/25" aria-hidden="true" />
          ) : (
            <>
              <div className="h-px flex-1 bg-muted-foreground/25" aria-hidden="true" />
            <Button
              className="h-8 rounded-lg px-2 text-muted-foreground animate-in fade-in-0 zoom-in-95 hover:text-foreground"
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
              <div className="h-px flex-1 bg-muted-foreground/25" aria-hidden="true" />
            </>
          )}
        </div>
      ) : (
        <div className="border-b border-muted-foreground/25 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex min-h-8 items-center gap-2">
            <div className="h-px flex-1 bg-muted-foreground/25" aria-hidden="true" />
            <Button
              className="h-8 rounded-lg px-2 text-muted-foreground hover:text-foreground"
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
            <div className="h-px flex-1 bg-muted-foreground/25" aria-hidden="true" />
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
              <div className="-mx-2 min-w-0 max-w-full whitespace-pre-wrap break-words rounded-md bg-muted/15 px-2 py-1 text-[17px] leading-[1.65] [overflow-wrap:anywhere]">
                {suggestedContent}
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
