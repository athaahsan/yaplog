import { useEffect, useRef, useState } from 'react'
import JournalBodyField from './editor/JournalBodyField'
import JournalEditorHeader from './editor/JournalEditorHeader'
import JournalLeaveDialog from './editor/JournalLeaveDialog'
import JournalTitleField from './editor/JournalTitleField'
import MoodDropdown from './editor/MoodDropdown'

function JournalEditor({
  draft,
  hasUnsavedChanges,
  initialBodyMode = 'preview',
  moodOptions,
  onBack,
  onSave,
  onUpdateDraft,
}) {
  const editorScrollRef = useRef(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

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
      <JournalEditorHeader
        favorite={draft.favorite}
        onBack={requestBack}
        onSave={onSave}
        onToggleFavorite={() => onUpdateDraft('favorite', !draft.favorite)}
      />

      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pt-2 [overflow-anchor:none] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
        ref={editorScrollRef}
      >
        <MoodDropdown
          moodOptions={moodOptions}
          value={draft.mood}
          onChange={(mood) => onUpdateDraft('mood', mood)}
        />

        <JournalTitleField
          body={draft.body}
          title={draft.title}
          onChange={(title) => onUpdateDraft('title', title)}
        />

        <JournalBodyField
          body={draft.body}
          initialBodyMode={initialBodyMode}
          onChange={(body) => onUpdateDraft('body', body)}
          scrollContainerRef={editorScrollRef}
        />
      </div>

      {leaveDialogOpen && (
        <JournalLeaveDialog
          onCancel={() => setLeaveDialogOpen(false)}
          onDiscard={discardAndLeave}
          onSave={saveAndLeave}
        />
      )}
    </div>
  )
}

export default JournalEditor
