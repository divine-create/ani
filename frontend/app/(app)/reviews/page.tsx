'use client'
import { useState } from 'react'
import { useReviews, useApproveReview } from '@/lib/api'
import { Review } from '@/lib/types'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ResponseDraft } from '@/components/reviews/ResponseDraft'
import { Star, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReviewsPage() {
  const { data, isLoading } = useReviews()
  const [selected, setSelected] = useState<Review | null>(null)
  const approve = useApproveReview()
  const reviews: Review[] = data?.reviews ?? []

  const urgent  = reviews.filter(r => r.status === 'needs_attention')
  const drafts  = reviews.filter(r => r.status === 'draft_ready')
  const posted  = reviews.filter(r => r.reply_posted)

  const isEmpty = reviews.length === 0 && !isLoading

  return (
    <div className="flex gap-5 h-full max-w-7xl mx-auto">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Star size={15} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Reviews</h1>
            <p className="text-xs text-gray-400">Google My Business autopilot</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Urgent', val: urgent.length, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
            { label: 'Drafts', val: drafts.length, icon: Clock, color: 'text-blue-500 bg-blue-50' },
            { label: 'Posted', val: posted.length, icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card p-2.5 text-center">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center mx-auto mb-1', color)}>
                <Icon size={12} />
              </div>
              <p className="text-base font-bold text-gray-900">{val}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="card p-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <Star size={18} className="text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-gray-600">No reviews yet</p>
              <p className="text-[11px] text-gray-400 mt-1">Connect Google My Business to start monitoring reviews</p>
            </div>
          ) : (
            <>
              {urgent.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Urgent ({urgent.length})</p>
                  <div className="space-y-2">
                    {urgent.map(r => (
                      <ReviewCard key={r.id} review={r} selected={selected?.id === r.id} onSelect={() => setSelected(r)} />
                    ))}
                  </div>
                </div>
              )}
              {drafts.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Draft Ready ({drafts.length})</p>
                  <div className="space-y-2">
                    {drafts.map(r => (
                      <ReviewCard key={r.id} review={r} selected={selected?.id === r.id} onSelect={() => setSelected(r)} />
                    ))}
                  </div>
                </div>
              )}
              {posted.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Posted ({posted.length})</p>
                  <div className="space-y-2">
                    {posted.slice(0, 5).map(r => (
                      <ReviewCard key={r.id} review={r} selected={selected?.id === r.id} onSelect={() => setSelected(r)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <ResponseDraft
            review={selected}
            onApprove={(text) => { approve.mutate({ id: selected.id, replyText: text }); setSelected(null) }}
            onDiscard={() => setSelected(null)}
            isPosting={approve.isPending}
          />
        ) : (
          <div className="card h-full flex flex-col overflow-hidden">
            {/* Feature showcase when no review selected */}
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-5">
                <Star size={28} className="text-amber-400" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Review Autopilot</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
                Ani monitors your Google My Business reviews 24/7 and handles responses automatically.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-sm text-left">
                {[
                  { star: '⭐⭐⭐⭐⭐', action: 'Auto-posted within 2 minutes', color: 'bg-green-50 border-green-100' },
                  { star: '⭐⭐⭐⭐', action: 'Auto-posted within 2 minutes', color: 'bg-green-50 border-green-100' },
                  { star: '⭐⭐⭐', action: 'Draft ready for your approval', color: 'bg-blue-50 border-blue-100' },
                  { star: '⭐⭐', action: 'Flagged urgent — needs personal touch', color: 'bg-red-50 border-red-100' },
                  { star: '⭐', action: 'Flagged urgent — needs personal touch', color: 'bg-red-50 border-red-100' },
                ].map(({ star, action, color }) => (
                  <div key={star} className={`rounded-xl border p-3 flex items-center justify-between gap-4 ${color}`}>
                    <span className="text-sm">{star}</span>
                    <span className="text-xs text-gray-600 font-medium">{action}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Connect Google My Business in Settings to activate
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
