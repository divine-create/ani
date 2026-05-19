'use client'
import { useState } from 'react'
import { Message } from '@/lib/types'
import { MessageCard } from './MessageCard'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  title: string
  messages: Message[]
  selected: Message | null
  onSelect: (m: Message) => void
  variant?: 'urgent' | 'handled'
  collapsed?: boolean
}

export function MessageList({ title, messages, selected, onSelect, variant, collapsed = false }: Props) {
  const [open, setOpen] = useState(!collapsed)

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full mb-2.5 group">
        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${open ? 'bg-gray-100' : 'bg-gray-50'}`}>
          {open
            ? <ChevronDown size={11} className="text-gray-500" />
            : <ChevronRight size={11} className="text-gray-500" />
          }
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${variant === 'urgent' ? 'text-gray-700' : 'text-gray-400'}`}>
          {title}
        </span>
      </button>

      {open && (
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-gray-400">All clear here</p>
            </div>
          ) : (
            messages.map(m => (
              <MessageCard
                key={m.id}
                message={m}
                selected={selected?.id === m.id}
                onSelect={() => onSelect(m)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
