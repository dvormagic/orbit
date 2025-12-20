import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'

ipcMain.handle('open-external', async (_, url) => {
  return await shell.openExternal(url)
})



const __dirname = path.dirname(fileURLToPath(import.meta.url))


import prisma from './db'


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 350,
    height: 600,
    minWidth: 280,
    minHeight: 120,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// --- IPC Handlers ---

ipcMain.handle('get-tasks', async () => {
  return await prisma.task.findMany({
    include: { timeLogs: true },
    orderBy: { createdAt: 'desc' },
  })
})

ipcMain.handle('create-task', async (_, data) => {
  return await prisma.task.create({ data })
})

ipcMain.handle('update-task', async (_, { id, ...data }) => {
  return await prisma.task.update({
    where: { id },
    data,
  })
})

ipcMain.handle('start-timer', async (_, taskId) => {
  return await prisma.timeLog.create({
    data: { taskId }
  })
})

ipcMain.handle('stop-timer', async (_, { logId, duration }) => {
  return await prisma.timeLog.update({
    where: { id: logId },
    data: {
      endTime: new Date(),
      duration
    }
  })
})

ipcMain.handle('delete-task', async (_, id) => {
  const collectDescendantIds = async (rootId: string): Promise<string[]> => {
    const out: string[] = []
    let frontier: string[] = [rootId]
    while (frontier.length > 0) {
      const children = await prisma.task.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      }) as Array<{ id: string }>
      const childIds = children.map(c => c.id)
      if (childIds.length === 0) break
      out.push(...childIds)
      frontier = childIds
    }
    return out
  }

  const descendantIds = await collectDescendantIds(id)
  const idsToDelete = [id, ...descendantIds]

  // Delete logs first, then tasks (covers parents + all descendants)
  await prisma.timeLog.deleteMany({ where: { taskId: { in: idsToDelete } } })
  await prisma.task.deleteMany({ where: { id: { in: idsToDelete } } })
})

ipcMain.handle('minimize-window', () => {
  win?.minimize()
})

ipcMain.handle('set-mouse-passthrough', (_, enabled: boolean) => {
  if (!win) return
  if (enabled) {
    win.setIgnoreMouseEvents(true, { forward: true })
  } else {
    win.setIgnoreMouseEvents(false)
  }
})

// Resize window for orbit mode vs full mode
ipcMain.handle('set-orbit-mode', (_, isOrbitMode: boolean) => {
  if (!win) return
  if (isOrbitMode) {
    // Size for the floating orb + glow shadow
    win.setResizable(false)
    win.setSize(180, 180)
    win.setMinimumSize(180, 180)

    // Default to click-through outside the orb; renderer can toggle via IPC when hovering hitbox.
    win.setIgnoreMouseEvents(true, { forward: true })

    // Best-effort: if the cursor is already over the orb area, make it interactive immediately.
    try {
      const bounds = win.getBounds()
      const cursor = screen.getCursorScreenPoint()
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      const dx = cursor.x - cx
      const dy = cursor.y - cy
      const hitRadius = 60
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        win.setIgnoreMouseEvents(false)
      }
    } catch {
      // ignore
    }
  } else {
    // Restore to normal size
    win.setIgnoreMouseEvents(false)
    win.setMinimumSize(280, 120)
    win.setSize(350, 600)
    win.setResizable(true)
  }
})

async function ensureDbSchema() {
  // Lightweight forward-compat: if the user already has a DB from an older version,
  // make sure the columns we now rely on exist.
  try {
    const columns = await (prisma as any).$queryRawUnsafe(`PRAGMA table_info("Task")`) as Array<{ name?: string }>
    const hasParentId = Array.isArray(columns) && columns.some(c => c?.name === 'parentId')
    if (!hasParentId) {
      await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Task" ADD COLUMN "parentId" TEXT`)
      await (prisma as any).$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Task_parentId_idx" ON "Task"("parentId")`)
    }
  } catch (err) {
    console.error('DB schema check failed:', err)
  }
}

app.whenReady().then(async () => {
  await ensureDbSchema()
  createWindow()
})

