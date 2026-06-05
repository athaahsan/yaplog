import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import JournalWorkspace from './journal/JournalWorkspace'
import PlaceholderWorkspace from './PlaceholderWorkspace'

function AppRoutes({
  authScopeKey,
  entries,
  onEntriesChange,
  voiceInputEnabled,
  voiceInputUserId,
}) {
  const location = useLocation()
  const journalRedirect = {
    pathname: '/journal',
    search: location.search,
    hash: location.hash,
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={journalRedirect} replace />} />
      <Route
        path="/journal"
        element={
          <JournalWorkspace
            entries={entries}
            key={authScopeKey}
            onEntriesChange={onEntriesChange}
            voiceInputEnabled={voiceInputEnabled}
            voiceInputUserId={voiceInputUserId}
          />
        }
      />
      <Route
        path="/journal/new"
        element={
          <JournalWorkspace
            entries={entries}
            key={`${authScopeKey}-new`}
            onEntriesChange={onEntriesChange}
            voiceInputEnabled={voiceInputEnabled}
            voiceInputUserId={voiceInputUserId}
          />
        }
      />
      <Route
        path="/journal/:entryId"
        element={
          <JournalWorkspace
            entries={entries}
            key={authScopeKey}
            onEntriesChange={onEntriesChange}
            voiceInputEnabled={voiceInputEnabled}
            voiceInputUserId={voiceInputUserId}
          />
        }
      />
      <Route
        path="/calendar"
        element={<PlaceholderWorkspace activeApp="Calendar" />}
      />
      <Route
        path="/tasks"
        element={<PlaceholderWorkspace activeApp="Tasks" />}
      />
      <Route
        path="/notes"
        element={<PlaceholderWorkspace activeApp="Notes" />}
      />
      <Route path="/memos" element={<Navigate to="/notes" replace />} />
      <Route path="*" element={<Navigate to="/journal" replace />} />
    </Routes>
  )
}

export default AppRoutes
