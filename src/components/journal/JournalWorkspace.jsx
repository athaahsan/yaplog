import { useEffect, useRef, useState } from 'react'
import { initialJournalEntries, moodOptions } from '../../data/journalSeed'
import {
  combineDateAndTime,
  getCurrentDateTimeParts,
  toDateInputValue,
  toDateTimeInputValue,
  toStoredDateTime,
  toTimeInputValue,
} from '../../lib/dateTime'
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
  const [selectedLocations, setSelectedLocations] = useState([])
  const [favoritedOnly, setFavoritedOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  const locationOptions = Array.from(
    new Set(journalEntries.map((entry) => entry.location || 'Not set')),
  )
  const activeFilterCount =
    selectedMoods.length + selectedLocations.length + (favoritedOnly ? 1 : 0)
  const filteredEntries = journalEntries.filter((entry) => {
    const location = entry.location || 'Not set'
    const matchesSearch = entry.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
    const matchesMood =
      selectedMoods.length === 0 || selectedMoods.includes(entry.mood)
    const matchesLocation =
      selectedLocations.length === 0 || selectedLocations.includes(location)
    const matchesFavorite = !favoritedOnly || entry.favorite

    return matchesSearch && matchesMood && matchesLocation && matchesFavorite
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

  useEffect(() => {
    if (journalMode !== 'editor' || !entryDraft?.useCurrentDateTime) {
      return undefined
    }

    const syncCurrentDateTime = () => {
      setEntryDraft((draft) =>
        draft?.useCurrentDateTime
          ? { ...draft, ...getCurrentDateTimeParts() }
          : draft,
      )
    }

    syncCurrentDateTime()
    const intervalId = window.setInterval(syncCurrentDateTime, 30000)

    return () => window.clearInterval(intervalId)
  }, [journalMode, entryDraft?.useCurrentDateTime])

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
    setSelectedLocations([])
    setFavoritedOnly(false)
  }

  function openNewEntry() {
    const now = getCurrentDateTimeParts()

    setEditingEntryId(null)
    setEntryDraft({
      title: '',
      body: '',
      date: now.date,
      time: now.time,
      useCurrentDateTime: true,
      mood: moodOptions[1],
      location: '',
      favorite: false,
    })
    setJournalMode('editor')
  }

  function openEntry(entry) {
    setEditingEntryId(entry.id)
    setEntryDraft({
      ...entry,
      date: toDateInputValue(toDateTimeInputValue(entry.dateTime)),
      time: toTimeInputValue(toDateTimeInputValue(entry.dateTime)),
      useCurrentDateTime: false,
    })
    setJournalMode('editor')
  }

  function updateEntryDraft(field, value) {
    setEntryDraft((draft) => ({ ...draft, [field]: value }))
  }

  function toggleCurrentDateTime() {
    setEntryDraft((draft) => {
      const nextUseCurrentDateTime = !draft.useCurrentDateTime

      if (!nextUseCurrentDateTime) {
        return { ...draft, useCurrentDateTime: false }
      }

      return {
        ...draft,
        ...getCurrentDateTimeParts(),
        useCurrentDateTime: true,
      }
    })
  }

  function closeEditor() {
    setJournalMode('table')
    setEditingEntryId(null)
    setEntryDraft(null)
  }

  function saveEntry() {
    const title = entryDraft.title.trim() || 'Untitled entry'
    const dateTime = entryDraft.useCurrentDateTime
      ? new Date().toISOString()
      : toStoredDateTime(combineDateAndTime(entryDraft.date, entryDraft.time))
    const savedEntry = {
      ...entryDraft,
      id: editingEntryId || `entry-${Date.now()}`,
      title,
      dateTime,
      location: entryDraft.location.trim(),
      body: entryDraft.body.trim(),
    }

    delete savedEntry.date
    delete savedEntry.time
    delete savedEntry.useCurrentDateTime

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
        onToggleCurrentDateTime={toggleCurrentDateTime}
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
        locationOptions={locationOptions}
        moodOptions={moodOptions}
        onClearFilters={clearFilters}
        onFavoritedOnlyChange={setFavoritedOnly}
        onNewEntry={openNewEntry}
        onSearchChange={setSearchQuery}
        onToggleFilter={() => setFilterOpen((open) => !open)}
        onToggleLocation={(location) =>
          toggleListValue(location, setSelectedLocations)
        }
        onToggleMood={(mood) => toggleListValue(mood, setSelectedMoods)}
        searchQuery={searchQuery}
        selectedLocations={selectedLocations}
        selectedMoods={selectedMoods}
      />

      <JournalTable
        allEntriesSelected={allEntriesSelected}
        entries={filteredEntries}
        onOpenEntry={openEntry}
        onToggleEntrySelection={toggleEntrySelection}
        onToggleFavorite={toggleFavorite}
        onToggleSelectAll={toggleSelectAll}
        selectedEntryIds={selectedEntryIds}
      />
    </div>
  )
}

export default JournalWorkspace
