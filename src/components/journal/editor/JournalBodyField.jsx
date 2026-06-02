import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { JOURNAL_BODY_MAX_CHARS } from '@/data/journalConfig'
import { cn } from '@/lib/utils'
import JournalContentAssistant from '../JournalContentAssistant'

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

function JournalBodyField({
  body,
  initialBodyMode = 'preview',
  onChange,
  scrollContainerRef,
}) {
  const bodyInputRef = useRef(null)
  const pendingScrollTopRef = useRef(null)
  const previewPointerRef = useRef(null)
  const [bodyMode, setBodyMode] = useState(initialBodyMode)
  const isBodyEditing = bodyMode === 'edit'

  const restoreEditorScroll = useCallback((scrollTop) => {
    const scrollContainer = scrollContainerRef.current

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
  }, [scrollContainerRef])

  useLayoutEffect(() => {
    const bodyInput = bodyInputRef.current
    const scrollContainer = scrollContainerRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.style.height = 'auto'
    bodyInput.style.height = `${bodyInput.scrollHeight}px`

    if (pendingScrollTopRef.current !== null && scrollContainer) {
      const scrollTop = pendingScrollTopRef.current

      return restoreEditorScroll(scrollTop)
    }
  }, [body, isBodyEditing, restoreEditorScroll, scrollContainerRef])

  useLayoutEffect(() => {
    const scrollTop = pendingScrollTopRef.current
    const scrollContainer = scrollContainerRef.current

    if (scrollTop === null || !scrollContainer) {
      return
    }

    return restoreEditorScroll(scrollTop)
  }, [isBodyEditing, restoreEditorScroll, scrollContainerRef])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.focus({ preventScroll: true })
  }, [isBodyEditing])

  function startBodyEditing() {
    if (!isBodyEditing) {
      pendingScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0
      setBodyMode('edit')
    }
  }

  function rememberEditorScroll({ force = false } = {}) {
    if (pendingScrollTopRef.current !== null && !force) {
      return
    }

    pendingScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? null
  }

  function updateBody(event) {
    rememberEditorScroll()
    onChange(event.target.value.slice(0, JOURNAL_BODY_MAX_CHARS))
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
    previewPointerRef.current = {
      moved: false,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  function handlePreviewPointerMove(event) {
    const pointer = previewPointerRef.current

    if (!pointer || pointer.pointerId !== event.pointerId || pointer.moved) {
      return
    }

    const deltaX = Math.abs(event.clientX - pointer.x)
    const deltaY = Math.abs(event.clientY - pointer.y)

    if (deltaX > 8 || deltaY > 8) {
      pointer.moved = true
    }
  }

  function handlePreviewPointerUp(event) {
    const pointer = previewPointerRef.current
    previewPointerRef.current = null

    if (!pointer || pointer.pointerId !== event.pointerId || pointer.moved) {
      return
    }

    event.preventDefault()
    startBodyEditing()
  }

  function handlePreviewPointerCancel() {
    previewPointerRef.current = null
  }

  function handlePreviewKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      startBodyEditing()
    }
  }

  return (
    <>
      {isBodyEditing ? (
        <textarea
          ref={bodyInputRef}
          className="min-h-[1.65em] flex-none resize-none overflow-hidden bg-transparent text-[17px] leading-[1.65] text-foreground outline-none placeholder:text-muted-foreground max-md:text-base"
          value={body}
          maxLength={JOURNAL_BODY_MAX_CHARS}
          placeholder="Start writing..."
          onBlur={() => setBodyMode('preview')}
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
          onPointerCancel={handlePreviewPointerCancel}
          onPointerDown={handlePreviewPointerDown}
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={handlePreviewPointerUp}
        >
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body}
            </ReactMarkdown>
          ) : (
            <p className="m-0 text-muted-foreground">Start writing...</p>
          )}
        </div>
      )}

      <JournalContentAssistant
        onApplyContent={(content) =>
          onChange(content.slice(0, JOURNAL_BODY_MAX_CHARS))
        }
        body={body}
      />
    </>
  )
}

export default JournalBodyField
