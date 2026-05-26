import { useEffect, useRef, useState } from 'react'
import { moodOptions } from '../../data/journalConfig'
import {
  downloadMarkdownEntriesZip,
  downloadMarkdownEntry,
} from '../../lib/journalExport'
import JournalEditor from './JournalEditor'
import JournalTable from './JournalTable'
import JournalToolbar from './JournalToolbar'

function toggleListValue(value, setter) {
  setter((current) =>
    current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value],
  )
}

function JournalWorkspace({ entries, onEntriesChange }) {
  const [journalMode, setJournalMode] = useState('table')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [entryDraft, setEntryDraft] = useState(null)
  const [initialEntryDraft, setInitialEntryDraft] = useState(null)
  const [selectedEntryIds, setSelectedEntryIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [createdDateRange, setCreatedDateRange] = useState()
  const [favoriteFilter, setFavoriteFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [updatedDateRange, setUpdatedDateRange] = useState()
  const [sortConfig, setSortConfig] = useState({
    direction: 'desc',
    key: 'createdAt',
  })
  const filterRef = useRef(null)

  const activeFilterCount =
    selectedMoods.length +
    (favoriteFilter !== 'all' ? 1 : 0) +
    (hasDateRange(createdDateRange) ? 1 : 0) +
    (hasDateRange(updatedDateRange) ? 1 : 0)
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        !normalizedSearchQuery ||
        entry.title.toLowerCase().includes(normalizedSearchQuery) ||
        (entry.body || '').toLowerCase().includes(normalizedSearchQuery)
      const matchesMood =
        selectedMoods.length === 0 || selectedMoods.includes(entry.mood)
      const matchesFavorite =
        favoriteFilter === 'all' ||
        (favoriteFilter === 'favorited' && entry.favorite) ||
        (favoriteFilter === 'unfavorited' && !entry.favorite)
      const matchesCreatedDate = isDateInRange(entry.createdAt, createdDateRange)
      const matchesUpdatedDate = isDateInRange(entry.updatedAt, updatedDateRange)

      return (
        matchesSearch &&
        matchesMood &&
        matchesFavorite &&
        matchesCreatedDate &&
        matchesUpdatedDate
      )
    })
    .sort((firstEntry, secondEntry) => {
      const directionModifier = sortConfig.direction === 'asc' ? 1 : -1

      if (sortConfig.key === 'title') {
        return (
          firstEntry.title.localeCompare(secondEntry.title, undefined, {
            sensitivity: 'base',
          }) * directionModifier
        )
      }

      return (
        (new Date(firstEntry[sortConfig.key]).getTime() -
          new Date(secondEntry[sortConfig.key]).getTime()) *
        directionModifier
      )
    })
  const allEntriesSelected =
    filteredEntries.length > 0 &&
    filteredEntries.every((entry) => selectedEntryIds.includes(entry.id))

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        !filterRef.current?.contains(event.target) &&
        !event.target.closest('[data-slot="popover-content"]')
      ) {
        setFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function toggleSelectAll() {
    setSelectedEntryIds((current) =>
      allEntriesSelected
        ? current.filter((id) => !filteredEntries.some((entry) => entry.id === id))
        : Array.from(new Set([...current, ...filteredEntries.map((entry) => entry.id)])),
    )
  }

  function toggleEntrySelection(entryId) {
    setSelectedEntryIds((current) =>
      current.includes(entryId)
        ? current.filter((id) => id !== entryId)
        : [...current, entryId],
    )
  }

  function toggleFavorite(entryId) {
    onEntriesChange((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry,
      ),
    )
  }

  function clearFilters() {
    setSelectedMoods([])
    setCreatedDateRange(undefined)
    setFavoriteFilter('all')
    setUpdatedDateRange(undefined)
  }

  function clearSelection() {
    setSelectedEntryIds([])
  }

  function deleteSelectedEntries() {
    onEntriesChange((currentEntries) =>
      currentEntries.filter((entry) => !selectedEntryIds.includes(entry.id)),
    )
    setSelectedEntryIds([])
  }

  function downloadSelectedEntries() {
    const selectedEntries = entries.filter((entry) =>
      selectedEntryIds.includes(entry.id),
    )

    if (selectedEntries.length === 1) {
      downloadMarkdownEntry(selectedEntries[0])
      return
    }

    if (selectedEntries.length > 1) {
      downloadMarkdownEntriesZip(selectedEntries)
    }
  }

  function updateSort(nextKey) {
    setSortConfig((current) => ({
      direction:
        current.key === nextKey && current.direction === 'asc' ? 'desc' : 'asc',
      key: nextKey,
    }))
  }

  function openNewEntry() {
    const nextDraft = {
      title: '',
      body: '',
      mood: moodOptions[1],
      favorite: false,
    }

    setEditingEntryId(null)
    setEntryDraft(nextDraft)
    setInitialEntryDraft(nextDraft)
    setJournalMode('editor')
  }

  function openEntry(entry) {
    const nextDraft = { ...entry }

    setEditingEntryId(entry.id)
    setEntryDraft(nextDraft)
    setInitialEntryDraft(nextDraft)
    setJournalMode('editor')
  }

  function updateEntryDraft(field, value) {
    setEntryDraft((draft) => ({ ...draft, [field]: value }))
  }

  function closeEditor() {
    setJournalMode('table')
    setEditingEntryId(null)
    setEntryDraft(null)
    setInitialEntryDraft(null)
  }

  function saveEntry() {
    const title = entryDraft.title.trim() || 'Untitled entry'
    const savedAt = new Date().toISOString()
    const savedEntry = {
      ...entryDraft,
      id: editingEntryId || `entry-${Date.now()}`,
      title,
      createdAt: entryDraft.createdAt || savedAt,
      updatedAt: savedAt,
      body: entryDraft.body.trim(),
    }

    onEntriesChange((currentEntries) =>
      editingEntryId
        ? currentEntries.map((entry) =>
            entry.id === editingEntryId ? savedEntry : entry,
          )
        : [savedEntry, ...currentEntries],
    )
    closeEditor()
  }

  if (journalMode === 'editor' && entryDraft) {
    return (
      <JournalEditor
        draft={entryDraft}
        hasUnsavedChanges={hasDraftChanged(entryDraft, initialEntryDraft)}
        moodOptions={moodOptions}
        onBack={closeEditor}
        onSave={saveEntry}
        onUpdateDraft={updateEntryDraft}
      />
    )
  }

  return (
    <div className="min-w-0">
      <header className="mb-[18px] flex items-end justify-between max-[720px]:mb-3.5">
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-muted-foreground max-[720px]:text-[11px]">
            Workspace
          </p>
          <h1 className="m-0 text-[30px] font-semibold leading-[1.1] tracking-normal text-foreground max-[720px]:text-[25px]">
            Journal
          </h1>
        </div>
      </header>

      <JournalToolbar
        activeFilterCount={activeFilterCount}
        createdDateRange={createdDateRange}
        favoriteFilter={favoriteFilter}
        filterOpen={filterOpen}
        filterRef={filterRef}
        moodOptions={moodOptions}
        onClearSelection={clearSelection}
        onClearFilters={clearFilters}
        onCreatedDateRangeChange={setCreatedDateRange}
        onDeleteSelected={deleteSelectedEntries}
        onDownloadSelected={downloadSelectedEntries}
        onFavoriteFilterChange={setFavoriteFilter}
        onNewEntry={openNewEntry}
        onSearchChange={setSearchQuery}
        onToggleFilter={() => setFilterOpen((open) => !open)}
        onToggleMood={(mood) => toggleListValue(mood, setSelectedMoods)}
        onUpdatedDateRangeChange={setUpdatedDateRange}
        searchQuery={searchQuery}
        selectedCount={selectedEntryIds.length}
        selectedMoods={selectedMoods}
        updatedDateRange={updatedDateRange}
      />

      <JournalTable
        allEntriesSelected={allEntriesSelected}
        entries={filteredEntries}
        onOpenEntry={openEntry}
        onToggleEntrySelection={toggleEntrySelection}
        onToggleFavorite={toggleFavorite}
        onToggleSelectAll={toggleSelectAll}
        onUpdateSort={updateSort}
        selectedEntryIds={selectedEntryIds}
        sortConfig={sortConfig}
        searchQuery={searchQuery}
      />
    </div>
  )
}

function hasDraftChanged(draft, initialDraft) {
  if (!draft || !initialDraft) {
    return false
  }

  return (
    draft.title !== initialDraft.title ||
    draft.body !== initialDraft.body ||
    draft.mood !== initialDraft.mood ||
    Boolean(draft.favorite) !== Boolean(initialDraft.favorite)
  )
}

function hasDateRange(range) {
  return Boolean(range?.from || range?.to)
}

function getStartOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function getEndOfDay(value) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function isDateInRange(value, range) {
  if (!hasDateRange(range)) {
    return true
  }

  const date = new Date(value)

  if (range.from && date < getStartOfDay(range.from)) {
    return false
  }

  if (range.to && date > getEndOfDay(range.to)) {
    return false
  }

  return true
}

export default JournalWorkspace
