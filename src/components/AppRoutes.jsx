import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardWorkspace from './dashboard/DashboardWorkspace'
import JournalWorkspace from './journal/JournalWorkspace'
import NotesWorkspace from './notes/NotesWorkspace'
import PlaceholderWorkspace from './PlaceholderWorkspace'
import TasksWorkspace from './tasks/TasksWorkspace'

function AppRoutes({
  authScopeKey,
  entries,
  onEntriesChange,
  memoItems,
  onMemoItemsChange,
  onTaskItemsChange,
  taskItems,
  voiceInputEnabled,
  voiceInputUserId,
}) {
  const location = useLocation()
  const dashboardRedirect = {
    pathname: '/dashboard',
    search: location.search,
    hash: location.hash,
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={dashboardRedirect} replace />} />
      <Route
        path="/dashboard"
        element={
          <DashboardWorkspace
            entries={entries}
            memoItems={memoItems}
            taskItems={taskItems}
          />
        }
      />
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
        element={
          <TasksWorkspace
            items={taskItems}
            onItemsChange={onTaskItemsChange}
          />
        }
      />
      <Route
        path="/notes"
        element={
          <NotesWorkspace
            items={memoItems}
            onItemsChange={onMemoItemsChange}
          />
        }
      />
      <Route path="/memos" element={<Navigate to="/notes" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
