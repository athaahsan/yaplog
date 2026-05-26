import { JOURNAL_BODY_MAX_CHARS } from '@/data/journalConfig'

export const MASTER_STORAGE_KEY = 'yaplog-master'

const LEGACY_THEME_KEY = 'yaplog-theme'
const LEGACY_FONT_KEY = 'yaplog-font'

const validThemes = new Set(['light', 'dark', 'system'])
const validFonts = new Set(['default', 'serif', 'mono'])
const validMoods = new Set(['😊', '😐', '😔', '🫩', '😰', '😡'])
const defaultMood = '😐'

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix = 'entry') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getLegacySetting(key, fallback, validValues) {
  const value = localStorage.getItem(key)
  return validValues.has(value) ? value : fallback
}

export function createDefaultMasterData(overrides = {}) {
  const createdAt = overrides.createdAt || nowIso()

  return {
    app: 'YapLog',
    schemaVersion: 1,
    createdAt,
    updatedAt: overrides.updatedAt || createdAt,
    settings: {
      theme: overrides.settings?.theme || 'system',
      font: overrides.settings?.font || 'default',
    },
    journal: {
      entries: overrides.journal?.entries || [],
    },
    tasks: {
      items: overrides.tasks?.items || [],
    },
    memos: {
      items: overrides.memos?.items || [],
    },
  }
}

export function normalizeMasterData(value, options = {}) {
  if (!isObject(value)) {
    throw new Error('The selected file is not a YapLog master JSON object.')
  }

  if (
    options.strict &&
    (value.app !== 'YapLog' || value.schemaVersion !== 1 || !isObject(value.journal))
  ) {
    throw new Error('That file does not look like a supported YapLog master JSON.')
  }

  const fallback = createDefaultMasterData()
  const sourceSettings = isObject(value.settings) ? value.settings : {}
  const sourceJournal = isObject(value.journal) ? value.journal : {}
  const sourceTasks = isObject(value.tasks) ? value.tasks : {}
  const sourceMemos = isObject(value.memos) ? value.memos : {}

  return {
    app: 'YapLog',
    schemaVersion: 1,
    createdAt:
      typeof value.createdAt === 'string' ? value.createdAt : fallback.createdAt,
    updatedAt:
      typeof value.updatedAt === 'string' ? value.updatedAt : fallback.updatedAt,
    settings: {
      theme: validThemes.has(sourceSettings.theme)
        ? sourceSettings.theme
        : fallback.settings.theme,
      font: validFonts.has(sourceSettings.font)
        ? sourceSettings.font
        : fallback.settings.font,
    },
    journal: {
      entries: normalizeEntries(sourceJournal.entries),
    },
    tasks: {
      items: Array.isArray(sourceTasks.items) ? sourceTasks.items : [],
    },
    memos: {
      items: Array.isArray(sourceMemos.items) ? sourceMemos.items : [],
    },
  }
}

export function loadMasterData() {
  const storedMaster = localStorage.getItem(MASTER_STORAGE_KEY)

  if (storedMaster) {
    try {
      return normalizeMasterData(JSON.parse(storedMaster))
    } catch {
      localStorage.removeItem(MASTER_STORAGE_KEY)
    }
  }

  const masterData = createDefaultMasterData({
    settings: {
      theme: getLegacySetting(LEGACY_THEME_KEY, 'system', validThemes),
      font: getLegacySetting(LEGACY_FONT_KEY, 'default', validFonts),
    },
  })

  saveMasterData(masterData)
  localStorage.removeItem(LEGACY_THEME_KEY)
  localStorage.removeItem(LEGACY_FONT_KEY)

  return masterData
}

export function saveMasterData(masterData) {
  localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(masterData))
}

export function mergeMasterData(currentMasterData, importedMasterData) {
  const current = normalizeMasterData(currentMasterData)
  const imported = normalizeMasterData(importedMasterData)
  const existingIds = new Set(current.journal.entries.map((entry) => entry.id))

  const importedEntries = imported.journal.entries.map((entry) => {
    if (!existingIds.has(entry.id)) {
      existingIds.add(entry.id)
      return entry
    }

    const nextEntry = { ...entry, id: createId('entry') }
    existingIds.add(nextEntry.id)
    return nextEntry
  })

  return {
    ...current,
    updatedAt: nowIso(),
    journal: {
      entries: [...current.journal.entries, ...importedEntries],
    },
  }
}

export function touchMasterData(masterData) {
  return {
    ...masterData,
    updatedAt: nowIso(),
  }
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  const usedIds = new Set()

  return entries
    .filter(isObject)
    .map((entry) => {
      const now = nowIso()
      const id =
        typeof entry.id === 'string' && entry.id.trim()
          ? entry.id.trim()
          : createId('entry')
      const uniqueId = usedIds.has(id) ? createId('entry') : id

      usedIds.add(uniqueId)

      return {
        id: uniqueId,
        title:
          typeof entry.title === 'string' && entry.title.trim()
            ? entry.title
            : 'Untitled entry',
        body:
          typeof entry.body === 'string'
            ? entry.body.slice(0, JOURNAL_BODY_MAX_CHARS)
            : '',
        mood: validMoods.has(entry.mood) ? entry.mood : defaultMood,
        favorite: Boolean(entry.favorite),
        createdAt:
          typeof entry.createdAt === 'string' && entry.createdAt
            ? entry.createdAt
            : now,
        updatedAt:
          typeof entry.updatedAt === 'string' && entry.updatedAt
            ? entry.updatedAt
            : entry.createdAt || now,
      }
    })
}
