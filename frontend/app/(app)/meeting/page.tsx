'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  Mic, Upload, CheckCircle2, AlertCircle, Loader2,
  ListTodo, Mail, Calendar, ChevronRight, Sparkles, FileAudio,
} from 'lucide-react'

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'failed'

interface ActionItem {
  title: string
  owner: string
  due_date: string | null
  priority: string
}

interface FollowUpEmail {
  to_name: string
  to_email: string
  subject: string
  body: string
}

interface Extracted {
  title?: string
  participants?: string[]
  summary?: string
  action_items?: ActionItem[]
  follow_up_emails?: FollowUpEmail[]
  commitments_made?: string[]
  next_meeting?: { suggested: boolean; title: string; suggested_timeframe: string }
}

interface MeetingResult {
  id: string
  status: string
  filename: string
  summary: string
  extracted: Extracted
}

const STEPS = [
  { key: 'uploading', label: 'Uploading recording…' },
  { key: 'processing', label: 'Gemini is listening…' },
  { key: 'done', label: 'Analysis complete' },
]

export default function MeetingPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }

  useEffect(() => {
    if (!meetingId || status !== 'processing') return

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/meetings/${meetingId}`)
        const data = res.data
        if (data.status === 'done') {
          stopPolling()
          setResult(data)
          setStatus('done')
        } else if (data.status === 'failed') {
          stopPolling()
          setError(data.summary || 'Analysis failed')
          setStatus('failed')
        }
      } catch {
        stopPolling()
        setStatus('failed')
        setError('Could not reach server')
      }
    }, 3000)

    return stopPolling
  }, [meetingId, status])

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setStatus('uploading')
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/api/meetings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMeetingId(res.data.meeting_id)
      setStatus('processing')
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Upload failed'
      setError(msg)
      setStatus('failed')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.webm'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles: 1,
    disabled: status !== 'idle' && status !== 'failed',
  })

  const reset = () => {
    stopPolling()
    setStatus('idle')
    setMeetingId(null)
    setResult(null)
    setError(null)
  }

  const extracted = result?.extracted ?? {}
  const actionItems = extracted.action_items ?? []
  const followUps = extracted.follow_up_emails ?? []
  const commitments = extracted.commitments_made ?? []

  const currentStep = STEPS.findIndex(s => s.key === status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-indigo-400" />
          <h1 className="text-xl font-bold text-gray-900">Meeting Intelligence</h1>
        </div>
        <p className="text-sm text-gray-500">
          Drop any meeting recording. Gemini listens, extracts action items, drafts follow-up emails, and populates your dashboard automatically.
        </p>
      </div>

      {/* Upload zone */}
      {(status === 'idle' || status === 'failed') && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <FileAudio size={24} className="text-indigo-500" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">
            {isDragActive ? 'Drop it here' : 'Drop your meeting recording'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            MP3, MP4, M4A, WAV, OGG, FLAC, WebM — any audio or video
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            <Upload size={14} />
            Choose file
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-500 flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>
      )}

      {/* Processing progress */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <Loader2 size={24} className="text-indigo-500 animate-spin" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-6">
            {status === 'uploading' ? 'Uploading your recording…' : 'Gemini is analyzing your meeting…'}
          </h2>
          <div className="space-y-3 max-w-xs mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < currentStep ? 'bg-green-100' :
                  i === currentStep ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  {i < currentStep ? (
                    <CheckCircle2 size={12} className="text-green-600" />
                  ) : i === currentStep ? (
                    <Loader2 size={12} className="text-indigo-500 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={`text-sm ${
                  i <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-400">This usually takes 30–60 seconds</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {extracted.title || result.filename}
                </h2>
                {extracted.participants && extracted.participants.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {extracted.participants.join(', ')}
                  </p>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                <CheckCircle2 size={12} /> Done
              </span>
            </div>
            {result.summary && (
              <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ListTodo, label: 'Tasks created', value: actionItems.length, color: 'indigo' },
              { icon: Mail, label: 'Drafts ready', value: followUps.length, color: 'purple' },
              { icon: Calendar, label: 'Commitments', value: commitments.length, color: 'blue' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={16} className={`text-${color}-500`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Action items */}
          {actionItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <ListTodo size={14} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-800">Action Items → added to Tasks</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {actionItems.map((item, i) => (
                  <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      item.priority === 'High' ? 'bg-red-400' :
                      item.priority === 'Low' ? 'bg-gray-300' : 'bg-indigo-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.owner && `${item.owner} · `}
                        {item.due_date || 'No due date'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.priority === 'High' ? 'bg-red-50 text-red-600' :
                      item.priority === 'Low' ? 'bg-gray-100 text-gray-500' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>{item.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up emails */}
          {followUps.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <Mail size={14} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-800">Follow-up Emails → drafts in Inbox</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {followUps.map((email, i) => (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{email.subject}</p>
                      <span className="text-xs text-gray-400">{email.to_name}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{email.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commitments */}
          {commitments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">Commitments Tracked</h3>
              </div>
              <div className="px-5 py-3 space-y-2">
                {commitments.map((c, i) => (
                  <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>
                    {c}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/tasks')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <ListTodo size={15} /> View Tasks
            </button>
            <button
              onClick={() => router.push('/inbox')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Mail size={15} /> Review Drafts
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-white border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              New
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
