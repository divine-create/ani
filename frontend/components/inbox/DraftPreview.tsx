'use client'
import { useState, useEffect } from 'react'
import { Message } from '@/lib/types'
import { Send, Trash2, Edit3, Mail, MessageCircle, Sparkles, Check, Zap, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { useCreateRule } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  message: Message
  onApprove: (editedDraft?: string) => void
  onDiscard: () => void
  isSending?: boolean
}

function QuickRule({ message }: { message: Message }) {
  const createRule = useCreateRule()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const senderDomain = message.from_address.split('@')[1]?.replace('>', '') ?? ''

  const presets = [
    { label: `Always auto-reply from ${senderDomain}`, action: 'auto_reply', type: 'domain', value: senderDomain },
    { label: `Always auto-reply from ${message.from_address}`, action: 'auto_reply', type: 'sender', value: message.from_address },
    { label: `Always flag urgent from ${senderDomain}`, action: 'flag_urgent', type: 'domain', value: senderDomain },
    { label: 'Archive all from this sender', action: 'archive', type: 'sender', value: message.from_address },
  ]

  function apply(preset: typeof presets[0]) {
    createRule.mutate({
      name: preset.label,
      channel: 'gmail',
      condition_type: preset.type,
      condition_value: preset.value.toLowerCase(),
      action: preset.action,
    }, {
      onSuccess: () => { setSaved(true); setOpen(false); setTimeout(() => setSaved(false), 3000) }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all',
          saved
            ? 'text-green-600 bg-green-50 border-green-100'
            : 'text-gray-500 bg-white border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
        )}
      >
        <Zap size={11} />
        {saved ? 'Rule saved!' : 'Set rule'}
        {!saved && <ChevronDown size={10} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-200/60 z-10 overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1.5">Apply rule to future emails</p>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => apply(p)}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
            >
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                p.action === 'auto_reply' ? 'bg-green-100 text-green-700' :
                p.action === 'flag_urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
              )}>
                {p.action === 'auto_reply' ? 'AUTO' : p.action === 'flag_urgent' ? 'URGENT' : 'ARCHIVE'}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function DraftPreview({ message, onApprove, onDiscard, isSending }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.draft_reply || '')
  const [expanded, setExpanded] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  useEffect(() => {
    setDraft(message.draft_reply || '')
    setEditing(false)
    setExpanded(false)
    setShowOriginal(false)
  }, [message.id])

  const priorityColor = {
    urgent: 'bg-red-50 text-red-600 border-red-100',
    normal: 'bg-blue-50 text-blue-600 border-blue-100',
    routine: 'bg-gray-50 text-gray-500 border-gray-200',
    noise: 'bg-gray-50 text-gray-400 border-gray-100',
  }[message.priority] ?? 'bg-gray-50 text-gray-500 border-gray-200'

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm leading-snug">
              {message.subject || '(no subject)'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              From: <span className="text-gray-700">{message.from_name || message.from_address}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${priorityColor}`}>
              {message.priority}
            </span>
            {message.channel === 'gmail'
              ? <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                  <Mail size={10} /> Gmail
                </span>
              : <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                  <MessageCircle size={10} /> WhatsApp
                </span>
            }
            <QuickRule message={message} />
          </div>
        </div>
      </div>

      {/* Original message — collapsed by default to give draft more space */}
      <div className="px-5 pt-3 pb-0 border-b border-gray-50">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex items-center gap-2 w-full pb-3 text-left group"
        >
          <ChevronDown size={11} className={cn('text-gray-400 transition-transform', showOriginal ? '' : '-rotate-90')} />
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Original message
          </p>
          {!showOriginal && (
            <p className="text-[11px] text-gray-400 truncate flex-1 ml-1 normal-case font-normal tracking-normal">
              {message.body?.slice(0, 80)}…
            </p>
          )}
        </button>
        {showOriginal && (
          <p className="text-xs text-gray-600 leading-relaxed pb-3">{message.body}</p>
        )}
      </div>

      {/* Draft reply — takes all remaining space */}
      <div className="flex-1 px-5 py-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Sparkles size={11} className="text-indigo-500" />
            </div>
            <p className="text-xs font-semibold text-gray-700">AI Draft Reply</p>
            <span className="text-[10px] text-gray-400">{draft.length} chars</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
            >
              {editing ? <Check size={11} /> : <Edit3 size={11} />}
              {editing ? 'Done' : 'Edit'}
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              title="Fullscreen"
            >
              <Maximize2 size={11} />
            </button>
          </div>
        </div>

        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-1 w-full text-sm text-gray-800 border border-indigo-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all leading-loose resize-y min-h-[200px]"
          />
        ) : (
          <div
            className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto cursor-text"
            onClick={() => setEditing(true)}
          >
            <p className="text-sm text-gray-800 leading-loose whitespace-pre-wrap">{draft}</p>
          </div>
        )}

        {/* Expanded fullscreen overlay */}
        {expanded && editing && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setExpanded(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
              style={{ maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{message.subject || '(no subject)'}</p>
                  <p className="text-xs text-gray-400">Editing AI draft reply</p>
                </div>
                <button onClick={() => setExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Minimize2 size={15} />
                </button>
              </div>
              <div className="flex-1 p-5 flex flex-col min-h-0">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="flex-1 w-full text-sm text-gray-800 border border-indigo-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 leading-relaxed"
                  style={{ minHeight: '300px' }}
                />
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => { onApprove(draft); setExpanded(false) }}
                  disabled={isSending || !draft.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  <Send size={13} /> {isSending ? 'Sending...' : 'Approve & Send'}
                </button>
                <button onClick={() => setExpanded(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
        <button
          onClick={() => onApprove(editing ? draft : undefined)}
          disabled={isSending || !draft.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
        >
          <Send size={14} />
          {isSending ? 'Sending...' : 'Approve & Send'}
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-[0.98] transition-all text-sm font-medium shadow-sm"
        >
          <Trash2 size={14} />
          Dismiss
        </button>
      </div>
    </div>
  )
}
