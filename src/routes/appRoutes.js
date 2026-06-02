export const appRouteMap = {
  Journal: '/journal',
  Calendar: '/calendar',
  Tasks: '/tasks',
  Memos: '/memos',
}

export function getActiveAppFromPath(pathname) {
  if (pathname.startsWith('/calendar')) {
    return 'Calendar'
  }

  if (pathname.startsWith('/tasks')) {
    return 'Tasks'
  }

  if (pathname.startsWith('/memos')) {
    return 'Memos'
  }

  return 'Journal'
}

export function getJournalEntryRoute(entryId) {
  if (entryId === 'new') {
    return '/journal/new'
  }

  return `/journal/${encodeURIComponent(entryId)}`
}
