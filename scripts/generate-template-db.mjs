import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const dbPath = path.join(projectRoot, 'prisma', 'dev.db')
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma')
const prismaBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
)

const rmIfExists = (p) => {
  try {
    fs.rmSync(p, { force: true })
  } catch {
    // ignore
  }
}

console.log('[orbit] Generating template database (empty)…')
rmIfExists(dbPath)
rmIfExists(`${dbPath}-journal`)
rmIfExists(`${dbPath}-wal`)
rmIfExists(`${dbPath}-shm`)

const res = spawnSync(prismaBin, ['migrate', 'deploy', '--schema', schemaPath], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    // Prisma resolves SQLite relative paths from the schema directory (./prisma)
    // so `file:./dev.db` becomes `prisma/dev.db` in the project root.
    DATABASE_URL: 'file:./dev.db',
  },
})

if (res.status !== 0) {
  process.exit(res.status ?? 1)
}

if (!fs.existsSync(dbPath)) {
  console.error('[orbit] ERROR: Template database was not created at prisma/dev.db')
  process.exit(1)
}

console.log('[orbit] Template database ready: prisma/dev.db')


