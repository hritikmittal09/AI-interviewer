'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, RotateCcw, Loader2, TrendingUp, AlertCircle, Lightbulb, MessageSquare, Award } from 'lucide-react'
import { loadSession, clearSession } from '@/lib/store'

interface Report {
  overallScore: number
  grade: string
  strengths: string
  improvements: string
  tips: string
  communication: string
  hiringRecommendation: string
  hiringReason: string
}

export default function ResultsPage() {
  const router = useRouter()
  const session = loadSession()
  const hfToken = typeof window !== 'undefined' ? sessionStorage.getItem('hf_token') || '' : ''
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    generateReport()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateReport() {
    try {
      const res = await fetch('/api/final-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: session?.questions,
          answers: session?.answers,
          position: session?.config?.position,
          style: session?.config?.style,
          hfToken,
        }),
      })
      const data = await res.json()
      setReport(data)
    } catch {
      setReport({
        overallScore: 65,
        grade: 'Fair',
        strengths: 'You completed the full interview session.',
        improvements: 'Focus on structuring answers using the STAR method.',
        tips: 'Practice out loud. Time yourself. Get feedback from peers.',
        communication: 'Work on being concise and specific.',
        hiringRecommendation: 'Consider',
        hiringReason: 'More preparation recommended before a real interview.',
      })
    } finally {
      setLoading(false)
    }
  }

  function startNew() {
    clearSession()
    sessionStorage.removeItem('hf_token')
    router.push('/')
  }

  if (!session) return null

  const { questions, answers, config } = session
  const avgScore = answers.length > 0
    ? Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length * 10)
    : 0

  const gradeConfig = (grade: string) => {
    if (grade === 'Excellent') return { color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' }
    if (grade === 'Good') return { color: 'text-violet-300', bg: 'bg-violet-500/15 border-violet-500/30' }
    if (grade === 'Fair') return { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' }
    return { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' }
  }

  const hiringColor = (rec: string) => {
    if (rec === 'Hire') return 'bg-green-500/15 border-green-500/30 text-green-400'
    if (rec === 'Consider') return 'bg-amber-500/15 border-amber-500/30 text-amber-400'
    return 'bg-red-500/15 border-red-500/30 text-red-400'
  }

  const score = report?.overallScore ?? avgScore
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <main className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-teal-500 mb-3">
            <BrainCircuit size={22} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">
            Interview Complete
          </h1>
          <p className="text-zinc-400 text-sm">{config?.position}</p>
        </div>

        {/* Score hero */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-teal-500/5 pointer-events-none" />

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-zinc-400 py-8">
              <Loader2 size={20} className="animate-spin" />
              <span>Generating your report...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="score-ring-path transition-all duration-1000"
                    style={{ '--offset': offset } as React.CSSProperties}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-display text-4xl font-extrabold">{score}</span>
                  <span className="text-xs text-zinc-500">/ 100</span>
                </div>
              </div>

              {report && (
                <>
                  <div className={`inline-flex px-4 py-1.5 rounded-full border text-sm font-bold mb-3 ${gradeConfig(report.grade).bg} ${gradeConfig(report.grade).color}`}>
                    {report.grade}
                  </div>
                  <div className="mb-3">
                    <Award size={14} className="inline mr-1.5 text-zinc-500" />
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${hiringColor(report.hiringRecommendation)}`}>
                      {report.hiringRecommendation}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">{report.hiringReason}</p>
                </>
              )}
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Questions" value={String(questions.length)} />
          <StatCard label="Answered" value={String(answers.length)} />
          <StatCard
            label="Avg Score"
            value={answers.length > 0 ? `${Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length * 10) / 10}/10` : '—'}
          />
        </div>

        {/* Feedback grid */}
        {report && !loading && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FeedbackCard icon={<TrendingUp size={14} />} title="Strengths" color="green">
              {report.strengths}
            </FeedbackCard>
            <FeedbackCard icon={<AlertCircle size={14} />} title="Improve" color="amber">
              {report.improvements}
            </FeedbackCard>
            <FeedbackCard icon={<Lightbulb size={14} />} title="Tips" color="violet">
              {report.tips}
            </FeedbackCard>
            <FeedbackCard icon={<MessageSquare size={14} />} title="Communication" color="teal">
              {report.communication}
            </FeedbackCard>
          </div>
        )}

        {/* Q&A Review */}
        <div className="mb-6">
          <h2 className="font-display font-bold text-lg mb-3">Question Review</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const ans = answers[i]
              const s = ans?.score ?? 0
              const scoreColor = s >= 8 ? 'text-green-400 bg-green-500/15 border-green-500/30'
                : s >= 6 ? 'text-violet-300 bg-violet-500/15 border-violet-500/30'
                : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
              return (
                <div key={i} className="bg-surface border border-border rounded-2xl p-4 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-violet-300 leading-relaxed">{q.text}</p>
                    {ans && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${scoreColor}`}>
                        {s}/10
                      </span>
                    )}
                  </div>
                  {ans ? (
                    <>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-1.5">
                        <span className="text-zinc-600">Your answer: </span>{ans.text}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        <span className="text-zinc-600">Feedback: </span>{ans.feedback}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">No answer recorded</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={startNew}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white font-display font-bold rounded-xl transition hover:-translate-y-0.5 shadow-lg shadow-violet-900/40"
        >
          <RotateCcw size={16} />
          Start New Interview
        </button>
        <div className="h-8" />
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="font-display font-bold text-lg">{value}</div>
    </div>
  )
}

function FeedbackCard({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode
}) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    teal: 'text-teal-3 bg-teal-500/10 border-teal-500/20',
  }
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2 ${colorMap[color]?.split(' ')[0]}`}>
        {icon} {title}
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{children as string}</p>
    </div>
  )
}
