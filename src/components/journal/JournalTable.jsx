import { ArrowDownUp, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDateTime } from '../../lib/dateTime'

const sortableColumns = {
  createdAt: 'Created time',
  title: 'Entry',
  updatedAt: 'Last edited time',
}

const checkboxClassName =
  "grid size-[17px] appearance-none place-items-center rounded border border-muted-foreground/35 bg-muted/20 after:size-[9px] after:rounded-[2px] after:bg-transparent after:content-[''] checked:border-muted-foreground/50 checked:bg-muted/20 checked:after:bg-foreground/60"

const headerCellClassName =
  'sticky top-0 z-20 h-10 whitespace-nowrap border-b border-border bg-background/72 px-3.5 text-left align-middle text-xs font-semibold text-muted-foreground backdrop-blur-md backdrop-saturate-150'

const bodyCellClassName =
  'h-[64px] whitespace-nowrap border-b border-border px-3.5 align-middle'

function normalizePreviewText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getBodyPreview(entry, searchQuery) {
  const body = normalizePreviewText(entry.body || '')
  const query = searchQuery.trim().toLowerCase()

  if (!body || !query) {
    return body
  }

  const matchIndex = body.toLowerCase().indexOf(query)

  if (matchIndex === -1) {
    return body
  }

  return `${matchIndex > 0 ? '...' : ''}${body.slice(matchIndex)}`
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

function JournalTable({
  allEntriesSelected,
  entries,
  onOpenEntry,
  onToggleEntrySelection,
  onToggleFavorite,
  onToggleSelectAll,
  onUpdateSort,
  searchQuery,
  selectedEntryIds,
  sortConfig,
}) {
  function renderSortableHeader(key) {
    const isActive = sortConfig.key === key
    const SortIcon = isActive
      ? sortConfig.direction === 'asc'
        ? ChevronUp
        : ChevronDown
      : ArrowDownUp

    return (
      <Button
        variant="ghost"
        size="xs"
        type="button"
        aria-label={`Sort by ${sortableColumns[key]}`}
        className={cn(
          'h-auto gap-1.5 rounded-none p-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground',
          isActive && 'text-foreground',
        )}
        onClick={() => onUpdateSort(key)}
      >
        <span>{sortableColumns[key]}</span>
        <SortIcon
          className={cn(
            'size-[13px] opacity-65',
            isActive && 'opacity-100',
          )}
        />
      </Button>
    )
  }

  function getSortDirection(key) {
    if (sortConfig.key !== key) {
      return 'none'
    }

    return sortConfig.direction === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="relative max-h-[calc(100dvh-174px)] overflow-auto rounded-lg border border-border bg-background [contain:layout_paint] [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_55%,transparent)_transparent] [scrollbar-width:thin] max-[720px]:max-h-[calc(100dvh-216px)] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
      <table className="w-full min-w-[760px] border-collapse text-sm text-foreground">
        <thead>
          <tr>
            <th
              className={cn(
                headerCellClassName,
                'left-0 z-40 w-11 cursor-pointer',
              )}
              onClick={onToggleSelectAll}
            >
              <input
                type="checkbox"
                aria-label="Select all journal entries"
                checked={allEntriesSelected}
                className={checkboxClassName}
                onChange={onToggleSelectAll}
                onClick={(event) => event.stopPropagation()}
              />
            </th>
            <th
              className={headerCellClassName}
              aria-sort={getSortDirection('title')}
            >
              {renderSortableHeader('title')}
            </th>
            <th className={headerCellClassName}>Mood</th>
            <th
              className={headerCellClassName}
              aria-sort={getSortDirection('createdAt')}
            >
              {renderSortableHeader('createdAt')}
            </th>
            <th
              className={headerCellClassName}
              aria-sort={getSortDirection('updatedAt')}
            >
              {renderSortableHeader('updatedAt')}
            </th>
            <th className={cn(headerCellClassName, 'w-12 text-center')}>
              <span className="sr-only">Favorite</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const selected = selectedEntryIds.includes(entry.id)
            const bodyPreview = getBodyPreview(entry, searchQuery)

            return (
              <tr
                className="group cursor-pointer outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                key={entry.id}
                tabIndex={0}
                onClick={() => onOpenEntry(entry)}
              >
                <td
                  className={cn(
                    bodyCellClassName,
                    'sticky left-0 z-30 w-11 cursor-pointer bg-background group-hover:bg-accent group-focus-visible:bg-accent',
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleEntrySelection(entry.id)
                  }}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${entry.title}`}
                    checked={selected}
                    className={checkboxClassName}
                    onChange={(event) => {
                      event.stopPropagation()
                      onToggleEntrySelection(entry.id)
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>
                <td
                  className={cn(
                    bodyCellClassName,
                    'w-[36%] min-w-60 text-foreground group-hover:text-inherit group-focus-visible:text-inherit',
                  )}
                >
                  <div className="grid min-w-0 gap-1">
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                      <HighlightedText query={searchQuery} text={entry.title} />
                    </span>
                    {bodyPreview && (
                      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal text-muted-foreground group-hover:text-muted-foreground group-focus-visible:text-muted-foreground">
                        <HighlightedText query={searchQuery} text={bodyPreview} />
                      </span>
                    )}
                  </div>
                </td>
                <td className={bodyCellClassName}>
                  <span
                    className="inline-grid size-7 place-items-center text-base leading-none"
                    aria-label="Mood"
                  >
                    {entry.mood}
                  </span>
                </td>
                <td className={bodyCellClassName}>
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className={bodyCellClassName}>
                  {formatDateTime(entry.updatedAt)}
                </td>
                <td className={cn(bodyCellClassName, 'w-12 text-center')}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    type="button"
                    aria-label={
                      entry.favorite
                        ? `Remove ${entry.title} from favorites`
                        : `Add ${entry.title} to favorites`
                    }
                    aria-pressed={entry.favorite}
                    className={cn(
                      'rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground',
                      entry.favorite && 'text-foreground',
                    )}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleFavorite(entry.id)
                    }}
                  >
                    <Star
                      className={cn(
                        'size-[17px]',
                        entry.favorite ? 'fill-current' : 'fill-transparent',
                      )}
                    />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {entries.length === 0 && (
        <div className="grid min-h-30 place-items-center border-t border-border text-sm text-muted-foreground">
          No entries found.
        </div>
      )}
    </div>
  )
}

export default JournalTable
