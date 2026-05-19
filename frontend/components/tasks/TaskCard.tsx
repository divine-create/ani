import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Calendar, User, Tag } from 'lucide-react'

interface Props { task: Task; onStatusChange: (status: string) => void }

const priorityConfig: Record<string, { badge: string; dot: string }> = {
  Urgent: { badge: 'bg-red-50 text-red-600',    dot: 'bg-red-500' },
  High:   { badge: 'bg-orange-50 text-orange-600', dot: 'bg-orange-500' },
  Normal: { badge: 'bg-blue-50 text-blue-600',   dot: 'bg-blue-400' },
  Low:    { badge: 'bg-gray-100 text-gray-500',  dot: 'bg-gray-300' },
}

const sourceColor: Record<string, string> = {
  Gmail:    'bg-red-50 text-red-500',
  WhatsApp: 'bg-green-50 text-green-600',
  Manual:   'bg-gray-100 text-gray-500',
  Slack:    'bg-purple-50 text-purple-600',
}

export function TaskCard({ task, onStatusChange }: Props) {
  const isDone = task.status === 'done'
  const pCfg = priorityConfig[task.priority] ?? priorityConfig.Normal

  return (
    <div className={cn(
      'card p-4 flex items-start gap-4 transition-all duration-150',
      isDone && 'opacity-60'
    )}>
      <button
        onClick={() => onStatusChange(isDone ? 'open' : 'done')}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          isDone
            ? 'bg-indigo-500 border-indigo-500'
            : 'border-gray-300 hover:border-indigo-400'
        )}
      >
        {isDone && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium text-gray-900 leading-snug', isDone && 'line-through text-gray-400')}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.contact_name && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <User size={10} /> {task.contact_name}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar size={10} /> {task.due_date}
            </span>
          )}
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', pCfg.badge)}>
            {task.priority}
          </span>
          {task.source && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', sourceColor[task.source] ?? 'bg-gray-100 text-gray-500')}>
              {task.source}
            </span>
          )}
        </div>
      </div>

      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5', pCfg.dot)} />
    </div>
  )
}
