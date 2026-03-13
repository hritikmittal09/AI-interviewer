'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Clock, ChevronRight, X, Volume2, VolumeX } from 'lucide-react'
import { loadSession, saveSession, Answer } from '@/lib/store'
import WebcamFeed from '@/components/WebcamFeed'
import AudioRecorder from '@/components/AudioRecorder'

interface FeedbackBubble {
  score: number
  feedback: string
  highlight: string
  improve: string
}

export default function InterviewPage() {
  const router = useRouter()
  const session = loadSession()
  const hfToken = typeof window !== 'undefined' ? sessionStorage.getItem('hf_token') || '' : ''

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(session?.answers || [])
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackBubble | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [questionStart, setQuestionStart] = useState(Date.now())
  const chatRef = useRef<HTMLDivElement>(null)

  const questions = session?.questions || []
  const config = session?.config

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Speak question via TTS
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.92
    utt.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'))
    if (voice) utt.voice = voice
    window.speechSynthesis.speak(utt)
  }, [ttsEnabled])

  // Speak first question on mount
  useEffect(() => {
    if (questions.length > 0) {
      setTimeout(() => speak(questions[0].text), 800)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [answers, feedback, answerText])

  if (!session || questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No session found.</p>
          <button onClick={() => router.push('/')} className="text-accent-3 hover:underline">
            ← Go back to setup
          </button>
        </div>
      </main>
    )
  }

  const question = questions[currentQ]
  const isLastQuestion = currentQ === questions.length - 1
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  async function submitAnswer() {
    if (!answerText.trim()) return
    setSubmitting(true)
    setFeedback(null)

    const duration = Math.round((Date.now() - questionStart) / 1000)

    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.text,
          answer: answerText,
          position: config?.position,
          hfToken,
        }),
      })
      const fb: FeedbackBubble = await res.json()
      setFeedback(fb)

      const newAnswer: Answer = {
        questionId: question.id,
        text: answerText,
        score: fb.score,
        feedback: fb.feedback,
        duration,
      }
      const updatedAnswers = [...answers, newAnswer]
      setAnswers(updatedAnswers)
      saveSession({ answers: updatedAnswers })

      if (ttsEnabled) speak(fb.feedback)
    } catch {
      const newAnswer: Answer = {
        questionId: question.id,
        text: answerText,
        score: 6,
        feedback: 'Good attempt! Moving on.',
        duration,
      }
      setAnswers(prev => [...prev, newAnswer])
    } finally {
      setSubmitting(false)
    }
  }

  function nextQuestion() {
    if (isLastQuestion) {
      router.push('/results')
      return
    }
    const nextIdx = currentQ + 1
    setCurrentQ(nextIdx)
    setAnswerText('')
    setFeedback(null)
    setQuestionStart(Date.now())
    speak(questions[nextIdx].text)
  }

  function endInterview() {
    router.push('/results')
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg-2/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-accent-3" />
            <span className="font-display font-bold text-sm">Interview<span className="text-accent-3">AI</span></span>
          </div>
          <div className="h-4 w-px bg-border-2" />
          <span className="text-xs text-zinc-400 max-w-[200px] truncate">{config?.position}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            Q{currentQ + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-1.5 bg-bg-3 border border-border rounded-lg px-2.5 py-1">
            <Clock size={12} className="text-zinc-500" />
            <span className="font-mono text-xs font-medium text-zinc-300">{fmt(elapsed)}</span>
          </div>
          <button
            onClick={() => { setTtsEnabled(v => !v); window.speechSynthesis.cancel() }}
            className="p-1.5 rounded-lg bg-bg-3 border border-border text-zinc-500 hover:text-zinc-200 transition"
            title={ttsEnabled ? 'Mute TTS' : 'Enable TTS'}
          >
            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={endInterview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition"
          >
            <X size={12} /> End
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 p-4 max-w-6xl mx-auto w-full">

        {/* Chat column */}
        <div className="flex flex-col bg-surface border border-border rounded-2xl overflow-hidden min-h-0">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Live Interview
            </span>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 360px)' }}>
            {/* Past Q&As */}
            {answers.map((ans, i) => (
              <div key={i} className="space-y-3">
                <Bubble role="ai" avatar="AI">
                  <span className="text-xs text-zinc-500 block mb-1">Question {i + 1}</span>
                  {questions[i]?.text}
                </Bubble>
                <Bubble role="user" avatar="👤">
                  {ans.text}
                </Bubble>
                <Bubble role="ai" avatar="AI">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold mb-1.5">
                    <ScoreChip score={ans.score} />
                  </span>
                  <p className="text-sm text-zinc-300">{ans.feedback}</p>
                </Bubble>
              </div>
            ))}

            {/* Current question */}
            {!feedback && (
              <Bubble role="ai" avatar="AI">
                <span className="text-xs text-zinc-500 block mb-1">
                  Question {currentQ + 1} · <span className="capitalize">{question.type}</span>
                </span>
                <p>{question.text}</p>
              </Bubble>
            )}

            {/* Inline feedback after submitting */}
            {feedback && (
              <>
                <Bubble role="user" avatar="👤">
                  {answerText}
                </Bubble>
                <Bubble role="ai" avatar="AI">
                  <ScoreChip score={feedback.score} />
                  <p className="mt-2 text-sm text-zinc-300">{feedback.feedback}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-xs text-green-400">
                      <span className="font-semibold block mb-0.5">✓ Strong</span>
                      {feedback.highlight}
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-xs text-amber-400">
                      <span className="font-semibold block mb-0.5">↑ Improve</span>
                      {feedback.improve}
                    </div>
                  </div>
                </Bubble>
              </>
            )}

            {/* Typing indicator */}
            {submitting && (
              <div className="flex items-center gap-2 pl-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white">AI</div>
                <div className="bg-bg-3 border border-border rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4 space-y-3 bg-bg-2">
            {!feedback ? (
              <>
                <AudioRecorder
                  onTranscript={t => setAnswerText(prev => prev ? prev + ' ' + t : t)}
                  hfToken={hfToken}
                  disabled={submitting}
                />
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Type or dictate your answer here..."
                  rows={3}
                  className="w-full bg-bg-3 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20 resize-none transition"
                />
                <button
                  onClick={submitAnswer}
                  disabled={!answerText.trim() || submitting}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white font-semibold text-sm rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Evaluating...' : 'Submit Answer'} <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={nextQuestion}
                className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-semibold text-sm rounded-xl transition"
              >
                {isLastQuestion ? 'Finish Interview & See Results →' : `Next Question (${currentQ + 2}/${questions.length}) →`}
              </button>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3">
          <WebcamFeed />

          {/* Progress */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Progress</p>
            <div className="space-y-1.5">
              {questions.map((q, i) => {
                const done = i < currentQ || (i === currentQ && !!feedback)
                const current = i === currentQ && !feedback
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      done ? 'bg-green-500/20 text-green-400' :
                      current ? 'bg-violet-500/25 text-violet-300' :
                      'bg-bg-3 text-zinc-600'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs truncate ${
                      current ? 'text-zinc-200 font-medium' :
                      done ? 'text-zinc-500' : 'text-zinc-600'
                    }`}>
                      {q.type}
                    </span>
                    {done && answers[i] && (
                      <span className="ml-auto text-xs font-bold text-green-400">{answers[i].score}/10</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tip for current question */}
          {question.tip && !feedback && (
            <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-3.5">
              <p className="text-xs font-semibold text-violet-400 mb-1">💡 Interviewer tip</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{question.tip}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Bubble({ role, avatar, children }: { role: 'ai' | 'user'; avatar: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-2.5 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
        role === 'ai'
          ? 'bg-gradient-to-br from-violet-600 to-teal-500 text-white'
          : 'bg-bg-3 border border-border-2'
      }`}>
        {avatar}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        role === 'ai'
          ? 'bg-bg-3 border border-border rounded-tl-sm text-zinc-200'
          : 'bg-violet-500/15 border border-violet-500/30 rounded-tr-sm text-zinc-100'
      }`}>
        {children}
      </div>
    </div>
  )
}

function ScoreChip({ score }: { score: number }) {
  const color = score >= 8 ? 'text-green-400 bg-green-500/15 border-green-500/30'
    : score >= 6 ? 'text-violet-300 bg-violet-500/15 border-violet-500/30'
    : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      {score}/10
    </span>
  )
}
