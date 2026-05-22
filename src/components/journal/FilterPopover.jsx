import { format } from 'date-fns'
import { CalendarIcon, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

function FilterPopover({
  createdDateRange,
  favoriteFilter,
  moodOptions,
  onClearFilters,
  onCreatedDateRangeChange,
  onFavoriteFilterChange,
  onToggleMood,
  onUpdatedDateRangeChange,
  selectedMoods,
  updatedDateRange,
}) {
  return (
    <div
      className="absolute left-0 top-[calc(100%+8px)] z-20 max-h-[min(620px,calc(100dvh-140px))] w-[min(320px,calc(100vw-24px))] overflow-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-[0_18px_48px_oklch(0_0_0/18%)] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
      role="dialog"
      aria-label="Journal filters"
    >
      <div className="mb-3 flex items-center justify-between border-b border-border pb-3 text-sm font-semibold">
        <span>Filters</span>
        <Button
          variant="ghost"
          size="xs"
          type="button"
          className="h-auto px-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={onClearFilters}
        >
          Clear
        </Button>
      </div>

      <section
        className="grid gap-2 py-2"
        aria-labelledby="mood-filter-heading"
      >
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="mood-filter-heading"
        >
          Mood
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {moodOptions.map((mood) => {
            const active = selectedMoods.includes(mood)

            return (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-[34px] rounded-lg border border-border bg-transparent text-lg hover:bg-accent',
                  active &&
                    'border-primary/70 bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_42%,transparent)]',
                )}
                type="button"
                aria-pressed={active}
                key={mood}
                onClick={() => onToggleMood(mood)}
              >
                {mood}
              </Button>
            )
          })}
        </div>
      </section>

      <section
        className="grid gap-2 py-2"
        aria-labelledby="created-date-filter-heading"
      >
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="created-date-filter-heading"
        >
          Created time
        </h2>
        <DateRangeControl
          label="created time"
          range={createdDateRange}
          onRangeChange={onCreatedDateRangeChange}
        />
      </section>

      <section
        className="grid gap-2 py-2"
        aria-labelledby="updated-date-filter-heading"
      >
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="updated-date-filter-heading"
        >
          Last edited time
        </h2>
        <DateRangeControl
          label="last edited time"
          range={updatedDateRange}
          onRangeChange={onUpdatedDateRangeChange}
        />
      </section>

      <section
        className="grid gap-2 py-2"
        aria-labelledby="favorite-filter-heading"
      >
        <h2
          className="m-0 text-xs font-semibold text-muted-foreground"
          id="favorite-filter-heading"
        >
          Favorite
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <FavoriteFilterButton
            active={favoriteFilter === 'favorited'}
            label="Favorited entries"
            onClick={() =>
              onFavoriteFilterChange(
                favoriteFilter === 'favorited' ? 'all' : 'favorited',
              )
            }
          />
          <FavoriteFilterButton
            active={favoriteFilter === 'unfavorited'}
            label="Not favorited entries"
            onClick={() =>
              onFavoriteFilterChange(
                favoriteFilter === 'unfavorited' ? 'all' : 'unfavorited',
              )
            }
            variant="outline"
          />
        </div>
      </section>
    </div>
  )
}

function FavoriteFilterButton({ active, label, onClick, variant = 'filled' }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'size-[34px] rounded-lg border border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
        active &&
          'border-primary/70 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_42%,transparent)]',
      )}
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      <Star
        size={17}
        fill={variant === 'filled' ? 'currentColor' : 'none'}
      />
    </Button>
  )
}

function DateRangeControl({ label, range, onRangeChange }) {
  const hasRange = Boolean(range?.from || range?.to)

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className={cn(
                'min-w-0 flex-1 justify-start rounded-lg px-2.5 text-left font-normal',
                !hasRange && 'text-muted-foreground',
              )}
            >
              <CalendarIcon size={15} />
              <span className="truncate">{formatDateRange(range)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
            <Calendar
              mode="range"
              selected={range}
              onSelect={onRangeChange}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        {hasRange && (
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label={`Clear ${label} range`}
            className="rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => onRangeChange(undefined)}
          >
            <X size={15} />
          </Button>
        )}
      </div>
    </div>
  )
}

function formatDateRange(range) {
  if (!range?.from && !range?.to) {
    return 'Pick date range'
  }

  if (range.from && range.to) {
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`
  }

  if (range.from) {
    return `From ${format(range.from, 'MMM d, yyyy')}`
  }

  return `Until ${format(range.to, 'MMM d, yyyy')}`
}

export default FilterPopover
