'use client'
import { useState } from 'react'
import { useInbox, useApproveDraft, useDismissMessage, useSyncInbox, useAutoReply, useSetAutoReply } from '@/lib/api'
import { Message } from '@/lib/types'
import { MessageList } from '@/components/inbox/MessageList'
import { DraftPreview } from '@/components/inbox/DraftPreview'
import { Inbox, RefreshCw, Mail, CheckCircle2, AlertCircle, Zap, ZapOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHANNELS = [
  { key: undefined,     label: 'All' },
  { key: 'gmail',       label: 'Gmail' },
  { key: 'whatsapp',    label: 'WhatsApp' },
] as const

export default function InboxPage() {
  const [channel, setChannel] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<Message | null>(null)
  const { data, isLoading } = useInbox(channel)
  const approve = useApproveDraft()
  const dismiss = useDismissMessage()
  const sync = useSyncInbox()
  const { data: autoReplyData } = useAutoReply()
  const setAutoReply = useSetAutoReply()
  const autoReplyOn = autoReplyData?.enabled ?? true

  const messages: Message[] = data?.messages ?? []
  const urgent      = messages.filter(m => m.priority === 'urgent' && m.status !== 'done')
  const needsReview = messages.filter(m => m.status === 'needs_review' && m.priority !== 'urgent')
  const autoHandled = messages.filter(m => m.auto_sent)
  const all         = [...urgent, ...needsReview]

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Inbox size={15} className="text-indigo-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Inbox</h1>
            <p className="text-xs text-gray-400">{messages.length} messages · {urgent.length} urgent</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Channel filter */}
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
            {CHANNELS.map(({ key, label }) => (
              <button key={label}
                onClick={() => setChannel(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  channel === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Auto-reply toggle */}
          <button
            onClick={() => setAutoReply.mutate(!autoReplyOn)}
            disabled={setAutoReply.isPending}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-medium transition-all shadow-sm',
              autoReplyOn
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            )}
            title={autoReplyOn ? 'Auto-reply is ON — click to pause' : 'Auto-reply is OFF — click to enable'}
          >
            {autoReplyOn ? <Zap size={12} className="text-green-600" /> : <ZapOff size={12} />}
            {autoReplyOn ? 'Auto-reply ON' : 'Auto-reply OFF'}
            <span className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              autoReplyOn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            )} />
          </button>
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={12} className={sync.isPending ? 'animate-spin' : ''} />
            {sync.isPending ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={14} className="text-red-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{urgent.length}</p>
            <p className="text-[10px] text-gray-500">Urgent</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Mail size={14} className="text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{needsReview.length}</p>
            <p className="text-[10px] text-gray-500">Needs review</p>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={14} className="text-green-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{autoHandled.length}</p>
            <p className="text-[10px] text-gray-500">Auto-handled</p>
          </div>
        </div>
      </div>

      {/* Main split panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Message list */}
        <div className="w-80 flex flex-col gap-4 flex-shrink-0 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-3 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <MessageList
                title={`Needs You (${all.length})`}
                messages={all}
                selected={selected}
                onSelect={setSelected}
                variant="urgent"
              />
              <MessageList
                title={`Auto-Handled (${autoHandled.length})`}
                messages={autoHandled}
                selected={selected}
                onSelect={setSelected}
                variant="handled"
                collapsed
              />
            </>
          )}
        </div>

        {/* Draft panel */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <DraftPreview
              message={selected}
              onApprove={(editedDraft) => {
                approve.mutate({ id: selected.id, editedDraft })
                setSelected(null)
              }}
              onDiscard={() => {
                dismiss.mutate(selected.id)
                setSelected(null)
              }}
              isSending={approve.isPending}
            />
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Mail size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Select a message</p>
              <p className="text-xs text-gray-400 mt-1">Click any message to review its AI draft</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
