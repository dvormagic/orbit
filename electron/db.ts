import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Determine the paths
const userDataPath = app.getPath('userData')
const dbName = 'database.db'
const productionDbPath = path.join(userDataPath, dbName)
const logPath = path.join(userDataPath, 'debug.log')

// Helper for early logging
const log = (msg: string) => {
  try {
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`)
  } catch (e) {
    console.error('Logging failed:', e)
  }
}

log('--- ORBIT DB INIT ---')
log(`NODE_ENV: ${process.env.NODE_ENV}`)
log(`isPackaged: ${app.isPackaged}`)
log(`userDataPath: ${userDataPath}`)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Dev DB path (from project root)
const devDbPath = path.join(__dirname, '..', 'prisma', 'dev.db')

// Template DB path candidates in packaged apps (extraResources can land in different places)
const templateDbCandidates = [
  path.join(process.resourcesPath, 'prisma', 'dev.db'),
  path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db'),
  path.join(app.getAppPath(), 'prisma', 'dev.db'),
]

const templateDbPath = isDev
  ? devDbPath
  : (templateDbCandidates.find(p => fs.existsSync(p)) ?? templateDbCandidates[0])

log(`devDbPath: ${devDbPath}`)
log(`templateDbPath: ${templateDbPath}`)

const dbPath = isDev ? devDbPath : productionDbPath

log(`Final dbPath used: ${dbPath}`)

// Handle Production DB Copying
if (app.isPackaged && !fs.existsSync(productionDbPath)) {
  log('Production DB not found. Attempting to initialize from template...')
  try {
    if (fs.existsSync(templateDbPath)) {
      fs.copyFileSync(templateDbPath, productionDbPath)
      log('SUCCESS: Database copied from template.')
      try {
        // Best-effort: on Windows this can be a no-op or throw.
        fs.chmodSync(productionDbPath, 0o666)
        log('SUCCESS: Database permissions set.')
      } catch (err) {
        log(`WARN: chmod failed (non-fatal): ${err}`)
      }
    } else {
      log(`FATAL: Template database NOT FOUND. Looked at: ${templateDbCandidates.join(' | ')}`)
      log('FATAL: The app may not function correctly until a template DB is packaged.')
    }
  } catch (err) {
    log(`FATAL ERROR copying DB: ${err}`)
  }
} else if (app.isPackaged) {
  log('Production DB already exists.')
}

const prisma = new PrismaClient({
  datasourceUrl: `file:${dbPath}`,
} as any)

export default prisma
