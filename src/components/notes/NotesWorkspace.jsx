import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Inbox,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function NotesWorkspace({ items, onItemsChange }) {
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState(items[0]?.id || '')
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleItems = useMemo(
    () =>
      items
        .filter((item) => {
          if (!normalizedQuery) {
            return true
          }

          return (
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.body.toLowerCase().includes(normalizedQuery)
          )
        })
        .sort(sortNotes),
    [items, normalizedQuery],
  )
  const selectedNote =
    items.find((item) => item.id === selectedNoteId) || items[0] || null
  const favoriteCount = items.filter((item) => item.favorite).length

  useEffect(() => {
    if (!selectedNote && items[0]) {
      setSelectedNoteId(items[0].id)
    }
  }, [items, selectedNote])

  function createNote(event) {
    event.preventDefault()

    const title = newNoteTitle.trim()

    if (!title) {
      return
    }

    const now = new Date().toISOString()
    const note = {
      id: createNoteId(),
      title,
      body: '',
      favorite: false,
      createdAt: now,
      updatedAt: now,
    }

    onItemsChange((currentItems) => [note, ...currentItems])
    setSelectedNoteId(note.id)
    setNewNoteTitle('')
  }

  function updateNote(noteId, updates) {
    onItemsChange((currentItems) =>
      currentItems.map((item) =>
        item.id === noteId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  function deleteNote(noteId) {
    onItemsChange((currentItems) => currentItems.filter((item) => item.id !== noteId))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-6 flex items-end justify-between gap-4 max-[720px]:mb-[18px]">
        <div>
          <h1 className="m-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
            Notes
          </h1>
        </div>
        <div className="hidden text-right text-sm leading-6 text-muted-foreground sm:block">
          <p>{items.length} notes</p>
          <p>{favoriteCount} starred</p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 min-[720px]:grid-cols-[1fr_360px]">
        <section className="flex min-h-0 flex-col" aria-label="Note list">
          <form
            className="mb-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-sm:grid-cols-1"
            onSubmit={createNote}
          >
            <label className="relative flex min-w-0 flex-1 items-center">
              <Plus
                className="pointer-events-none absolute left-3 text-muted-foreground"
                size={16}
              />
              <Input
                className="h-9 rounded-lg bg-card pl-9 shadow-none"
                value={newNoteTitle}
                placeholder="Add a note..."
                onChange={(event) => setNewNoteTitle(event.target.value)}
              />
            </label>
            <Button
              className="h-9 rounded-lg px-3"
              type="submit"
              aria-label="Add note"
            >
              <Plus size={16} />
              <span>New</span>
            </Button>
          </form>

          <label className="relative mb-4 flex min-w-0 items-center">
            <Search
              className="pointer-events-none absolute left-3 text-muted-foreground"
              size={16}
            />
            <Input
              type="text"
              placeholder="Search notes..."
              className="h-9 rounded-lg bg-card pl-9 pr-9 shadow-none"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <Button
                className="absolute right-1.5 size-7 rounded-md p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
              >
                <X size={15} />
              </Button>
            )}
          </label>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
            {visibleItems.length > 0 ? (
              <div className="overflow-hidden rounded-[8px] border border-border bg-card">
                {visibleItems.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    onDeleteNote={deleteNote}
                    onSelectNote={setSelectedNoteId}
                    onToggleFavorite={(selectedNoteItem) =>
                      updateNote(selectedNoteItem.id, {
                        favorite: !selectedNoteItem.favorite,
                      })
                    }
                    selected={note.id === selectedNote?.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyNotesState
                hasAnyNotes={items.length > 0}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </section>

        <NoteDetailsPanel
          note={selectedNote}
          onDeleteNote={deleteNote}
          onUpdateNote={updateNote}
        />
      </div>
    </div>
  )
}

function NoteRow({
  note,
  onDeleteNote,
  onSelectNote,
  onToggleFavorite,
  selected,
}) {
  return (
    <div
      className={cn(
        'group grid min-h-[70px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3.5 py-3 text-left last:border-b-0 hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-accent text-accent-foreground',
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelectNote(note.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectNote(note.id)
        }
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{getNoteDisplayTitle(note)}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {getNotePreview(note)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
        <Button
          className={cn(
            'size-7 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground',
            note.favorite && 'text-amber-500 hover:text-amber-500',
          )}
          variant="ghost"
          size="icon"
          type="button"
          aria-label={note.favorite ? 'Unstar note' : 'Star note'}
          aria-pressed={note.favorite}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite(note)
          }}
        >
          <Star className={cn('size-4', note.favorite && 'fill-current')} />
        </Button>
        <Button
          className="size-7 rounded-md text-muted-foreground hover:bg-transparent hover:text-destructive"
          variant="ghost"
          size="icon"
          type="button"
          aria-label={`Delete ${getNoteDisplayTitle(note)}`}
          onClick={(event) => {
            event.stopPropagation()
            onDeleteNote(note.id)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function NoteDetailsPanel({ note, onDeleteNote, onUpdateNote }) {
  if (!note) {
    return (
      <aside className="grid min-h-[280px] place-items-center rounded-[8px] border border-dashed border-border bg-card/45 p-6 text-center text-sm text-muted-foreground">
        <div>
          <Inbox className="mx-auto mb-3 size-6" />
          <p>Select or create a note to edit it.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex min-h-0 flex-col rounded-[8px] border border-border bg-card p-4 text-card-foreground max-lg:min-h-[360px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-muted-foreground">
          <FileText className="size-4" />
          <span>Note details</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            className={cn(
              'size-8 rounded-md text-muted-foreground hover:text-foreground',
              note.favorite && 'text-amber-500 hover:text-amber-500',
            )}
            variant="ghost"
            size="icon"
            type="button"
            aria-label={note.favorite ? 'Unstar note' : 'Star note'}
            aria-pressed={note.favorite}
            onClick={() => onUpdateNote(note.id, { favorite: !note.favorite })}
          >
            <Star className={cn('size-4', note.favorite && 'fill-current')} />
          </Button>
          <Button
            className="size-8 rounded-md text-muted-foreground hover:text-destructive"
            variant="ghost"
            size="icon"
            type="button"
            aria-label={`Delete ${getNoteDisplayTitle(note)}`}
            onClick={() => onDeleteNote(note.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Title</span>
        <Input
          className="h-10 rounded-lg bg-background text-base font-semibold shadow-none"
          value={note.title}
          placeholder="Untitled note"
          onChange={(event) => onUpdateNote(note.id, { title: event.target.value })}
        />
      </label>

      <label className="mt-4 flex min-h-0 flex-1 flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground">Body</span>
        <textarea
          className="min-h-[220px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-none outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={note.body}
          placeholder="Keep a small thought here..."
          onChange={(event) => onUpdateNote(note.id, { body: event.target.value })}
        />
      </label>

      <p className="mt-3 text-xs text-muted-foreground">
        Edited {formatNoteDate(note.updatedAt)}
      </p>
    </aside>
  )
}

function EmptyNotesState({ hasAnyNotes, searchQuery }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-[8px] border border-dashed border-border bg-card/45 p-6 text-center text-sm text-muted-foreground">
      <div>
        <Inbox className="mx-auto mb-3 size-6" />
        <p>
          {hasAnyNotes || searchQuery
            ? 'No notes match this search.'
            : 'No notes yet. Add the first one above.'}
        </p>
      </div>
    </div>
  )
}

function getNoteDisplayTitle(note) {
  return note.title.trim() || 'Untitled note'
}

function getNotePreview(note) {
  return note.body.trim() || 'No body yet.'
}

function sortNotes(first, second) {
  if (first.favorite !== second.favorite) {
    return first.favorite ? -1 : 1
  }

  return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
}

function formatNoteDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'just now'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return `memo-${globalThis.crypto.randomUUID()}`
  }

  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default NotesWorkspace
