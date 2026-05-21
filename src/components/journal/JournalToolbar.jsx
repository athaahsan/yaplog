import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import FilterPopover from './FilterPopover'

function JournalToolbar({
  activeFilterCount,
  favoritedOnly,
  filterOpen,
  filterRef,
  locationOptions,
  moodOptions,
  onClearFilters,
  onFavoritedOnlyChange,
  onNewEntry,
  onSearchChange,
  onToggleFilter,
  onToggleLocation,
  onToggleMood,
  searchQuery,
  selectedLocations,
  selectedMoods,
}) {
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
            locationOptions={locationOptions}
            moodOptions={moodOptions}
            onClearFilters={onClearFilters}
            onFavoritedOnlyChange={onFavoritedOnlyChange}
            onToggleLocation={onToggleLocation}
            onToggleMood={onToggleMood}
            selectedLocations={selectedLocations}
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
        <span>New entry</span>
      </button>
    </div>
  )
}

export default JournalToolbar
