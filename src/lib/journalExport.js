const textEncoder = new TextEncoder()

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }

  return crc >>> 0
})

function crc32(bytes) {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff)
}

function writeUint32(bytes, value) {
  bytes.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  )
}

function writeBytes(bytes, value) {
  bytes.push(...value)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeYamlString(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'untitled-entry'
}

function getUniqueFilename(entry, usedFilenames) {
  const baseName = slugify(entry.title || 'Untitled entry')
  let filename = `${baseName}.md`
  let suffix = 2

  while (usedFilenames.has(filename)) {
    filename = `${baseName}-${suffix}.md`
    suffix += 1
  }

  usedFilenames.add(filename)
  return filename
}

export function createJournalMarkdown(entry) {
  const title = entry.title || 'Untitled entry'

  return `---\ntitle: "${escapeYamlString(title)}"\nmood: "${escapeYamlString(entry.mood || '')}"\nfavorite: ${Boolean(entry.favorite)}\ncreatedAt: "${escapeYamlString(entry.createdAt || '')}"\nupdatedAt: "${escapeYamlString(entry.updatedAt || '')}"\n---\n\n# ${title}\n\n${entry.body || ''}\n`
}

export function downloadMarkdownEntry(entry) {
  const markdown = createJournalMarkdown(entry)
  const filename = getUniqueFilename(entry, new Set())

  downloadBlob(
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    filename,
  )
}

export function downloadMarkdownEntriesZip(entries) {
  const usedFilenames = new Set()
  const files = entries.map((entry) => ({
    name: getUniqueFilename(entry, usedFilenames),
    bytes: textEncoder.encode(createJournalMarkdown(entry)),
  }))
  const zipBytes = createZip(files)
  const date = new Date().toISOString().slice(0, 10)

  downloadBlob(
    new Blob([zipBytes], { type: 'application/zip' }),
    `yaplog-journal-export-${date}.zip`,
  )
}

function createZip(files) {
  const bytes = []
  const centralDirectory = []

  for (const file of files) {
    const filenameBytes = textEncoder.encode(file.name)
    const fileCrc = crc32(file.bytes)
    const localHeaderOffset = bytes.length

    writeUint32(bytes, 0x04034b50)
    writeUint16(bytes, 20)
    writeUint16(bytes, 0x0800)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint32(bytes, fileCrc)
    writeUint32(bytes, file.bytes.length)
    writeUint32(bytes, file.bytes.length)
    writeUint16(bytes, filenameBytes.length)
    writeUint16(bytes, 0)
    writeBytes(bytes, filenameBytes)
    writeBytes(bytes, file.bytes)

    centralDirectory.push({
      crc: fileCrc,
      compressedSize: file.bytes.length,
      filenameBytes,
      localHeaderOffset,
      uncompressedSize: file.bytes.length,
    })
  }

  const centralDirectoryOffset = bytes.length

  for (const file of centralDirectory) {
    writeUint32(bytes, 0x02014b50)
    writeUint16(bytes, 20)
    writeUint16(bytes, 20)
    writeUint16(bytes, 0x0800)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint32(bytes, file.crc)
    writeUint32(bytes, file.compressedSize)
    writeUint32(bytes, file.uncompressedSize)
    writeUint16(bytes, file.filenameBytes.length)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint16(bytes, 0)
    writeUint32(bytes, 0)
    writeUint32(bytes, file.localHeaderOffset)
    writeBytes(bytes, file.filenameBytes)
  }

  const centralDirectorySize = bytes.length - centralDirectoryOffset

  writeUint32(bytes, 0x06054b50)
  writeUint16(bytes, 0)
  writeUint16(bytes, 0)
  writeUint16(bytes, files.length)
  writeUint16(bytes, files.length)
  writeUint32(bytes, centralDirectorySize)
  writeUint32(bytes, centralDirectoryOffset)
  writeUint16(bytes, 0)

  return new Uint8Array(bytes)
}
