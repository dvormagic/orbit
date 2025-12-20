import { defineStore } from 'pinia'

export interface TimeLog {
    id: string
    taskId: string
    startTime: Date
    endTime: Date | null
    duration: number
}

export interface Task {
    id: string
    jiraTag: string
    title: string | null
    status: 'TODO' | 'IN_PROGRESS' | 'PR' | 'BLOCKED' | 'DONE'
    jiraUrl: string | null
    prUrl: string | null
    parentId: string | null
    createdAt: Date
    updatedAt: Date
    timeLogs: TimeLog[]
}

export const useTaskStore = defineStore('tasks', {
    state: () => ({
        tasks: [] as Task[],
        activeLog: null as { logId: string, taskId: string, startTime: number } | null,
        loading: false,
    }),

    actions: {
        async fetchTasks() {
            this.loading = true
            try {
                this.tasks = await window.ipcRenderer.orbit.getTasks()
            } finally {
                this.loading = false
            }
        },

        async createTask(jiraTag: string, title?: string, parentId?: string | null) {
            const newTask = await window.ipcRenderer.orbit.createTask({
                jiraTag,
                title,
                status: 'TODO',
                parentId: parentId ?? null,
            })
            await this.fetchTasks()
            return newTask
        },

        async updateTask(id: string, updates: Partial<Task>) {
            await window.ipcRenderer.orbit.updateTask({ id, ...updates })
            await this.fetchTasks()
        },

        async deleteTask(id: string) {
            await window.ipcRenderer.orbit.deleteTask(id)
            await this.fetchTasks()
        },

        async startTimer(taskId: string) {
            if (this.activeLog) await this.stopTimer()

            const log = await window.ipcRenderer.orbit.startTimer(taskId)
            this.activeLog = {
                logId: log.id,
                taskId: taskId,
                startTime: Date.now()
            }
            // Also update task status to IN_PROGRESS if it's currently TODO or BLOCKED
            const task = this.tasks.find(t => t.id === taskId)
            if (task && (task.status === 'TODO' || task.status === 'BLOCKED')) {
                await this.updateTask(taskId, { status: 'IN_PROGRESS' })
            }
        },

        async stopTimer() {
            if (!this.activeLog) return

            const duration = Math.floor((Date.now() - this.activeLog.startTime) / 1000)
            await window.ipcRenderer.orbit.stopTimer(this.activeLog.logId, duration)
            this.activeLog = null
            await this.fetchTasks()
        }
    }
})
