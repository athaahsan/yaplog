import { Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import FilterPopover from './FilterPopover'

function JournalToolbar({
  activeFilterCount,
  createdDateRange,
  favoriteFilter,
  filterOpen,
  filterRef,
  moodOptions,
  onClearSelection,
  onClearFilters,
  onCreatedDateRangeChange,
  onDeleteSelected,
  onFavoriteFilterChange,
  onNewEntry,
  onSearchChange,
  onToggleFilter,
  onToggleMood,
  onUpdatedDateRangeChange,
  searchQuery,
  selectedCount,
  selectedMoods,
  updatedDateRange,
}) {
  if (selectedCount > 0) {
    return (
      <div className="relative mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-2 sm:flex">
        <div className="flex h-9 items-center text-sm font-semibold text-foreground">
          <span>{selectedCount} selected</span>
        </div>
        <Button
          variant="outline"
          size="default"
          type="button"
          aria-label="Clear selection"
          className="rounded-lg"
          onClick={onClearSelection}
        >
          <X size={16} />
          <span className="hidden sm:inline">Clear</span>
        </Button>
        <Button
          variant="destructive"
          size="default"
          type="button"
          aria-label="Delete selected entries"
          className="ml-auto rounded-lg"
          onClick={onDeleteSelected}
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex">
      <div className="relative" ref={filterRef}>
        <Button
          variant="outline"
          size="default"
          type="button"
          className={cn(
            'relative rounded-lg',
            activeFilterCount > 0 && 'bg-accent text-accent-foreground',
          )}
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          aria-label="Open journal filters"
          onClick={onToggleFilter}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {filterOpen && (
          <FilterPopover
            createdDateRange={createdDateRange}
            favoriteFilter={favoriteFilter}
            moodOptions={moodOptions}
            onClearFilters={onClearFilters}
            onCreatedDateRangeChange={onCreatedDateRangeChange}
            onFavoriteFilterChange={onFavoriteFilterChange}
            onToggleMood={onToggleMood}
            onUpdatedDateRangeChange={onUpdatedDateRangeChange}
            selectedMoods={selectedMoods}
            updatedDateRange={updatedDateRange}
          />
        )}
      </div>

      <label className="relative flex min-w-0 flex-1 items-center sm:min-w-[220px] sm:max-w-[360px]">
        <Search
          className="pointer-events-none absolute left-3 text-muted-foreground"
          size={16}
        />
        <Input
          type="search"
          placeholder="Search title..."
          className="h-9 rounded-lg bg-card pl-9 shadow-none"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <Button
        className="ml-auto rounded-lg"
        type="button"
        aria-label="New journal entry"
        onClick={onNewEntry}
      >
        <Plus size={16} />
        <span className="hidden sm:inline">New</span>
      </Button>
    </div>
  )
}

export default JournalToolbar
