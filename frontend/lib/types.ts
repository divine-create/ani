export interface Message {
  id: string
  channel: 'gmail' | 'whatsapp'
  from_address: string
  from_name?: string
  subject?: string
  body: string
  received_at: string
  priority: 'urgent' | 'normal' | 'routine' | 'noise'
  intent: string
  status: 'pending' | 'auto_handled' | 'needs_review' | 'done'
  draft_reply?: string
  auto_sent: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  attendees: { name: string; email: string }[]
  meeting_brief?: string
  meet_link?: string
}

export interface Task {
  id: string
  notion_id?: string
  title: string
  status: 'open' | 'in_progress' | 'done' | 'waiting'
  priority: 'Urgent' | 'High' | 'Normal' | 'Low'
  due_date?: string
  source: string
  contact_name?: string
}

export interface Review {
  id: string
  gmb_review_id: string
  reviewer_name: string
  rating: number
  body: string
  published_at?: string
  draft_reply?: string
  reply_posted: boolean
  status: 'pending' | 'draft_ready' | 'posted' | 'needs_attention'
}

export interface Stats {
  auto_handled_today: number
  total_auto_handled: number
  time_saved_mins: number
  urgent_count: number
  needs_review: number
  open_tasks: number
  commitments_extracted: number
}

export interface MorningBrief {
  date: string
  total_decisions: number
  insight: string
  urgent_count: number
  auto_handled_count: number
  needs_review_count: number
  whatsapp_count: number
  events: { time: string; title: string }[]
  new_reviews: number
  urgent_reviews: number
}

export interface AgentEvent {
  type: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface Integration {
  id: string
  name: string
  connected: boolean
}
