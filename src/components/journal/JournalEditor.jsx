import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Save, Sparkles, Star } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import {
  TITLE_WORD_THRESHOLD,
  countWords,
  requestJournalAssistant,
} from '@/lib/journalAssistant'
import { cn } from '@/lib/utils'
import JournalContentAssistant from './JournalContentAssistant'

const moodNameMap = {
  '😊': 'happy',
  '😐': 'neutral',
  '😔': 'sad',
  '🫩': 'done',
  '😰': 'anxious',
}

const moodToneClassNames = {
  anxious:
    'bg-[color-mix(in_oklch,oklch(0.72_0.14_205)_18%,transparent)] shadow-[0_0_12px_oklch(0.72_0.14_205/15%),inset_0_0_0_1px_oklch(0.72_0.14_205/40%)]',
  done:
    'bg-[color-mix(in_oklch,oklch(0.64_0.11_305)_18%,transparent)] shadow-[0_0_12px_oklch(0.64_0.11_305/15%),inset_0_0_0_1px_oklch(0.64_0.11_305/40%)]',
  happy:
    'bg-[color-mix(in_oklch,oklch(0.82_0.12_125)_16%,transparent)] shadow-[0_0_12px_oklch(0.82_0.12_125/15%),inset_0_0_0_1px_oklch(0.82_0.12_125/40%)]',
  neutral:
    'bg-[color-mix(in_oklch,oklch(0.7_0.02_255)_18%,transparent)] shadow-[0_0_12px_oklch(0.7_0.02_255/12%),inset_0_0_0_1px_oklch(0.7_0.02_255/38%)]',
  sad:
    'bg-[color-mix(in_oklch,oklch(0.68_0.13_265)_18%,transparent)] shadow-[0_0_12px_oklch(0.68_0.13_265/15%),inset_0_0_0_1px_oklch(0.68_0.13_265/40%)]',
}

const markdownPreviewClassName = cn(
  'flex-none cursor-text text-[17px] leading-[1.65] text-foreground outline-none md:text-[17px]',
  '[&_blockquote]:mb-[0.9em] [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-[0.9em] [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded-[5px] [&_code]:bg-muted [&_code]:px-[0.34em] [&_code]:py-[0.12em] [&_code]:text-[0.9em]',
  '[&_h1]:mb-[0.45em] [&_h1]:mt-[1.15em] [&_h1]:text-[1.55em] [&_h1]:leading-[1.2]',
  '[&_h2]:mb-[0.45em] [&_h2]:mt-[1.15em] [&_h2]:text-[1.3em] [&_h2]:leading-[1.2]',
  '[&_h3]:mb-[0.45em] [&_h3]:mt-[1.15em] [&_h3]:text-[1.12em] [&_h3]:leading-[1.2]',
  '[&_ol]:mb-[0.9em] [&_ol]:pl-[1.35em] [&_p]:mb-[0.9em] [&_p]:whitespace-pre-line [&_pre]:mb-[0.9em] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:mb-[0.9em] [&_ul]:mb-[0.9em] [&_ul]:pl-[1.35em]',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
)

