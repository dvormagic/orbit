<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useTaskStore, type Task } from '../stores/taskStore'
import { Play, Pause, Trash2, Plus, GripVertical, ChevronDown, ChevronUp, Minus, GitPullRequest, Link2, CheckCircle2, ListTodo } from 'lucide-vue-next'

const taskStore = useTaskStore()
const isExpanded = ref(true)
const isOrbitMode = ref(false) // Collapsed to floating orb
const showAddForm = ref(false)
const newTaskTag = ref('')
const newTaskTitle = ref('')
const editingUrlTaskId = ref<string | null>(null)
const editingUrlType = ref<'jira' | 'pr' | null>(null)
const editingUrlValue = ref('')
const expandedTaskId = ref<string | null>(null)
const activeTab = ref<'active' | 'completed'>('active')

// Timer for live elapsed time
const now = ref(Date.now())
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  try {
    await taskStore.fetchTasks()
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  }
  
  timerInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Active task being tracked
const activeTask = computed(() => {
  if (!taskStore.activeLog) return null
  return taskStore.tasks.find(t => t.id === taskStore.activeLog?.taskId)
})

// Filtered tasks by tab
const activeTasks = computed(() => taskStore.tasks.filter(t => t.status !== 'DONE'))
const completedTasks = computed(() => taskStore.tasks.filter(t => t.status === 'DONE'))

// Format seconds to HH:MM:SS
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Get total time spent on a task (from completed logs)
const getTotalTime = (task: Task): number => {
  return task.timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0)
}

// Get current session elapsed time
const getElapsedTime = computed(() => {
  if (!taskStore.activeLog) return 0
  return Math.floor((now.value - taskStore.activeLog.startTime) / 1000)
})

// Get display time for a task (total + current if active)
const getDisplayTime = (task: Task): string => {
  const total = getTotalTime(task)
  const isActive = taskStore.activeLog?.taskId === task.id
  const current = isActive ? getElapsedTime.value : 0
  return formatTime(total + current)
}

const addNewTask = async () => {
  if (!newTaskTag.value) return
  await taskStore.createTask(newTaskTag.value, newTaskTitle.value)
  newTaskTag.value = ''
  newTaskTitle.value = ''
  showAddForm.value = false
}

const toggleTimer = (taskId: string) => {
  if (taskStore.activeLog?.taskId === taskId) {
    taskStore.stopTimer()
  } else {
    taskStore.startTimer(taskId)
  }
}

const toggleTaskExpand = (taskId: string) => {
  expandedTaskId.value = expandedTaskId.value === taskId ? null : taskId
}

const toggleOrbitMode = () => {
  isOrbitMode.value = !isOrbitMode.value
  window.ipcRenderer.orbit.setOrbitMode(isOrbitMode.value)
}

const startEditUrl = (taskId: string, type: 'jira' | 'pr', currentValue: string | null) => {
  editingUrlTaskId.value = taskId
  editingUrlType.value = type
  editingUrlValue.value = currentValue || ''
}

const saveUrl = async () => {
  if (!editingUrlTaskId.value || !editingUrlType.value) return
  const update = editingUrlType.value === 'jira' 
    ? { jiraUrl: editingUrlValue.value || null }
    : { prUrl: editingUrlValue.value || null }
  await taskStore.updateTask(editingUrlTaskId.value, update)
  editingUrlTaskId.value = null
  editingUrlType.value = null
  editingUrlValue.value = ''
}

const cancelEditUrl = () => {
  editingUrlTaskId.value = null
  editingUrlType.value = null
  editingUrlValue.value = ''
}

const openUrl = (url: string | null) => {
  if (!url) return
  let finalUrl = url.trim()
  if (!finalUrl) return
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl
  }
  window.ipcRenderer.orbit.openExternal(finalUrl)
}

