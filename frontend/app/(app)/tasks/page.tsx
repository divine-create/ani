'use client'
import { useState } from 'react'
import { useTasks, useUpdateTask, useCreateTask, useStats } from '@/lib/api'
import { Task } from '@/lib/types'
import { TaskCard } from '@/components/tasks/TaskCard'
import { CheckSquare, Plus, X, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES = [
  { key: 'open',        label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'waiting',     label: 'Waiting' },
  { key: 'done',        label: 'Done' },
  { key: undefined,     label: 'All' },
] as const

const SOURCE_FILTER_KEY = '__from_email__'

export default function TasksPage() {
  const [filter, setFilter] = useState<string>('open')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('Normal')

  const isEmailFilter = filter === SOURCE_FILTER_KEY
  const { data, isLoading } = useTasks(isEmailFilter ? undefined : (filter === 'All' ? undefined : filter))
  const { data: statsData } = useStats()
  const update = useUpdateTask()
  const create = useCreateTask()

  const allTasks: Task[] = data?.tasks ?? []
  const tasks = isEmailFilter ? allTasks.filter(t => t.source === 'Gmail') : allTasks
  const openCount = allTasks.filter(t => t.status === 'open').length
  const emailCount = statsData?.commitments_extracted ?? 0

  function handleCreate() {
    if (!newTitle.trim()) return
    create.mutate({ title: newTitle, priority: newPriority, source: 'Manual' }, {
      onSuccess: () => { setNewTitle(''); setShowCreate(false) }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckSquare size={15} className="text-green-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Tasks</h1>
            <p className="text-xs text-gray-400">{openCount} open · synced with Notion</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Task
        </button>
      </div>

      {/* Create task form */}
      {showCreate && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">New Task</p>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Task title..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <div className="flex items-center gap-2">
            {['Normal', 'High', 'Urgent'].map(p => (
              <button key={p}
                onClick={() => setNewPriority(p)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                  newPriority === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || create.isPending}
              className="ml-auto px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? 'Saving...' : 'Add to Notion'}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
          {STATUSES.map(({ key, label }) => (
            <button key={label}
              onClick={() => setFilter(key ?? 'All')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                (filter === (key ?? 'All'))
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilter(SOURCE_FILTER_KEY)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
            filter === SOURCE_FILTER_KEY
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'
          )}
        >
          <Mail size={11} />
          From Email {emailCount > 0 && <span className="ml-0.5 font-bold">({emailCount})</span>}
        </button>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <CheckSquare size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No tasks here</p>
          <p className="text-xs text-gray-400 mt-1">Ani extracts tasks from emails automatically, or add one manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(status) => update.mutate({ id: task.id, status })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
