import { useEffect, useRef, useState } from 'react'
import JournalBodyField from './editor/JournalBodyField'
import JournalEditorHeader from './editor/JournalEditorHeader'
import JournalLeaveDialog from './editor/JournalLeaveDialog'
import JournalTitleField from './editor/JournalTitleField'
import MoodDropdown from './editor/MoodDropdown'
import { formatDateTime } from '@/lib/dateTime'

function JournalEditor({
  draft,
  hasUnsavedChanges,
  initialBodyMode = 'preview',
  moodOptions,
  onBack,
  onSave,
  onUpdateDraft,
  voiceInputEnabled,
  voiceInputUserId,
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
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col">
      <JournalEditorHeader
        favorite={draft.favorite}
        hasUnsavedChanges={hasUnsavedChanges}
        onBack={requestBack}
        onSave={onSave}
        onToggleFavorite={() => onUpdateDraft('favorite', !draft.favorite)}
      />

      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pt-2 [overflow-anchor:none] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
        ref={editorScrollRef}
      >
        <JournalTitleField
          body={draft.body}
          title={draft.title}
          onChange={(title) => onUpdateDraft('title', title)}
        />

        <JournalMetadata
          createdAt={draft.createdAt}
          mood={draft.mood}
          moodOptions={moodOptions}
          updatedAt={draft.updatedAt}
          onMoodChange={(mood) => onUpdateDraft('mood', mood)}
        />

        <JournalBodyField
          body={draft.body}
          initialBodyMode={initialBodyMode}
          onChange={(body) => onUpdateDraft('body', body)}
          scrollContainerRef={editorScrollRef}
          voiceInputEnabled={voiceInputEnabled}
          voiceInputUserId={voiceInputUserId}
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

function JournalMetadata({
  createdAt,
  mood,
  moodOptions,
  onMoodChange,
  updatedAt,
}) {
  const createdLabel = createdAt ? formatDateTime(createdAt) : 'Not saved yet'
  const updatedLabel = updatedAt ? formatDateTime(updatedAt) : 'Not saved yet'

  return (
    <div className="mb-0 grid gap-1.5 pb-2 text-sm">
      <MetadataRow label="Mood">
        <MoodDropdown
          moodOptions={moodOptions}
          value={mood}
          onChange={onMoodChange}
        />
      </MetadataRow>
      <MetadataRow label="Created">
        <span>{createdLabel}</span>
      </MetadataRow>
      <MetadataRow label="Edited">
        <span>{updatedLabel}</span>
      </MetadataRow>
    </div>
  )
}

function MetadataRow({ children, label }) {
  return (
    <div className="grid min-h-8 grid-cols-[76px_minmax(0,1fr)] items-center gap-3 max-md:grid-cols-[64px_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 text-foreground">{children}</div>
    </div>
  )
}

export default JournalEditor
