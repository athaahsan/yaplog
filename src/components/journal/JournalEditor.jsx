import { useEffect, useRef, useState } from 'react'
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
  'min-h-[max(260px,calc(100dvh-360px))] flex-none cursor-text text-[17px] leading-[1.65] text-foreground outline-none md:text-[17px]',
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
  moodOptions,
  onBack,
  onSave,
  onUpdateDraft,
}) {
  const bodyInputRef = useRef(null)
  const latestTitleRef = useRef(draft.title)
  const titleRequestIdRef = useRef(0)
  const updateDraftRef = useRef(onUpdateDraft)
  const [isBodyEditing, setIsBodyEditing] = useState(false)
  const [titleStatus, setTitleStatus] = useState('idle')
  const [titleError, setTitleError] = useState('')
  const bodyWordCount = countWords(draft.body)
  const canSuggestTitle =
    !draft.title.trim() && bodyWordCount >= TITLE_WORD_THRESHOLD

  useEffect(() => {
    latestTitleRef.current = draft.title
  }, [draft.title])

  useEffect(() => {
    updateDraftRef.current = onUpdateDraft
  }, [onUpdateDraft])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.style.height = 'auto'
    bodyInput.style.height = `${bodyInput.scrollHeight}px`
  }, [draft.body, isBodyEditing])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.focus()
    bodyInput.selectionStart = bodyInput.value.length
    bodyInput.selectionEnd = bodyInput.value.length
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

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="mb-[30px] flex items-center justify-between max-md:mb-[22px]">
        <Button
          variant="ghost"
          type="button"
          className="h-9 rounded-lg px-2.5 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-pressed={draft.favorite}
            className={cn(
              'size-9 rounded-lg text-muted-foreground hover:text-foreground',
              draft.favorite && 'text-[oklch(0.8_0.15_85)]',
            )}
            onClick={() => onUpdateDraft('favorite', !draft.favorite)}
            title={draft.favorite ? 'Unfavorite entry' : 'Favorite entry'}
          >
            <Star
              size={18}
              className={cn(
                'fill-transparent transition-transform',
                draft.favorite &&
                  'fill-current drop-shadow-[0_0_6px_oklch(0.8_0.15_85/40%)]',
              )}
            />
          </Button>

          <Button className="h-9 rounded-lg px-3.5 font-semibold" type="button" onClick={onSave}>
            <Save size={16} />
            <span>Save</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pt-2 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
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
        </div>

        <JournalContentAssistant
          onApplyContent={(content) => onUpdateDraft('body', content)}
          body={draft.body}
        />

        {isBodyEditing ? (
          <textarea
            ref={bodyInputRef}
            className="min-h-[max(260px,calc(100dvh-360px))] flex-none resize-none overflow-hidden bg-transparent text-[17px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground max-md:min-h-[360px] max-md:text-base"
            value={draft.body}
            placeholder="Start writing..."
            onBlur={() => setIsBodyEditing(false)}
            onChange={(event) => onUpdateDraft('body', event.target.value)}
          />
        ) : (
          <div
            className={cn(markdownPreviewClassName, 'max-md:min-h-[360px] max-md:text-base')}
            role="textbox"
            tabIndex={0}
            aria-label="Journal content"
            onClick={() => setIsBodyEditing(true)}
            onFocus={() => setIsBodyEditing(true)}
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
      </div>
    </div>
  )
}

export default JournalEditor
