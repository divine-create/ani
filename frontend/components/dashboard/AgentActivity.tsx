import { AgentEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Zap, CheckCircle2, AlertTriangle, Loader2, Activity } from 'lucide-react'

interface Props { events: AgentEvent[]; isConnected: boolean }

function EventRow({ event, index }: { event: AgentEvent; index: number }) {
  const isSuccess = event.type.match(/done|complete|sent|posted|ready/)
  const isError = event.type.match(/urgent|error|fail/)

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
        isSuccess ? "bg-green-50" : isError ? "bg-red-50" : "bg-indigo-50"
      )}>
        {isSuccess
          ? <CheckCircle2 size={12} className="text-green-500" />
          : isError
          ? <AlertTriangle size={12} className="text-red-500" />
          : <Loader2 size={12} className="text-indigo-500 animate-spin" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-relaxed">{event.description}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{event.type}</p>
      </div>
    </div>
  )
}

export function AgentActivity({ events, isConnected }: Props) {
  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Activity size={13} className="text-indigo-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Agent Activity</h3>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          isConnected ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-400 animate-pulse" : "bg-gray-300")} />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <Zap size={16} className="text-gray-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Waiting for activity</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Ani is monitoring your channels</p>
          </div>
        ) : (
          events.map((e, i) => <EventRow key={i} event={e} index={i} />)
        )}
      </div>
    </div>
  )
}
