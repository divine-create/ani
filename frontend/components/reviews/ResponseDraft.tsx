'use client'
import { useState } from 'react'
import { Review } from '@/lib/types'
import { Star, Send, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  review: Review
  onApprove: (text: string) => void
  onDiscard: () => void
  isPosting?: boolean
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13}
          className={cn(i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
      ))}
    </div>
  )
}

export function ResponseDraft({ review, onApprove, onDiscard, isPosting }: Props) {
  const [text, setText] = useState(review.draft_reply || '')
  const isUrgent = review.status === 'needs_attention'

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">{review.reviewer_name || 'Anonymous'}</p>
            <div className="mt-1">
              <Stars rating={review.rating} />
            </div>
          </div>
          {isUrgent && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
              <AlertTriangle size={9} />
              Urgent
            </span>
          )}
        </div>
        {review.body && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
            "{review.body}"
          </p>
        )}
      </div>

      {/* Draft area */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Draft Response</p>
          <span className="text-[10px] text-gray-400">{text.length} chars</span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Edit the AI-generated response..."
          className={cn(
            'flex-1 w-full text-sm text-gray-800 rounded-xl p-3 resize-none leading-relaxed',
            'border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300',
            'placeholder:text-gray-300 min-h-[180px]'
          )}
        />
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onApprove(text)}
          disabled={isPosting || !text.trim()}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all',
            'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Send size={13} />
          {isPosting ? 'Posting...' : 'Post to Google'}
        </button>
        <button
          onClick={onDiscard}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
