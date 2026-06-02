import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Loader2, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AI_ASSISTANT_MAX_CHARS,
  TITLE_ASSISTANT_MIN_CHARS,
  requestJournalAssistant,
} from '@/lib/journalAssistant'
import { cn } from '@/lib/utils'

function JournalTitleField({ body, title, onChange }) {
  const latestTitleRef = useRef(title)
  const requestIdRef = useRef(0)
  const titleInputRef = useRef(null)
  const updateTitleRef = useRef(onChange)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const bodyCharCount = body.trim().length
  const canSuggestTitle =
    !title.trim() &&
    bodyCharCount >= TITLE_ASSISTANT_MIN_CHARS &&
    bodyCharCount <= AI_ASSISTANT_MAX_CHARS

  function resizeTitleInput() {
    const titleInput = titleInputRef.current

    if (!titleInput) {
      return
    }

    titleInput.style.height = 'auto'
    titleInput.style.height = `${titleInput.scrollHeight}px`
  }

  useEffect(() => {
    latestTitleRef.current = title
  }, [title])

  useLayoutEffect(() => {
    resizeTitleInput()
  }, [title])

  useEffect(() => {
    const titleInput = titleInputRef.current

    if (!titleInput || typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(resizeTitleInput)
    })

    resizeObserver.observe(titleInput)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    updateTitleRef.current = onChange
  }, [onChange])

  async function suggestTitle() {
    const trimmedBody = body.trim()

    if (!canSuggestTitle || status === 'loading') {
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus('loading')
    setError('')

    try {
      const result = await requestJournalAssistant({
        action: 'title',
        content: trimmedBody,
      })

      const nextTitle = result.title?.trim()
      const titleStillEmpty = !latestTitleRef.current.trim()
      const requestStillCurrent = requestIdRef.current === requestId

      if (nextTitle && titleStillEmpty && requestStillCurrent) {
        updateTitleRef.current(nextTitle)
        setStatus('idle')
      } else if (requestStillCurrent) {
        setStatus('idle')
      }
    } catch (requestError) {
      if (requestIdRef.current === requestId) {
        setStatus('error')
        setError(requestError.message || 'Could not suggest a title.')
      }
    }
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex min-w-0 items-center">
        <div
          className={cn(
            'flex flex-none items-center overflow-hidden transition-[width,margin-right,opacity,transform] duration-200 ease-out',
            canSuggestTitle
              ? 'mr-1.5 w-8 translate-x-0 opacity-100'
              : 'mr-0 w-0 -translate-x-1 opacity-0',
          )}
          aria-hidden={!canSuggestTitle}
        >
          <Button
            className={cn(
              'size-8 rounded-lg text-muted-foreground hover:text-foreground',
              status === 'error' && 'text-destructive hover:text-destructive',
            )}
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label={
              status === 'error' ? 'Try suggesting a title again' : 'Suggest title'
            }
            disabled={!canSuggestTitle || status === 'loading'}
            tabIndex={canSuggestTitle ? 0 : -1}
            onClick={suggestTitle}
            title={status === 'error' ? 'Try again' : 'Suggest title'}
          >
            {status === 'loading' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <WandSparkles className="size-3.5" />
            )}
          </Button>
        </div>

        <textarea
          ref={titleInputRef}
          className={cn(
            'min-h-[1.2em] min-w-0 resize-none overflow-hidden bg-transparent py-0 text-[40px] font-bold leading-[1.2] tracking-normal text-foreground outline-none transition-[width] duration-200 ease-out placeholder:text-muted-foreground max-md:text-[30px] max-md:leading-[1.2]',
            'w-full',
          )}
          rows={1}
          value={title}
          placeholder="Untitled entry"
          onChange={(event) => {
            setError('')
            setStatus('idle')
            onChange(event.target.value)
          }}
        />
      </div>

      {error && canSuggestTitle && (
        <span className="text-xs text-muted-foreground">{error}</span>
      )}
    </div>
  )
}

export default JournalTitleField
