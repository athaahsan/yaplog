import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  PenLine,
  Save,
  Sparkles,
  Star,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { JOURNAL_BODY_MAX_CHARS } from '@/data/journalConfig'
import {
  AI_ASSISTANT_MAX_CHARS,
  TITLE_ASSISTANT_MIN_CHARS,
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
  '😡': 'angry',
}

const moodToneClassNames = {
  angry:
    'bg-[color-mix(in_oklch,oklch(0.66_0.19_35)_18%,transparent)] shadow-[0_0_12px_oklch(0.66_0.19_35/15%),inset_0_0_0_1px_oklch(0.66_0.19_35/40%)]',
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
  'flex-none text-[17px] leading-[1.65] text-foreground outline-none md:text-[17px]',
  '[&_blockquote]:mb-[0.9em] [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-[0.9em] [&_blockquote]:text-muted-foreground',
  '[&_code]:rounded-[5px] [&_code]:bg-muted [&_code]:px-[0.34em] [&_code]:py-[0.12em] [&_code]:text-[0.9em]',
  '[&_h1]:mb-[0.45em] [&_h1]:mt-[1.15em] [&_h1]:text-[1.55em] [&_h1]:leading-[1.2]',
  '[&_h2]:mb-[0.45em] [&_h2]:mt-[1.15em] [&_h2]:text-[1.3em] [&_h2]:leading-[1.2]',
  '[&_h3]:mb-[0.45em] [&_h3]:mt-[1.15em] [&_h3]:text-[1.12em] [&_h3]:leading-[1.2]',
  '[&_ol]:mb-[0.9em] [&_ol]:pl-[1.35em] [&_p]:mb-[0.9em] [&_p]:whitespace-pre-line [&_pre]:mb-[0.9em] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:mb-[0.9em] [&_ul]:mb-[0.9em] [&_ul]:pl-[1.35em]',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
)

const metadataDividerClassName = 'h-[0.5px] flex-1 bg-muted-foreground/25'
const metadataDividerToggleClassName =
  'group/metadata-toggle flex w-full items-center gap-2 rounded-lg border-0 bg-transparent p-0 text-muted-foreground/45 outline-none transition-[height,margin,color] duration-200 ease-out hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

function JournalEditor({
  draft,
  hasUnsavedChanges,
  initialBodyMode = 'preview',
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
  const [bodyMode, setBodyMode] = useState(initialBodyMode)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [titleStatus, setTitleStatus] = useState('idle')
  const [titleError, setTitleError] = useState('')
  const bodyCharCount = draft.body.trim().length
  const canSuggestTitle =
    !draft.title.trim() &&
    bodyCharCount >= TITLE_ASSISTANT_MIN_CHARS &&
    bodyCharCount <= AI_ASSISTANT_MAX_CHARS
  const isBodyEditing = bodyMode === 'edit'

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

  function updateBodyMode(nextMode) {
    if (nextMode === bodyMode) {
      return
    }

    if (nextMode === 'edit') {
      pendingScrollTopRef.current = editorScrollRef.current?.scrollTop ?? 0
    }

    setBodyMode(nextMode)
  }

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

  function rememberEditorScroll({ force = false } = {}) {
    if (pendingScrollTopRef.current !== null && !force) {
      return
    }

    pendingScrollTopRef.current = editorScrollRef.current?.scrollTop ?? null
  }

  function updateBody(event) {
    rememberEditorScroll()
    onUpdateDraft('body', event.target.value.slice(0, JOURNAL_BODY_MAX_CHARS))
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

        <div
          className={cn(
            'flex-none overflow-hidden transition-[margin] duration-200 ease-out',
            !metadataOpen && '-mt-5 mb-2',
          )}
        >
          <div
            className={cn(
              'flex w-fit max-w-full items-center gap-2 overflow-hidden transition-[max-height,opacity,transform,margin-bottom] duration-200 ease-out',
              metadataOpen
                ? 'mb-1.5 max-h-12 translate-y-0 opacity-100'
                : 'mb-0 max-h-0 -translate-y-1 opacity-0',
            )}
            aria-hidden={!metadataOpen}
            aria-label="Entry mood and favorite"
          >
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
                  tabIndex={metadataOpen ? 0 : -1}
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
              tabIndex={metadataOpen ? 0 : -1}
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

          <button
            className={cn(
              metadataDividerToggleClassName,
              metadataOpen ? 'my-2 h-8' : 'my-0.5 h-6',
            )}
            type="button"
            aria-expanded={metadataOpen}
            aria-label={metadataOpen ? 'Hide entry metadata' : 'Show entry metadata'}
            title={metadataOpen ? 'Hide metadata' : 'Show metadata'}
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span
              className={cn(
                metadataDividerClassName,
                'transition-colors group-hover/metadata-toggle:bg-muted-foreground/40',
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'grid place-items-center rounded-lg px-2 transition-[background-color,color] duration-200 group-hover/metadata-toggle:bg-muted dark:group-hover/metadata-toggle:bg-muted/50',
                metadataOpen ? 'h-8' : 'h-6',
              )}
              aria-hidden="true"
            >
              {metadataOpen ? (
                <ChevronUp className="size-3.5 opacity-70" />
              ) : (
                <ChevronDown className="size-3.5 opacity-70" />
              )}
            </span>
          </button>
        </div>

        <div
          className="flex w-fit items-center gap-0.5 rounded-lg border border-border bg-muted/20 p-0.5"
          aria-label="Journal body mode"
          role="radiogroup"
        >
          <Button
            className={cn(
              'size-8 rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              bodyMode === 'preview' &&
              'border-border bg-background text-foreground shadow-sm hover:bg-background',
            )}
            variant="ghost"
            size="icon-sm"
            type="button"
            role="radio"
            aria-checked={bodyMode === 'preview'}
            aria-label="Preview entry"
            title="Preview"
            onClick={() => updateBodyMode('preview')}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            className={cn(
              'size-8 rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              bodyMode === 'edit' &&
              'border-border bg-background text-foreground shadow-sm hover:bg-background',
            )}
            variant="ghost"
            size="icon-sm"
            type="button"
            role="radio"
            aria-checked={bodyMode === 'edit'}
            aria-label="Edit entry"
            title="Edit"
            onClick={() => updateBodyMode('edit')}
          >
            <PenLine className="size-4" />
          </Button>
        </div>

        {isBodyEditing ? (
          <textarea
            ref={bodyInputRef}
            className="min-h-[1.65em] flex-none resize-none overflow-hidden bg-transparent text-[17px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground max-md:text-base"
            value={draft.body}
            maxLength={JOURNAL_BODY_MAX_CHARS}
            placeholder="Start writing..."
            onBeforeInput={() => rememberEditorScroll({ force: true })}
            onChange={updateBody}
            onKeyDown={handleBodyKeyDown}
          />
        ) : (
          <div
            className={cn(markdownPreviewClassName, 'max-md:text-base')}
            role="document"
            aria-label="Journal content"
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
          onApplyContent={(content) =>
            onUpdateDraft('body', content.slice(0, JOURNAL_BODY_MAX_CHARS))
          }
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
