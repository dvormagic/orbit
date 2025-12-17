import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell } from 'electron'

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
  // First delete associated logs
  await prisma.timeLog.deleteMany({ where: { taskId: id } })
  return await prisma.task.delete({ where: { id } })
})

ipcMain.handle('minimize-window', () => {
  win?.minimize()
})

// Resize window for orbit mode vs full mode
ipcMain.handle('set-orbit-mode', (_, isOrbitMode: boolean) => {
  if (!win) return
  if (isOrbitMode) {
    // Size for the floating orb + glow shadow
    win.setResizable(false)
    win.setSize(180, 180)
    win.setMinimumSize(180, 180)
  } else {
    // Restore to normal size
    win.setMinimumSize(280, 120)
    win.setSize(350, 600)
    win.setResizable(true)
  }
})

app.whenReady().then(createWindow)

