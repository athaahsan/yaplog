import { useEffect, useRef, useState } from 'react'
import {
  loadMasterData,
  mergeMasterData,
  normalizeMasterData,
  saveMasterData,
  touchMasterData,
} from '@/lib/masterData'
import { upsertUserData } from '@/lib/yaplogUserData'

export function useMasterData() {
  const [masterData, setMasterData] = useState(() => loadMasterData())
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState('')
  const importInputRef = useRef(null)

  function updateMasterData(updater) {
    setMasterData((current) => {
      const nextData =
        typeof updater === 'function' ? updater(current) : updater
      return touchMasterData(normalizeMasterData(nextData))
    })
  }

  function updateSetting(key, value) {
    updateMasterData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value,
      },
    }))
  }

  function updateJournalEntries(updater) {
    updateMasterData((current) => {
      const currentEntries = current.journal.entries
      const nextEntries =
        typeof updater === 'function' ? updater(currentEntries) : updater

      return {
        ...current,
        journal: {
          ...current.journal,
          entries: nextEntries,
        },
      }
    })
  }

  function updateTaskItems(updater) {
    updateMasterData((current) => {
      const currentItems = current.tasks.items
      const nextItems =
        typeof updater === 'function' ? updater(currentItems) : updater

      return {
        ...current,
        tasks: {
          ...current.tasks,
          items: nextItems,
        },
      }
    })
  }

  function updateMemoItems(updater) {
    updateMasterData((current) => {
      const currentItems = current.memos.items
      const nextItems =
        typeof updater === 'function' ? updater(currentItems) : updater

      return {
        ...current,
        memos: {
          ...current.memos,
          items: nextItems,
        },
      }
    })
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(masterData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `yaplog-master-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function openImportPicker() {
    setImportError('')
    importInputRef.current?.click()
  }

  async function handleImportFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const fileText = await file.text()
      const importedData = normalizeMasterData(JSON.parse(fileText), {
        strict: true,
      })
      setPendingImport(importedData)
      setImportError('')
    } catch (error) {
      setPendingImport(null)
      setImportError(error.message || 'Could not import that JSON file.')
    }
  }

  function cancelImport() {
    setPendingImport(null)
  }

  function replaceWithImport() {
    setMasterData(pendingImport)
    setPendingImport(null)
    setImportError('')
  }

  function mergeImport() {
    setMasterData((current) => mergeMasterData(current, pendingImport))
    setPendingImport(null)
    setImportError('')
  }

  return {
    cancelImport,
    exportData,
    handleImportFileChange,
    importError,
    importInputRef,
    masterData,
    mergeImport,
    openImportPicker,
    pendingImport,
    replaceWithImport,
    setImportError,
    setMasterData,
    updateJournalEntries,
    updateMemoItems,
    updateSetting,
    updateTaskItems,
  }
}

export function useMasterDataPersistence({
  authLoading,
  authProfile,
  authUser,
  cloudReady,
  masterData,
  onSyncError,
}) {
  const cloudSaveTimeoutRef = useRef(null)

  useEffect(() => {
    window.clearTimeout(cloudSaveTimeoutRef.current)

    if (authLoading) {
      return undefined
    }

    if (authUser && cloudReady) {
      cloudSaveTimeoutRef.current = window.setTimeout(() => {
        upsertUserData(authUser, masterData, authProfile).catch((error) => {
          onSyncError(error.message || 'Could not sync your cloud data.')
        })
      }, 400)

      return () => window.clearTimeout(cloudSaveTimeoutRef.current)
    }

    saveMasterData(masterData)
    return undefined
  }, [authLoading, authProfile, authUser, cloudReady, masterData, onSyncError])
}
