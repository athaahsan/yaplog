import { Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import FilterPopover from './FilterPopover'

function JournalToolbar({
  activeFilterCount,
  favoritedOnly,
  filterOpen,
  filterRef,
  moodOptions,
  onClearSelection,
  onClearFilters,
  onDeleteSelected,
  onFavoritedOnlyChange,
  onNewEntry,
  onSearchChange,
  onToggleFilter,
  onToggleMood,
  searchQuery,
  selectedCount,
  selectedMoods,
}) {
  if (selectedCount > 0) {
    return (
      <div className="journal-toolbar selection-toolbar">
        <div className="selection-summary">
          <span>{selectedCount} selected</span>
        </div>
        <button
          className="toolbar-button"
          type="button"
          onClick={onClearSelection}
        >
          <X size={16} />
          <span>Clear</span>
        </button>
        <button
          className="delete-selection-button"
          type="button"
          onClick={onDeleteSelected}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    )
  }

  return (
    <div className="journal-toolbar">
      <div className="filter-control" ref={filterRef}>
        <button
          className="toolbar-button"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          data-active={activeFilterCount > 0}
          onClick={onToggleFilter}
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
          )}
        </button>

        {filterOpen && (
          <FilterPopover
            favoritedOnly={favoritedOnly}
            moodOptions={moodOptions}
            onClearFilters={onClearFilters}
            onFavoritedOnlyChange={onFavoritedOnlyChange}
            onToggleMood={onToggleMood}
            selectedMoods={selectedMoods}
          />
        )}
      </div>

      <label className="search-field">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search title..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <button className="new-entry-button" type="button" onClick={onNewEntry}>
        <Plus size={16} />
        <span>New</span>
      </button>
    </div>
  )
}

export default JournalToolbar
