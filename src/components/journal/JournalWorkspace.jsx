import { useEffect, useRef, useState } from 'react'
import { initialJournalEntries, moodOptions } from '../../data/journalSeed'
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

function JournalWorkspace() {
  const [journalMode, setJournalMode] = useState('table')
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [entryDraft, setEntryDraft] = useState(null)
  const [selectedEntryIds, setSelectedEntryIds] = useState([])
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMoods, setSelectedMoods] = useState([])
  const [favoritedOnly, setFavoritedOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState({
    direction: 'desc',
    key: 'createdAt',
  })
  const filterRef = useRef(null)

  const activeFilterCount = selectedMoods.length + (favoritedOnly ? 1 : 0)
  const filteredEntries = journalEntries
    .filter((entry) => {
      const matchesSearch = entry.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
      const matchesMood =
        selectedMoods.length === 0 || selectedMoods.includes(entry.mood)
      const matchesFavorite = !favoritedOnly || entry.favorite

      return matchesSearch && matchesMood && matchesFavorite
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
      if (!filterRef.current?.contains(event.target)) {
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
    setJournalEntries((entries) =>
      entries.map((entry) =>
        entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry,
      ),
    )
  }

  function clearFilters() {
    setSelectedMoods([])
    setFavoritedOnly(false)
  }

  function clearSelection() {
    setSelectedEntryIds([])
  }

  function deleteSelectedEntries() {
    setJournalEntries((entries) =>
      entries.filter((entry) => !selectedEntryIds.includes(entry.id)),
    )
    setSelectedEntryIds([])
  }

  function updateSort(nextKey) {
    setSortConfig((current) => ({
      direction:
        current.key === nextKey && current.direction === 'asc' ? 'desc' : 'asc',
      key: nextKey,
    }))
  }

  function openNewEntry() {
    setEditingEntryId(null)
    setEntryDraft({
      title: '',
      body: '',
      mood: moodOptions[1],
      favorite: false,
    })
    setJournalMode('editor')
  }

  function openEntry(entry) {
    setEditingEntryId(entry.id)
    setEntryDraft(entry)
    setJournalMode('editor')
  }

  function updateEntryDraft(field, value) {
    setEntryDraft((draft) => ({ ...draft, [field]: value }))
  }

  function closeEditor() {
    setJournalMode('table')
    setEditingEntryId(null)
    setEntryDraft(null)
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

    setJournalEntries((entries) =>
      editingEntryId
        ? entries.map((entry) => (entry.id === editingEntryId ? savedEntry : entry))
        : [savedEntry, ...entries],
    )
    closeEditor()
  }

  if (journalMode === 'editor' && entryDraft) {
    return (
      <JournalEditor
        draft={entryDraft}
        moodOptions={moodOptions}
        onBack={closeEditor}
        onSave={saveEntry}
        onUpdateDraft={updateEntryDraft}
      />
    )
  }

  return (
    <div className="journal-view">
      <header className="workspace-header">
        <div>
          <p className="section-kicker">Workspace</p>
          <h1>Journal</h1>
        </div>
      </header>

      <JournalToolbar
        activeFilterCount={activeFilterCount}
        favoritedOnly={favoritedOnly}
        filterOpen={filterOpen}
        filterRef={filterRef}
        moodOptions={moodOptions}
        onClearSelection={clearSelection}
        onClearFilters={clearFilters}
        onDeleteSelected={deleteSelectedEntries}
        onFavoritedOnlyChange={setFavoritedOnly}
        onNewEntry={openNewEntry}
        onSearchChange={setSearchQuery}
        onToggleFilter={() => setFilterOpen((open) => !open)}
        onToggleMood={(mood) => toggleListValue(mood, setSelectedMoods)}
        searchQuery={searchQuery}
        selectedCount={selectedEntryIds.length}
        selectedMoods={selectedMoods}
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
      />
    </div>
  )
}

export default JournalWorkspace
