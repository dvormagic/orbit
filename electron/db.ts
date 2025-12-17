import path from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')

// Determine the database path
// In development: use the local dev.db
// In production: use app.getPath('userData')/database.db to ensure persistence
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
const dbPath = isDev
    ? path.join(__dirname, '..', 'prisma', 'dev.db')
    : path.join(app.getPath('userData'), 'database.db')

const prisma = new PrismaClient({
    datasourceUrl: `file:${dbPath}`,
} as any)

export default prisma
