import { ArrowDownUp, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { formatDateTime } from '../../lib/dateTime'

const sortableColumns = {
  createdAt: 'Created time',
  title: 'Title',
  updatedAt: 'Last edited time',
}

function JournalTable({
  allEntriesSelected,
  entries,
  onOpenEntry,
  onToggleEntrySelection,
  onToggleFavorite,
  onToggleSelectAll,
  onUpdateSort,
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
      <button
        className="sortable-header-button"
        type="button"
        aria-label={`Sort by ${sortableColumns[key]}`}
        data-active={isActive}
        onClick={() => onUpdateSort(key)}
      >
        <span>{sortableColumns[key]}</span>
        <SortIcon size={13} />
      </button>
    )
  }

  function getSortDirection(key) {
    if (sortConfig.key !== key) {
      return 'none'
    }

    return sortConfig.direction === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="journal-table-wrap">
      <table className="journal-table">
        <thead>
          <tr>
            <th className="select-column">
              <input
                type="checkbox"
                aria-label="Select all journal entries"
                checked={allEntriesSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th aria-sort={getSortDirection('title')}>
              {renderSortableHeader('title')}
            </th>
            <th>Mood</th>
            <th aria-sort={getSortDirection('createdAt')}>
              {renderSortableHeader('createdAt')}
            </th>
            <th aria-sort={getSortDirection('updatedAt')}>
              {renderSortableHeader('updatedAt')}
            </th>
            <th className="favorite-column">
              <span className="sr-only">Favorite</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              className="journal-row"
              key={entry.id}
              tabIndex={0}
              onClick={() => onOpenEntry(entry)}
            >
              <td
                className="select-column"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleEntrySelection(entry.id)
                }}
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${entry.title}`}
                  checked={selectedEntryIds.includes(entry.id)}
                  onChange={(event) => {
                    event.stopPropagation()
                    onToggleEntrySelection(entry.id)
                  }}
                  onClick={(event) => event.stopPropagation()}
                />
              </td>
              <td className="entry-title">{entry.title}</td>
              <td>
                <span className="mood-tag" aria-label="Mood">
                  {entry.mood}
                </span>
              </td>
              <td>{formatDateTime(entry.createdAt)}</td>
              <td>{formatDateTime(entry.updatedAt)}</td>
              <td className="favorite-column">
                <button
                  className="favorite-button"
                  type="button"
                  aria-label={
                    entry.favorite
                      ? `Remove ${entry.title} from favorites`
                      : `Add ${entry.title} to favorites`
                  }
                  aria-pressed={entry.favorite}
                  data-active={entry.favorite}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleFavorite(entry.id)
                  }}
                >
                  <Star size={17} fill="currentColor" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <div className="table-empty-state">No entries found.</div>
      )}
    </div>
  )
}

export default JournalTable
