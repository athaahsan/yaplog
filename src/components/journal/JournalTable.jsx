import { Star } from 'lucide-react'
import { formatDateTime } from '../../lib/dateTime'

function JournalTable({
  allEntriesSelected,
  entries,
  onOpenEntry,
  onToggleEntrySelection,
  onToggleFavorite,
  onToggleSelectAll,
  selectedEntryIds,
}) {
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
            <th>Title</th>
            <th>Date and time</th>
            <th>Mood</th>
            <th>Location</th>
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
              <td className="select-column">
                <input
                  type="checkbox"
                  aria-label={`Select ${entry.title}`}
                  checked={selectedEntryIds.includes(entry.id)}
                  onChange={() => onToggleEntrySelection(entry.id)}
                  onClick={(event) => event.stopPropagation()}
                />
              </td>
              <td className="entry-title">{entry.title}</td>
              <td>{formatDateTime(entry.dateTime)}</td>
              <td>
                <span className="mood-tag" aria-label="Mood">
                  {entry.mood}
                </span>
              </td>
              <td className="muted-cell">{entry.location || 'Not set'}</td>
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