function JournalEditor({
  draft,
  hasUnsavedChanges,
  moodOptions,
  onBack,
  onSave,
  onUpdateDraft,
}) {
  const bodyInputRef = useRef(null)
  const editorScrollRef = useRef(null)
  const latestTitleRef = useRef(draft.title)
  const pendingScrollTopRef = useRef(null)
  const titleRequestIdRef = useRef(0)
  const updateDraftRef = useRef(onUpdateDraft)
  const [isBodyEditing, setIsBodyEditing] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [titleStatus, setTitleStatus] = useState('idle')
  const [titleError, setTitleError] = useState('')
  const bodyWordCount = countWords(draft.body)
  const canSuggestTitle =
    !draft.title.trim() && bodyWordCount >= TITLE_WORD_THRESHOLD

  function restoreEditorScroll(scrollTop) {
    const scrollContainer = editorScrollRef.current

    if (!scrollContainer) {
      pendingScrollTopRef.current = null
      return undefined
    }

    scrollContainer.scrollTop = scrollTop

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollTop

      window.requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollTop
        pendingScrollTopRef.current = null
      })
    })

    const timeoutId = window.setTimeout(() => {
      scrollContainer.scrollTop = scrollTop
      pendingScrollTopRef.current = null
    }, 0)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(timeoutId)
    }
  }

  useEffect(() => {
    latestTitleRef.current = draft.title
  }, [draft.title])

  useEffect(() => {
    updateDraftRef.current = onUpdateDraft
  }, [onUpdateDraft])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined
    }

    function handleBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!leaveDialogOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setLeaveDialogOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [leaveDialogOpen])

  useLayoutEffect(() => {
    const bodyInput = bodyInputRef.current
    const scrollContainer = editorScrollRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.style.height = 'auto'
    bodyInput.style.height = `${bodyInput.scrollHeight}px`

    if (pendingScrollTopRef.current !== null && scrollContainer) {
      const scrollTop = pendingScrollTopRef.current

      const cleanup = restoreEditorScroll(scrollTop)

      return cleanup
    }
  }, [draft.body, isBodyEditing])

  useLayoutEffect(() => {
    const scrollTop = pendingScrollTopRef.current
    const scrollContainer = editorScrollRef.current

    if (scrollTop === null || !scrollContainer) {
      return
    }

    return restoreEditorScroll(scrollTop)
  }, [isBodyEditing])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.focus({ preventScroll: true })
  }, [isBodyEditing])

  async function suggestTitle() {
    const body = draft.body.trim()

    if (!canSuggestTitle || titleStatus === 'loading') {
      return
    }

    const requestId = titleRequestIdRef.current + 1
    titleRequestIdRef.current = requestId
    setTitleStatus('loading')
    setTitleError('')

    try {
      const result = await requestJournalAssistant({
        action: 'title',
        content: body,
      })

      const nextTitle = result.title?.trim()
      const titleStillEmpty = !latestTitleRef.current.trim()
      const requestStillCurrent = titleRequestIdRef.current === requestId

      if (nextTitle && titleStillEmpty && requestStillCurrent) {
        updateDraftRef.current('title', nextTitle)
        setTitleStatus('idle')
      } else if (requestStillCurrent) {
        setTitleStatus('idle')
      }
    } catch (requestError) {
      if (titleRequestIdRef.current === requestId) {
        setTitleStatus('error')
        setTitleError(requestError.message || 'Could not suggest a title.')
      }
    }
  }

  function startBodyEditing() {
    if (!isBodyEditing) {
      pendingScrollTopRef.current = editorScrollRef.current?.scrollTop ?? 0
      setIsBodyEditing(true)
    }
  }

  function rememberEditorScroll({ force = false } = {}) {
    if (pendingScrollTopRef.current !== null && !force) {
      return
    }

    pendingScrollTopRef.current = editorScrollRef.current?.scrollTop ?? null
  }

  function updateBody(event) {
    rememberEditorScroll()
    onUpdateDraft('body', event.target.value)
  }

  function handleBodyKeyDown(event) {
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Enter'
    ) {
      rememberEditorScroll({ force: true })
    }
  }

  function handlePreviewPointerDown(event) {
    event.preventDefault()
    startBodyEditing()
  }

  function handlePreviewKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      startBodyEditing()
    }
  }

  function requestBack() {
    if (hasUnsavedChanges) {
      setLeaveDialogOpen(true)
      return
    }

    onBack()
  }

  function saveAndLeave() {
    setLeaveDialogOpen(false)
    onSave()
  }

  function discardAndLeave() {
    setLeaveDialogOpen(false)
    onBack()
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="mb-[30px] flex items-center justify-between max-md:mb-[22px]">
        <Button
          variant="ghost"
          type="button"
          className="h-9 rounded-lg px-2.5 text-muted-foreground hover:text-foreground"
          onClick={requestBack}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[oklch(0.74_0.14_75)]" />
              <span>Unsaved</span>
            </span>
          )}

          <Button className="h-9 rounded-lg px-3.5 font-semibold" type="button" onClick={onSave}>
            <Save size={16} />
            <span>Save</span>
          </Button>
        </div>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pt-2 [overflow-anchor:none] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
        ref={editorScrollRef}
      >
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
                  titleStatus === 'error' && 'text-destructive hover:text-destructive',
                )}
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label={
                  titleStatus === 'error' ? 'Try suggesting a title again' : 'Suggest title'
                }
                disabled={!canSuggestTitle || titleStatus === 'loading'}
                tabIndex={canSuggestTitle ? 0 : -1}
                onClick={suggestTitle}
                title={titleStatus === 'error' ? 'Try again' : 'Suggest title'}
              >
                {titleStatus === 'loading' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
              </Button>
            </div>

            <input
              className={cn(
                'min-w-0 bg-transparent py-2 text-[40px] font-bold leading-[1.35] tracking-normal text-foreground outline-none transition-[width] duration-200 ease-out placeholder:text-muted-foreground max-md:text-[30px] max-md:leading-[1.35]',
                'w-full',
              )}
              type="text"
              value={draft.title}
              placeholder="Untitled entry"
              onChange={(event) => {
                setTitleError('')
                setTitleStatus('idle')
                onUpdateDraft('title', event.target.value)
              }}
            />
          </div>

          {titleError && canSuggestTitle && (
            <span className="text-xs text-muted-foreground">{titleError}</span>
          )}
        </div>

        <div className="flex w-fit max-w-full items-center gap-2" aria-label="Entry mood">
          {moodOptions.map((mood) => {
            const moodName = moodNameMap[mood] || 'default'
            const active = draft.mood === mood

            return (
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'size-[34px] rounded-lg bg-transparent transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.08] hover:bg-transparent',
                  active && moodToneClassNames[moodName],
                )}
                type="button"
                aria-label={`${moodName} mood`}
                aria-pressed={active}
                key={mood}
                onClick={() => onUpdateDraft('mood', mood)}
                title={moodName.charAt(0).toUpperCase() + moodName.slice(1)}
              >
                <span
                  className={cn(
                    'inline-block text-lg contrast-105 grayscale-[15%] transition-transform',
                    active && 'scale-110 grayscale-0 contrast-125',
                  )}
                >
                  {mood}
                </span>
              </Button>
            )
          })}

          <div className="mx-0.5 h-5 w-px flex-none bg-border" aria-hidden="true" />

          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-pressed={draft.favorite}
            className={cn(
              'size-[34px] rounded-lg text-muted-foreground hover:bg-transparent hover:text-foreground',
              draft.favorite && 'text-foreground',
            )}
            onClick={() => onUpdateDraft('favorite', !draft.favorite)}
            title={draft.favorite ? 'Unfavorite entry' : 'Favorite entry'}
          >
            <Star
              size={18}
              className={cn(
                'fill-transparent transition-transform',
                draft.favorite && 'fill-current',
              )}
            />
          </Button>
        </div>

        <div className="my-2 h-px flex-none bg-muted-foreground/25" aria-hidden="true" />

        {isBodyEditing ? (
          <textarea
            ref={bodyInputRef}
            className="min-h-[1.65em] flex-none resize-none overflow-hidden bg-transparent text-[17px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground max-md:text-base"
            value={draft.body}
            placeholder="Start writing..."
            onBlur={() => setIsBodyEditing(false)}
            onBeforeInput={() => rememberEditorScroll({ force: true })}
            onChange={updateBody}
            onKeyDown={handleBodyKeyDown}
          />
        ) : (
          <div
            className={cn(markdownPreviewClassName, 'max-md:text-base')}
            role="textbox"
            tabIndex={0}
            aria-label="Journal content"
            onKeyDown={handlePreviewKeyDown}
            onPointerDown={handlePreviewPointerDown}
          >
            {draft.body.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {draft.body}
              </ReactMarkdown>
            ) : (
              <p className="m-0 text-muted-foreground">Start writing...</p>
            )}
          </div>
        )}

        <JournalContentAssistant
          onApplyContent={(content) => onUpdateDraft('body', content)}
          body={draft.body}
        />
      </div>

      {leaveDialogOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm animate-in fade-in-0 duration-150"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLeaveDialogOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="unsaved-entry-title"
            aria-describedby="unsaved-entry-description"
            aria-modal="true"
            className="w-full max-w-[380px] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)] animate-in zoom-in-95 duration-150"
            role="dialog"
          >
            <div className="mb-4">
              <h2
                className="mb-1.5 text-base font-semibold leading-tight"
                id="unsaved-entry-title"
              >
                Unsaved changes
              </h2>
              <p
                className="text-sm leading-6 text-muted-foreground"
                id="unsaved-entry-description"
              >
                This entry has changes that have not been saved yet.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={discardAndLeave}
              >
                Discard
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setLeaveDialogOpen(false)}
              >
                Keep editing
              </Button>
              <Button type="button" onClick={saveAndLeave}>
                <Save size={16} />
                <span>Save</span>
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default JournalEditor
