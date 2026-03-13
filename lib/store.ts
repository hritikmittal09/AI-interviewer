'use client'

export interface Question {
  id: number
  text: string
  type: 'technical' | 'behavioral' | 'situational' | 'hr'
  tip: string
}

export interface Answer {
  questionId: number
  text: string
  score: number
  feedback: string
  duration: number // seconds
}

export interface InterviewConfig {
  cvText: string
  cvFileName: string
  position: string
  style: 'technical' | 'behavioral' | 'mixed' | 'case' | 'hr'
  difficulty: 'entry' | 'mid' | 'senior' | 'staff'
  numQuestions: number
}

export interface InterviewSession {
  config: InterviewConfig
  questions: Question[]
  answers: Answer[]
  startedAt: number
  endedAt?: number
}

const SESSION_KEY = 'interview_ai_session'

export function saveSession(session: Partial<InterviewSession>) {
  if (typeof window === 'undefined') return
  const existing = loadSession()
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...session }))
}

export function loadSession(): InterviewSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
