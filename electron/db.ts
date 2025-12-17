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

// Source DB path (from project root in dev, or from app resources in prod)
const sourceDbPath = (process.env.NODE_ENV === 'development' || !app.isPackaged)
    ? path.join(__dirname, '..', 'prisma', 'dev.db')
    : path.join(process.resourcesPath, 'prisma', 'dev.db')

log(`Source DB Path: ${sourceDbPath}`)

const dbPath = (process.env.NODE_ENV === 'development' || !app.isPackaged)
    ? sourceDbPath
    : productionDbPath

log(`Final dbPath used: ${dbPath}`)

// Handle Production DB Copying
if (app.isPackaged && !fs.existsSync(productionDbPath)) {
    log('Production DB not found. Attempting to copy from template...')
    try {
        if (fs.existsSync(sourceDbPath)) {
            fs.copyFileSync(sourceDbPath, productionDbPath)
            log('SUCCESS: Database copied from template.')
            // Verify permissions
            fs.chmodSync(productionDbPath, 0o666)
            log('SUCCESS: Database permissions set.')
        } else {
            log(`FATAL ERROR: Template database NOT FOUND at ${sourceDbPath}`)
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
