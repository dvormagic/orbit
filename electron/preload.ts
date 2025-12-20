import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // Orbit API
  orbit: {
    getTasks: () => ipcRenderer.invoke('get-tasks'),
    createTask: (data: any) => ipcRenderer.invoke('create-task', data),
    updateTask: (data: any) => ipcRenderer.invoke('update-task', data),
    deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),
    startTimer: (taskId: string) => ipcRenderer.invoke('start-timer', taskId),
    stopTimer: (logId: string, duration: number) => ipcRenderer.invoke('stop-timer', { logId, duration }),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    setOrbitMode: (isOrbitMode: boolean) => ipcRenderer.invoke('set-orbit-mode', isOrbitMode),
    setMousePassthrough: (enabled: boolean) => ipcRenderer.invoke('set-mouse-passthrough', enabled),
  }
})