const restoreTask = async (taskId: string) => {
  await taskStore.updateTask(taskId, { status: 'TODO' })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS': return 'text-amber-400 bg-amber-400/10'
    case 'PR': return 'text-purple-400 bg-purple-400/10'
    case 'DONE': return 'text-emerald-400 bg-emerald-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}
</script>

<template>
  <!-- Orbit Mode (Floating Orb) -->
  <div v-if="isOrbitMode" class="w-full h-screen flex items-center justify-center">
    <div class="orb-glow w-20 h-20 rounded-full cursor-grab draggable
                flex items-center justify-center
                bg-slate-800 relative border border-slate-700/50">
      <!-- Clickable center area -->
      <div @click="toggleOrbitMode" 
           class="no-draggable cursor-pointer z-10 flex flex-col items-center justify-center">
        <span v-if="activeTask" class="text-[9px] font-bold text-cyan-400 tracking-wide leading-tight text-center">
          {{ activeTask.jiraTag }}
        </span>
        <span v-else class="text-[10px] font-bold text-slate-500">ORBIT</span>
      </div>
      <!-- Active indicator - overlapping the sphere -->
      <div v-if="activeTask" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full animate-ping z-20"></div>
      <div v-if="activeTask" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 z-20"></div>
    </div>
  </div>

  <!-- Full Widget -->
  <div v-else class="relative bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
    <!-- Header/Draggable Area -->
    <div class="draggable h-10 px-3 flex items-center justify-between bg-slate-800 border-b border-slate-700/50">
      <div class="flex items-center gap-2">
        <GripVertical class="w-4 h-4 text-slate-500" />
        <span class="text-xs font-bold tracking-widest text-cyan-400 uppercase">ORBIT</span>
      </div>
      <div class="flex items-center gap-1">
        <button @click="showAddForm = !showAddForm" class="no-draggable p-1.5 hover:bg-slate-700 rounded transition-colors" :class="{'text-cyan-400 bg-cyan-400/10': showAddForm}" title="Añadir Tarea">
          <Plus class="w-3.5 h-3.5" />
        </button>
        <button @click="toggleOrbitMode" class="no-draggable p-1.5 hover:bg-slate-700 rounded transition-colors" title="Modo Órbita">
          <Minus class="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button @click="isExpanded = !isExpanded" class="no-draggable p-1.5 hover:bg-slate-700 rounded transition-colors">
          <ChevronUp v-if="isExpanded" class="w-3.5 h-3.5 text-slate-400" />
          <ChevronDown v-else class="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>

    <!-- Active Task Banner -->
    <div v-if="activeTask" class="px-3 py-2 bg-linear-to-r from-cyan-500/20 to-blue-500/10 border-b border-cyan-500/30">
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-[10px] uppercase font-bold text-cyan-400">Tracking</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-sm font-bold truncate">{{ activeTask.jiraTag }}</span>
            <span class="text-lg font-mono text-cyan-400">{{ getDisplayTime(activeTask) }}</span>
          </div>
        </div>
        <button @click="taskStore.stopTimer()" class="p-2 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-all shadow-lg active:scale-95">
          <Pause class="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div v-show="isExpanded" class="flex border-b border-slate-700/50 bg-slate-800/50">
      <button 
        @click="activeTab = 'active'" 
        :class="activeTab === 'active' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-slate-300'"
        class="flex-1 py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
      >
        <ListTodo class="w-3.5 h-3.5" />
        Activas ({{ activeTasks.length }})
      </button>
      <button 
        @click="activeTab = 'completed'" 
        :class="activeTab === 'completed' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-300'"
        class="flex-1 py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
      >
        <CheckCircle2 class="w-3.5 h-3.5" />
        Finalizadas ({{ completedTasks.length }})
      </button>
    </div>

    <!-- Content Area -->
    <div v-show="isExpanded" class="overflow-y-auto p-3 space-y-2 scrollbar-hide" style="max-height: 360px;">
      <!-- Add Task Form -->
      <div v-if="showAddForm" class="space-y-2 pb-3 border-b border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
        <div class="flex gap-2">
          <input v-model="newTaskTag" placeholder="Tag (NTD-1223)" 
                 class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none transition-colors" />
          <button @click="addNewTask" class="bg-cyan-500 text-slate-900 px-3 py-2 rounded-lg hover:bg-cyan-400 transition-colors">
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <input v-model="newTaskTitle" placeholder="Descripción (opcional)" 
               class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none transition-colors" />
      </div>

      <!-- Active Tasks Tab -->
      <div v-if="activeTab === 'active'" class="space-y-2">
        <div v-if="activeTasks.length === 0" class="text-center py-8 text-slate-500 text-xs">
          No hay tareas activas
        </div>
        <div v-for="task in activeTasks" :key="task.id" 
             class="bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/30 transition-all overflow-hidden">
          <!-- Minimal View (Always Visible) -->
          <div class="p-3 flex items-start justify-between gap-2 cursor-pointer" @click="toggleTaskExpand(task.id)">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span :class="getStatusColor(task.status)" class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                  {{ task.status }}
                </span>
                <span class="text-sm font-bold truncate">{{ task.jiraTag }}</span>
              </div>
              <p v-if="task.title" class="text-xs text-slate-400 mt-1 line-clamp-2">{{ task.title }}</p>
            </div>
            <!-- Timer Button -->
            <button @click.stop="toggleTimer(task.id)"
                    :class="taskStore.activeLog?.taskId === task.id ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'"
                    class="p-2 rounded-lg hover:opacity-80 transition-all active:scale-90 shrink-0">
              <Pause v-if="taskStore.activeLog?.taskId === task.id" class="w-4 h-4 fill-current" />
              <Play v-else class="w-4 h-4 fill-current" />
            </button>
          </div>

          <!-- Expanded Details -->
          <div v-if="expandedTaskId === task.id" class="px-3 pb-3 pt-2 border-t border-slate-700/30 space-y-2 animate-in slide-in-from-top-1 duration-150">
            
            <!-- Time Display -->
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span>Tiempo total:</span>
              <span class="font-mono text-cyan-400">{{ getDisplayTime(task) }}</span>
            </div>

            <!-- Quick Actions Bar -->
            <div class="flex items-center justify-between gap-2">
              <!-- Link Buttons -->
              <div class="flex items-center gap-1">
                <button @click.stop="task.jiraUrl ? openUrl(task.jiraUrl) : startEditUrl(task.id, 'jira', task.jiraUrl)" 
                        :class="task.jiraUrl ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 bg-slate-700/50'"
                        class="p-1.5 rounded text-[10px] font-bold flex items-center gap-1 hover:opacity-80 transition-all"
                        :title="task.jiraUrl ? 'Abrir Tarea' : 'Añadir URL Tarea'">
                  <Link2 class="w-3 h-3" />
                  <span>TASK</span>
                </button>
                <button @click.stop="task.prUrl ? openUrl(task.prUrl) : startEditUrl(task.id, 'pr', task.prUrl)" 
                        :class="task.prUrl ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500 bg-slate-700/50'"
                        class="p-1.5 rounded text-[10px] font-bold flex items-center gap-1 hover:opacity-80 transition-all"
                        :title="task.prUrl ? 'Abrir PR' : 'Añadir URL PR'">
                  <GitPullRequest class="w-3 h-3" />
                  <span>PR</span>
                </button>
              </div>

              <!-- Status + Delete -->
              <div class="flex items-center gap-2">
                <select :value="task.status" @change="e => taskStore.updateTask(task.id, { status: (e.target as HTMLSelectElement).value as any })"
                        @click.stop
                        class="bg-slate-700 text-[10px] border border-slate-600 rounded px-1.5 py-1 focus:outline-none text-slate-300">
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="PR">PR</option>
                  <option value="DONE">DONE</option>
                </select>
                <button @click.stop="taskStore.deleteTask(task.id)" class="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Tasks Tab -->
      <div v-if="activeTab === 'completed'" class="space-y-2">
        <div v-if="completedTasks.length === 0" class="text-center py-8 text-slate-500 text-xs">
          No hay tareas finalizadas
        </div>
        <div v-for="task in completedTasks" :key="task.id" 
             class="bg-slate-800/30 border border-slate-700/30 rounded-lg transition-all overflow-hidden opacity-70 hover:opacity-100">
          <!-- Minimal View -->
          <div class="p-3 flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
              <span class="text-sm font-bold truncate text-slate-400">{{ task.jiraTag }}</span>
              <span v-if="task.title" class="text-xs text-slate-500 truncate">{{ task.title }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-slate-500">{{ getDisplayTime(task) }}</span>
              <button @click="restoreTask(task.id)" 
                      class="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                      title="Restaurar tarea">
                Restaurar
              </button>
              <button @click="taskStore.deleteTask(task.id)" class="text-slate-600 hover:text-red-400 transition-colors p-1">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- URL Edit Modal -->
    <div v-if="editingUrlTaskId" class="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-50">
      <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 w-full max-w-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-300">
          Añadir URL {{ editingUrlType === 'jira' ? 'Tarea' : 'PR' }}
        </h3>
        <input v-model="editingUrlValue" :placeholder="editingUrlType === 'jira' ? 'https://task-management.com/...' : 'https://github.com/...'"
               class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none" />
        <div class="flex gap-2">
          <button @click="saveUrl" class="flex-1 bg-cyan-500 text-slate-900 py-2 rounded-lg text-xs font-bold hover:bg-cyan-400 transition-colors">Guardar</button>
          <button @click="cancelEditUrl" class="flex-1 bg-slate-600 text-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-500 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div v-show="isExpanded" class="p-2 text-center border-t border-slate-700/50 bg-slate-800/50">
      <span class="text-[10px] text-slate-500">{{ taskStore.tasks.length }} tareas</span>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Glowing orb - dark navy blue */
.orb-glow {
  box-shadow: 
    0 0 15px rgba(34, 211, 238, 0.4),
    0 0 30px rgba(34, 211, 238, 0.2),
    0 0 45px rgba(6, 182, 212, 0.1);
  animation: orb-glow-float 2.5s ease-in-out infinite;
}

@keyframes orb-glow-float {
  0%, 100% {
    transform: translateY(0px);
    box-shadow: 
      0 0 15px rgba(34, 211, 238, 0.4),
      0 0 30px rgba(34, 211, 238, 0.2),
      0 0 45px rgba(6, 182, 212, 0.1);
  }
  50% {
    transform: translateY(-6px);
    box-shadow: 
      0 0 20px rgba(34, 211, 238, 0.5),
      0 0 40px rgba(34, 211, 238, 0.3),
      0 0 60px rgba(6, 182, 212, 0.15);
  }
}
</style>
