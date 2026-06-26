import { useEffect, useMemo, useState } from 'react'
import {
  Inbox,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const emptyNoteDraft = {
  body: '',
  favorite: false,
  id: '',
  title: '',
}

function NotesWorkspace({ items, onItemsChange }) {
  const [editorState, setEditorState] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const columnCount = useNotesColumnCount()
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => {
          if (!normalizedQuery) {
            return true
          }

          return (
            (item.title || '').toLowerCase().includes(normalizedQuery) ||
            (item.body || '').toLowerCase().includes(normalizedQuery)
          )
        })
        .sort(sortNotes),
    [items, normalizedQuery],
  )
  const pinnedItems = visibleItems.filter((item) => item.favorite)
  const otherItems = visibleItems.filter((item) => !item.favorite)
  const hasPinnedItems = pinnedItems.length > 0
  const stateLabel =
    normalizedQuery || visibleItems.length !== items.length
      ? `${visibleItems.length} results`
      : items.length === 1
        ? '1 note'
        : `${items.length} notes`

  function openNewNote() {
    setEditorState({
      draft: { ...emptyNoteDraft },
      mode: 'new',
    })
  }

  function openExistingNote(note) {
    setEditorState({
      draft: {
        body: note.body || '',
        favorite: Boolean(note.favorite),
        id: note.id,
        title: note.title || '',
      },
      mode: 'edit',
    })
  }

  function updateDraft(updates) {
    setEditorState((currentState) =>
      currentState
        ? {
            ...currentState,
            draft: { ...currentState.draft, ...updates },
          }
        : currentState,
    )
  }

  function saveDraft() {
    if (!editorState) {
      return
    }

    const now = new Date().toISOString()
    const draft = {
      body: editorState.draft.body,
      favorite: editorState.draft.favorite,
      title: editorState.draft.title,
    }

    if (editorState.mode === 'new') {
      const note = {
        ...draft,
        createdAt: now,
        id: createNoteId(),
        updatedAt: now,
      }

      onItemsChange((currentItems) => [note, ...currentItems])
    } else {
      onItemsChange((currentItems) =>
        currentItems.map((item) =>
          item.id === editorState.draft.id
            ? { ...item, ...draft, updatedAt: now }
            : item,
        ),
      )
    }

    setEditorState(null)
  }

  function togglePinned(note) {
    onItemsChange((currentItems) =>
      currentItems.map((item) =>
        item.id === note.id
          ? {
              ...item,
              favorite: !item.favorite,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }

  function requestDeleteNote(note) {
    setPendingDelete({
      id: note.id,
      title: getNoteDisplayTitle(note),
    })
  }

  function confirmDeleteNote() {
    if (!pendingDelete) {
      return
    }

    onItemsChange((currentItems) =>
      currentItems.filter((item) => item.id !== pendingDelete.id),
    )
    setEditorState((currentState) =>
      currentState?.draft.id === pendingDelete.id ? null : currentState,
    )
    setPendingDelete(null)
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
      <header className="mb-5 flex flex-none items-baseline justify-between gap-4 max-[720px]:mb-4">
        <h1 className="m-0 min-w-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
          Notes
        </h1>
        <p className="m-0 shrink-0 text-sm font-semibold text-muted-foreground">
          {stateLabel}
        </p>
      </header>

      <NotesToolbar
        onNewNote={openNewNote}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
        {visibleItems.length > 0 ? (
          <div className="space-y-5 pb-2">
            {hasPinnedItems && (
              <NotesSection
                label="Pinned"
                notes={pinnedItems}
                onDeleteNote={requestDeleteNote}
                onOpenNote={openExistingNote}
                onTogglePinned={togglePinned}
                columnCount={columnCount}
                searchQuery={searchQuery}
              />
            )}
            {otherItems.length > 0 && (
              <NotesSection
                label={hasPinnedItems ? 'Others' : ''}
                notes={otherItems}
                onDeleteNote={requestDeleteNote}
                onOpenNote={openExistingNote}
                onTogglePinned={togglePinned}
                columnCount={columnCount}
                searchQuery={searchQuery}
              />
            )}
          </div>
        ) : (
          <EmptyNotesState
            hasAnyNotes={items.length > 0}
            onNewNote={openNewNote}
            searchQuery={searchQuery}
          />
        )}
      </div>

      <NoteEditorModal
        editorState={editorState}
        onClose={() => setEditorState(null)}
        onDeleteNote={(note) => requestDeleteNote(note)}
        onSave={saveDraft}
        onUpdateDraft={updateDraft}
      />
      <DeleteNoteConfirmationDialog
        pendingDelete={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteNote}
      />
    </div>
  )
}

function NotesSection({
  columnCount,
  label,
  notes,
  onDeleteNote,
  onOpenNote,
  onTogglePinned,
  searchQuery,
}) {
  const columns = useMemo(
    () => distributeNotesIntoColumns(notes, columnCount),
    [columnCount, notes],
  )

  return (
    <section aria-label={label || 'Notes'}>
      {label && (
        <h2 className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {label}
        </h2>
      )}
      <div
        className={cn(
          'grid gap-3',
          columnCount === 1 && 'grid-cols-1',
          columnCount === 2 && 'grid-cols-2',
          columnCount === 3 && 'grid-cols-3',
        )}
      >
        {columns.map((columnNotes, columnIndex) => (
          <div className="flex min-w-0 flex-col gap-3" key={columnIndex}>
            {columnNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDeleteNote={onDeleteNote}
                onOpenNote={onOpenNote}
                onTogglePinned={onTogglePinned}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function NotesToolbar({ onNewNote, onSearchChange, searchQuery }) {
  return (
    <div className="relative mb-3 grid flex-none grid-cols-[1fr_auto] items-center gap-2 sm:flex">
      <label className="relative flex min-w-0 flex-1 items-center sm:min-w-[220px] sm:max-w-[360px]">
        <Search
          className="pointer-events-none absolute left-3 text-muted-foreground"
          size={16}
        />
        <Input
          type="text"
          placeholder="Search notes..."
          className="h-9 rounded-lg bg-card pl-9 pr-9 shadow-none"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchQuery && (
          <Button
            className="absolute right-1.5 size-7 rounded-md p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
          >
            <X size={15} />
          </Button>
        )}
      </label>

      <Button
        className="ml-auto rounded-lg"
        type="button"
        aria-label="New note"
        onClick={onNewNote}
      >
        <Plus size={16} />
        <span className="hidden sm:inline">New</span>
      </Button>
    </div>
  )
}

function NoteCard({ note, onDeleteNote, onOpenNote, onTogglePinned, searchQuery }) {
  return (
    <article
      className="group w-full cursor-pointer rounded-[8px] border border-border bg-card p-3 text-card-foreground transition-colors hover:bg-accent/45"
      role="button"
      tabIndex={0}
      onClick={() => onOpenNote(note)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenNote(note)
        }
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h2 className="line-clamp-2 min-w-0 text-sm font-semibold leading-5">
          <HighlightedText query={searchQuery} text={getNoteDisplayTitle(note)} />
        </h2>
        <Button
          className={cn(
            'size-7 shrink-0 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground',
            note.favorite && 'text-amber-500 hover:text-amber-500',
          )}
          variant="ghost"
          size="icon"
          type="button"
          aria-label={note.favorite ? 'Unpin note' : 'Pin note'}
          aria-pressed={note.favorite}
          onClick={(event) => {
            event.stopPropagation()
            onTogglePinned(note)
          }}
        >
          <Pin className={cn('size-4', note.favorite && 'fill-current')} />
        </Button>
      </div>

      <p className="mt-2 line-clamp-5 text-sm leading-6 text-muted-foreground">
        <HighlightedText query={searchQuery} text={getNotePreview(note)} />
      </p>

      <footer className="mt-4 flex items-center justify-between gap-3">
        <span className="truncate text-xs text-muted-foreground">
          Edited {formatNoteDate(note.updatedAt)}
        </span>
        <Button
          className="size-7 shrink-0 rounded-md text-muted-foreground opacity-0 hover:bg-transparent hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 max-[720px]:opacity-100"
          variant="ghost"
          size="icon"
          type="button"
          aria-label={`Delete ${getNoteDisplayTitle(note)}`}
          onClick={(event) => {
            event.stopPropagation()
            onDeleteNote(note)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </footer>
    </article>
  )
}

function NoteEditorModal({
  editorState,
  onClose,
  onDeleteNote,
  onSave,
  onUpdateDraft,
}) {
  if (!editorState) {
    return null
  }

  const draft = editorState.draft
  const existingNote = editorState.mode === 'edit'
  const canSave = Boolean(draft.title.trim() || draft.body.trim())

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="flex max-h-[min(720px,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(180px,1fr)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 px-4 pt-4">
            <label className="min-w-0">
              <span className="sr-only">Note title</span>
              <input
                id="note-editor-title"
                className="h-9 w-full border-0 bg-transparent p-0 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
                value={draft.title}
                placeholder="Title"
                onChange={(event) => onUpdateDraft({ title: event.target.value })}
              />
            </label>
            <Button
              className={cn(
                'size-8 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground',
                draft.favorite && 'text-amber-500 hover:text-amber-500',
              )}
              variant="ghost"
              size="icon"
              type="button"
              aria-label={draft.favorite ? 'Unpin note' : 'Pin note'}
              aria-pressed={draft.favorite}
              onClick={() => onUpdateDraft({ favorite: !draft.favorite })}
            >
              <Pin className={cn('size-4', draft.favorite && 'fill-current')} />
            </Button>
          </div>

          <label className="min-h-0 px-4 pb-2">
            <span className="sr-only">Note body</span>
            <textarea
              className="h-full min-h-[180px] w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:outline-none"
              value={draft.body}
              placeholder="Take a note..."
              onChange={(event) => onUpdateDraft({ body: event.target.value })}
            />
          </label>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5">
          <div className="flex items-center gap-1">
            {existingNote && (
              <Button
                className="size-8 rounded-md text-muted-foreground hover:bg-transparent hover:text-destructive"
                variant="ghost"
                size="icon"
                type="button"
                aria-label={`Delete ${getNoteDisplayTitle(draft)}`}
                onClick={() => onDeleteNote(draft)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              className="rounded-lg max-[420px]:flex-1"
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg max-[420px]:flex-1"
              type="button"
              disabled={!canSave}
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}

function DeleteNoteConfirmationDialog({ onCancel, onConfirm, pendingDelete }) {
  if (!pendingDelete) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-background/70 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel()
        }
      }}
    >
      <section
        className="w-full max-w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/22%)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-note-dialog-title"
        aria-describedby="delete-note-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2
          className="m-0 text-base font-semibold text-foreground"
          id="delete-note-dialog-title"
        >
          Delete note?
        </h2>
        <p
          className="mt-2 text-sm leading-6 text-muted-foreground"
          id="delete-note-dialog-description"
        >
          This cannot be undone.
        </p>
        <p className="mt-2 break-words text-sm font-medium text-foreground">
          {pendingDelete.title}
        </p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            className="rounded-lg max-[420px]:flex-1"
            variant="outline"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="rounded-lg max-[420px]:flex-1"
            variant="destructive"
            type="button"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </section>
    </div>
  )
}

function EmptyNotesState({ hasAnyNotes, onNewNote, searchQuery }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-[8px] border border-dashed border-border bg-card/45 p-6 text-center text-sm text-muted-foreground">
      <div>
        <Inbox className="mx-auto mb-3 size-6" />
        <p>
          {hasAnyNotes || searchQuery
            ? 'No notes match this search.'
            : 'No notes yet.'}
        </p>
        {!hasAnyNotes && !searchQuery && (
          <Button
            className="mt-3 h-8 rounded-lg px-3"
            variant="secondary"
            type="button"
            onClick={onNewNote}
          >
            Add note
          </Button>
        )}
      </div>
    </div>
  )
}

function useNotesColumnCount() {
  const [columnCount, setColumnCount] = useState(getCurrentNoteColumnCount)

  useEffect(() => {
    function updateColumnCount() {
      setColumnCount(getCurrentNoteColumnCount())
    }

    updateColumnCount()
    window.addEventListener('resize', updateColumnCount)
    return () => window.removeEventListener('resize', updateColumnCount)
  }, [])

  return columnCount
}

function getCurrentNoteColumnCount() {
  if (typeof window === 'undefined') {
    return 3
  }

  if (window.matchMedia('(min-width: 1280px)').matches) {
    return 3
  }

  if (window.matchMedia('(min-width: 640px)').matches) {
    return 2
  }

  return 1
}

function distributeNotesIntoColumns(notes, columnCount) {
  const safeColumnCount = Math.max(1, columnCount)
  const columns = Array.from({ length: safeColumnCount }, () => [])

  notes.forEach((note, index) => {
    columns[index % safeColumnCount].push(note)
  })

  return columns
}

function getNoteDisplayTitle(note) {
  return (note.title || '').trim() || 'Untitled note'
}

function getNotePreview(note) {
  return (note.body || '').trim() || 'No body yet.'
}

function sortNotes(first, second) {
  if (first.favorite !== second.favorite) {
    return first.favorite ? -1 : 1
  }

  return getNoteCreatedTime(second) - getNoteCreatedTime(first)
}

function getNoteCreatedTime(note) {
  const time = new Date(note.createdAt || note.updatedAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

function formatNoteDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'just now'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function HighlightedText({ query, text }) {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return text
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedQuery.toLowerCase() ? (
      <mark
        className="rounded-[3px] bg-primary/20 px-0.5 text-foreground"
        key={`${part}-${index}`}
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return `memo-${globalThis.crypto.randomUUID()}`
  }

  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default NotesWorkspace
