export const appRouteMap = {
  Dashboard: '/dashboard',
  Journal: '/journal',
  Calendar: '/calendar',
  Tasks: '/tasks',
  Notes: '/notes',
}

export function getActiveAppFromPath(pathname) {
  if (pathname.startsWith('/dashboard')) {
    return 'Dashboard'
  }

  if (pathname.startsWith('/calendar')) {
    return 'Calendar'
  }

  if (pathname.startsWith('/tasks')) {
    return 'Tasks'
  }

  if (pathname.startsWith('/notes') || pathname.startsWith('/memos')) {
    return 'Notes'
  }

  return 'Journal'
}

export function getJournalEntryRoute(entryId) {
  if (entryId === 'new') {
    return '/journal/new'
  }

  return `/journal/${encodeURIComponent(entryId)}`
}

export function getBreadcrumbItems(pathname, masterData) {
  const items = [{ label: 'Home', path: '/dashboard' }]

  if (pathname.startsWith('/dashboard')) {
    return items
  }

  if (pathname.startsWith('/calendar')) {
    return [...items, { label: 'Calendar', path: '/calendar' }]
  }

  if (pathname.startsWith('/tasks')) {
    return [...items, { label: 'Tasks', path: '/tasks' }]
  }

  if (pathname.startsWith('/notes') || pathname.startsWith('/memos')) {
    return [...items, { label: 'Notes', path: '/notes' }]
  }

  if (pathname === '/journal/new') {
    return [
      ...items,
      { label: 'Journal', path: '/journal' },
      { label: 'New entry' },
    ]
  }

  if (pathname.startsWith('/journal/')) {
    const entryId = decodeURIComponent(pathname.slice('/journal/'.length))
    const entry = masterData.journal.entries.find((item) => item.id === entryId)

    return [
      ...items,
      { label: 'Journal', path: '/journal' },
      { label: entry?.title?.trim() || 'Entry' },
    ]
  }

  return [...items, { label: 'Journal', path: '/journal' }]
}
