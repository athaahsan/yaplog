import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Save, Star } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const moodNameMap = {
  '🤩': 'excited',
  '😊': 'happy',
  '😐': 'neutral',
  '😩': 'tired',
  '😢': 'sad',
  '😡': 'angry',
}

function JournalEditor({
  draft,
  moodOptions,
  onBack,
  onSave,
  onUpdateDraft,
}) {
  const bodyInputRef = useRef(null)
  const [isBodyEditing, setIsBodyEditing] = useState(false)

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.style.height = 'auto'
    bodyInput.style.height = `${bodyInput.scrollHeight}px`
  }, [draft.body, isBodyEditing])

  useEffect(() => {
    const bodyInput = bodyInputRef.current

    if (!bodyInput || !isBodyEditing) {
      return
    }

    bodyInput.focus()
    bodyInput.selectionStart = bodyInput.value.length
    bodyInput.selectionEnd = bodyInput.value.length
  }, [isBodyEditing])

  return (
    <div className="entry-editor">
      <header className="entry-editor-header">
        <button className="editor-back-button" type="button" onClick={onBack}>
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>
        <div className="editor-header-actions">
          <button
            className="editor-favorite-button icon-only"
            type="button"
            aria-pressed={draft.favorite}
            data-active={draft.favorite}
            onClick={() => onUpdateDraft('favorite', !draft.favorite)}
            title={draft.favorite ? "Unfavorite entry" : "Favorite entry"}
          >
            <Star size={18} className="star-icon" />
          </button>
          <button className="editor-save-button" type="button" onClick={onSave}>
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </header>

      <div className="entry-writing-surface">
        <input
          className="entry-title-input"
          type="text"
          value={draft.title}
          placeholder="Untitled entry"
          onChange={(event) => onUpdateDraft('title', event.target.value)}
        />
        <div className="entry-mood-picker" aria-label="Entry mood">
          {moodOptions.map((mood) => {
            const moodName = moodNameMap[mood] || 'default'
            return (
              <button
                className={`entry-mood-button mood-${moodName}`}
                type="button"
                aria-label={`${moodName} mood`}
                aria-pressed={draft.mood === mood}
                data-active={draft.mood === mood}
                data-mood={moodName}
                key={mood}
                onClick={() => onUpdateDraft('mood', mood)}
                title={moodName.charAt(0).toUpperCase() + moodName.slice(1)}
              >
                <span className="mood-emoji">{mood}</span>
              </button>
            )
          })}
        </div>
        <div className="entry-content-divider" aria-hidden="true" />
        {isBodyEditing ? (
          <textarea
            ref={bodyInputRef}
            className="entry-body-input"
            value={draft.body}
            placeholder="Start writing..."
            onBlur={() => setIsBodyEditing(false)}
            onChange={(event) => onUpdateDraft('body', event.target.value)}
          />
        ) : (
          <div
            className="entry-body-preview"
            role="textbox"
            tabIndex={0}
            aria-label="Journal content"
            onClick={() => setIsBodyEditing(true)}
            onFocus={() => setIsBodyEditing(true)}
          >
            {draft.body.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {draft.body}
              </ReactMarkdown>
            ) : (
              <p className="entry-body-placeholder">Start writing...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default JournalEditor
