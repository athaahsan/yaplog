import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const redirectsPath = resolve(projectRoot, 'dist', '_redirects')

const redirects = [
  '/api/* /.netlify/functions/:splat 200',
  '/* /index.html 200',
  '',
].join('\n')

await mkdir(dirname(redirectsPath), { recursive: true })
await writeFile(redirectsPath, redirects, 'utf8')
