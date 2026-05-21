import { ArrowLeft, Save, Star, TimerReset } from 'lucide-react'

function JournalEditor({
  draft,
  moodOptions,
  onBack,
  onSave,
  onToggleCurrentDateTime,
  onUpdateDraft,
}) {
  return (
    <div className="entry-editor">
      <header className="entry-editor-header">
        <button className="editor-back-button" type="button" onClick={onBack}>
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>
        <button className="editor-save-button" type="button" onClick={onSave}>
          <Save size={16} />
          <span>Save</span>
        </button>
      </header>

      <div className="entry-meta-bar">
        <div className="meta-field date-time-meta-field">
          <span>Date and time</span>
          <div className="date-time-controls">
            <input
              type="date"
              value={draft.date}
              disabled={draft.useCurrentDateTime}
              onChange={(event) => onUpdateDraft('date', event.target.value)}
            />
            <input
              type="time"
              value={draft.time}
              disabled={draft.useCurrentDateTime}
              onChange={(event) => onUpdateDraft('time', event.target.value)}
            />
            <button
              className="current-time-toggle"
              type="button"
              aria-pressed={draft.useCurrentDateTime}
              data-active={draft.useCurrentDateTime}
              onClick={onToggleCurrentDateTime}
            >
              <TimerReset size={15} />
              <span>Current time</span>
              <span className="toggle-pill" aria-hidden="true">
                {draft.useCurrentDateTime ? 'On' : 'Off'}
              </span>
            </button>
          </div>
        </div>

        <div className="meta-field mood-meta-field">
          <span>Mood</span>
          <div className="entry-mood-picker">
            {moodOptions.map((mood) => (
              <button
                className="entry-mood-button"
                type="button"
                aria-pressed={draft.mood === mood}
                data-active={draft.mood === mood}
                key={mood}
                onClick={() => onUpdateDraft('mood', mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <label className="meta-field location-meta-field">
          <span>Location</span>
          <input
            type="text"
            value={draft.location}
            placeholder="Not set"
            onChange={(event) => onUpdateDraft('location', event.target.value)}
          />
        </label>

        <button
          className="editor-favorite-button"
          type="button"
          aria-pressed={draft.favorite}
          data-active={draft.favorite}
          onClick={() => onUpdateDraft('favorite', !draft.favorite)}
        >
          <Star size={18} fill="currentColor" />
          <span>Favorite</span>
        </button>
      </div>

      <div className="entry-writing-surface">
        <input
          className="entry-title-input"
          type="text"
          value={draft.title}
          placeholder="Untitled entry"
          onChange={(event) => onUpdateDraft('title', event.target.value)}
        />
        <textarea
          className="entry-body-input"
          value={draft.body}
          placeholder="Start writing..."
          onChange={(event) => onUpdateDraft('body', event.target.value)}
        />
      </div>
    </div>
  )
}

export default JournalEditor
