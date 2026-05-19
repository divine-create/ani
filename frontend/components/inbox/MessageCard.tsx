import { Message } from '@/lib/types'
import { cn, truncate, formatTime } from '@/lib/utils'
import { Mail, MessageCircle, CheckCircle2 } from 'lucide-react'

interface Props { message: Message; selected: boolean; onSelect: () => void }

const priorityConfig = {
  urgent:  { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-600',    label: 'Urgent' },
  normal:  { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-600',   label: 'Normal' },
  routine: { bar: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-500',  label: 'Routine' },
  noise:   { bar: 'bg-gray-200',   badge: 'bg-gray-50 text-gray-400',   label: 'Noise' },
}

export function MessageCard({ message, selected, onSelect }: Props) {
  const cfg = priorityConfig[message.priority as keyof typeof priorityConfig] ?? priorityConfig.routine

  return (
    <button onClick={onSelect} className={cn(
      'w-full text-left rounded-xl border transition-all duration-150 overflow-hidden group',
      selected
        ? 'border-indigo-200 bg-indigo-50 shadow-sm shadow-indigo-100'
        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    )}>
      <div className="flex">
        <div className={cn('w-1 flex-shrink-0', cfg.bar)} />
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {message.channel === 'gmail'
                ? <Mail size={11} className="text-gray-400 flex-shrink-0" />
                : <MessageCircle size={11} className="text-green-500 flex-shrink-0" />
              }
              <p className="text-xs font-semibold text-gray-900 truncate">
                {message.from_name || message.from_address}
              </p>
            </div>
            <p className="text-[10px] text-gray-400 flex-shrink-0">
              {message.received_at ? formatTime(message.received_at) : ''}
            </p>
          </div>
          {message.subject && (
            <p className="text-xs text-gray-700 truncate">{message.subject}</p>
          )}
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {truncate(message.body || '', 70)}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.badge)}>
              {cfg.label}
            </span>
            {message.auto_sent ? (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
                <CheckCircle2 size={10} /> Auto-sent
              </span>
            ) : message.draft_reply ? (
              <span className="text-[10px] text-indigo-500 font-medium">Draft ready ✓</span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}
