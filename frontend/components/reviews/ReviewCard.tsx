import { Review } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface Props { review: Review; selected: boolean; onSelect: () => void }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= rating ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </div>
  )
}

const statusConfig: Record<string, { badge: string; label: string }> = {
  needs_attention: { badge: 'bg-red-50 text-red-600',    label: 'Urgent' },
  draft_ready:     { badge: 'bg-blue-50 text-blue-600',  label: 'Draft ready' },
  posted:          { badge: 'bg-green-50 text-green-700', label: 'Posted' },
  pending:         { badge: 'bg-gray-100 text-gray-500', label: 'Pending' },
}

export function ReviewCard({ review, selected, onSelect }: Props) {
  const cfg = statusConfig[review.status] ?? statusConfig.pending
  return (
    <button onClick={onSelect} className={cn(
      'w-full text-left rounded-xl border overflow-hidden transition-all duration-150',
      selected ? 'border-indigo-200 bg-indigo-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
    )}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-xs font-semibold text-gray-900">{review.reviewer_name || 'Anonymous'}</p>
          {review.reply_posted && <CheckCircle2 size={12} className="text-green-500 flex-shrink-0 mt-0.5" />}
        </div>
        <Stars rating={review.rating} />
        {review.body && (
          <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{review.body}</p>
        )}
        <div className="mt-2">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.badge)}>
            {cfg.label}
          </span>
        </div>
      </div>
    </button>
  )
}
