import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function getAuthToken(): string | null {
  const header = api.defaults.headers.common['Authorization'] as string | undefined
  return header ? header.replace('Bearer ', '') : null
}

// Briefing
export function useBriefing() {
  return useQuery({
    queryKey: ['briefing'],
    queryFn: () => api.get('/api/briefing').then(r => r.data),
    refetchInterval: 60_000,
  })
}

export function useTriggerBriefing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/briefing/run'),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ['briefing'] }), 3000),
  })
}

// Inbox
export function useInbox(channel?: string, priority?: string) {
  return useQuery({
    queryKey: ['inbox', channel, priority],
    queryFn: () => api.get('/api/inbox', { params: { channel, priority } }).then(r => r.data),
    refetchInterval: 30_000,
  })
}

export function useApproveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, editedDraft }: { id: string; editedDraft?: string }) =>
      api.post(`/api/inbox/${id}/approve`, { edited_draft: editedDraft }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  })
}

export function useDismissMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/inbox/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  })
}

export function useSyncInbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/inbox/sync'),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ['inbox'] }), 5000),
  })
}

// Calendar
export function useCalendar() {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: () => api.get('/api/calendar').then(r => r.data),
    refetchInterval: 300_000,
  })
}

export function useGenerateBrief() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => api.post(`/api/calendar/${eventId}/brief/generate`),
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ['calendar'] }), 3000)
      setTimeout(() => qc.invalidateQueries({ queryKey: ['calendar'] }), 8000)
    },
  })
}

// Tasks
export function useTasks(status?: string) {
  return useQuery({
    queryKey: ['tasks', status],
    queryFn: () => api.get('/api/tasks', { params: { status } }).then(r => r.data),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; priority?: string; source?: string; description?: string; due_date?: string }) =>
      api.post('/api/tasks', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

// Reviews
export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: () => api.get('/api/reviews').then(r => r.data),
    refetchInterval: 60_000,
  })
}

export function useApproveReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, replyText }: { id: string; replyText: string }) =>
      api.post(`/api/reviews/${id}/approve`, { reply_text: replyText }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  })
}

// Settings
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/api/settings/integrations').then(r => r.data),
  })
}

export function useSaveIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { service: string; api_key?: string; extra_data?: Record<string, string> }) =>
      api.post('/api/settings/integrations', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get('/api/settings/rules').then(r => r.data),
  })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      name: string
      channel: string
      condition_type: string
      condition_value: string
      action: string
      action_template?: string
    }) => api.post('/api/settings/rules', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/settings/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  })
}

// Stats
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/stats').then(r => r.data),
    refetchInterval: 60_000,
  })
}

// Search
export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get('/api/search', { params: { q } }).then(r => r.data),
    enabled: q.length >= 2,
    staleTime: 10_000,
  })
}

// Writing style
export function useWritingStyle() {
  return useQuery({
    queryKey: ['writing-style'],
    queryFn: () => api.get('/api/settings/writing-style').then(r => r.data),
  })
}

export function useSaveWritingStyle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (samples: string[]) =>
      api.post('/api/settings/writing-style', { samples }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['writing-style'] }),
  })
}

// Auto-reply toggle
export function useAutoReply() {
  return useQuery({
    queryKey: ['auto-reply'],
    queryFn: () => api.get('/api/settings/auto-reply').then(r => r.data),
  })
}

export function useSetAutoReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api.post('/api/settings/auto-reply', { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-reply'] }),
  })
}
