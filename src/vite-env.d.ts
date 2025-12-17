/// <reference types="vite/client" />

interface Window {
    ipcRenderer: import('electron').IpcRenderer & {
        orbit: {
            getTasks: () => Promise<import('./stores/taskStore').Task[]>
            createTask: (data: any) => Promise<import('./stores/taskStore').Task>
            updateTask: (data: any) => Promise<import('./stores/taskStore').Task>
            deleteTask: (id: string) => Promise<void>
            startTimer: (taskId: string) => Promise<import('./stores/taskStore').TimeLog>
            stopTimer: (logId: string, duration: number) => Promise<import('./stores/taskStore').TimeLog>
            minimizeWindow: () => Promise<void>
            openExternal: (url: string) => Promise<void>
            setOrbitMode: (isOrbitMode: boolean) => Promise<void>
        }
    }
}
