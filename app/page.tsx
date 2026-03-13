'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { BrainCircuit, Upload, ChevronRight, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { saveSession } from '@/lib/store'

type InterviewStyle = 'technical' | 'behavioral' | 'mixed' | 'case' | 'hr'
type Difficulty = 'entry' | 'mid' | 'senior' | 'staff'

const STYLES = [
  { value: 'technical', label: 'Technical', icon: '⚙️', desc: 'Coding & systems' },
  { value: 'behavioral', label: 'Behavioral', icon: '🎯', desc: 'STAR method' },
  { value: 'mixed', label: 'Mixed', icon: '⚡', desc: 'Both types' },
  { value: 'case', label: 'Case Study', icon: '🔍', desc: 'Problem solving' },
  { value: 'hr', label: 'HR / Culture', icon: '🤝', desc: 'Culture fit' },
]

const DIFFICULTIES = [
  { value: 'entry', label: 'Entry', years: '0–2 yrs' },
  { value: 'mid', label: 'Mid', years: '2–5 yrs' },
  { value: 'senior', label: 'Senior', years: '5–8 yrs' },
  { value: 'staff', label: 'Staff', years: '8+ yrs' },
]

export default function HomePage() {
  const router = useRouter()
  const [hfToken, setHfToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [position, setPosition] = useState('')
  const [style, setStyle] = useState<InterviewStyle>('mixed')
  const [difficulty, setDifficulty] = useState<Difficulty>('mid')
  const [numQuestions, setNumQuestions] = useState(8)
  const [cvText, setCvText] = useState('')
  const [cvFileName, setCvFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cvParsing, setCvParsing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setCvFileName(file.name)
    setCvParsing(true)
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-cv', { method: 'POST', body: formData })
        const data = await res.json()
        setCvText(data.text || '')
      } else {
        setCvText(await file.text())
      }
    } catch {
      setCvText('[CV parsing failed — questions will be role-based only]')
    } finally {
      setCvParsing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  async function handleStart() {
    if (!hfToken.trim()) { setError('Please enter your HuggingFace API token.'); return }
    if (!position.trim()) { setError('Please enter the position you\'re applying for.'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, position, style, difficulty, numQuestions, hfToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions')

      saveSession({
        config: { cvText, cvFileName, position, style, difficulty, numQuestions },
        questions: data.questions,
        answers: [],
        startedAt: Date.now(),
      })

      // Store token temporarily in sessionStorage (not localStorage for security)
      sessionStorage.setItem('hf_token', hfToken)
      router.push('/interview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background orbs */}
      <div className="glow-orb w-96 h-96 bg-violet-600/20 top-[-10%] left-[-10%]" />
      <div className="glow-orb w-80 h-80 bg-teal-500/15 bottom-[-5%] right-[-5%]" />

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-teal-500 mb-4 shadow-lg shadow-violet-500/30">
          <BrainCircuit size={30} className="text-white" />
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Interview<span className="text-accent-3">AI</span>
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          AI-powered mock interviews · Powered by HuggingFace · Free forever
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-teal-500/5 pointer-events-none" />

        {/* HF Token */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            HuggingFace API Token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={hfToken}
              onChange={e => setHfToken(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-bg-3 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20 transition pr-10"
            />
            <button
              onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">
            Free token at{' '}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noreferrer"
              className="text-accent-4 hover:underline"
            >
              huggingface.co/settings/tokens
            </a>
            {' '}· Stays in your browser only
          </p>
        </div>

        {/* CV Upload */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            CV / Resume <span className="text-zinc-600 normal-case font-normal">(optional but recommended)</span>
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-accent-2 bg-accent-2/5'
                : cvFileName
                ? 'border-teal-2/40 bg-teal-2/5'
                : 'border-border-2 hover:border-accent-2 hover:bg-accent-2/5'
            }`}
          >
            <input {...getInputProps()} />
            {cvParsing ? (
              <div className="flex items-center justify-center gap-2 text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Parsing CV...</span>
              </div>
            ) : cvFileName ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={16} className="text-teal-2" />
                <span className="text-sm text-teal-3 font-medium">{cvFileName}</span>
              </div>
            ) : (
              <>
                <Upload size={22} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">Drop your CV here or click to browse</p>
                <p className="text-xs text-zinc-600 mt-1">PDF or TXT</p>
              </>
            )}
          </div>
        </div>

        {/* Position */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            Position You&apos;re Applying For
          </label>
          <input
            type="text"
            value={position}
            onChange={e => setPosition(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer at Google"
            className="w-full bg-bg-3 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20 transition"
          />
        </div>

        {/* Interview Style */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            Interview Style
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value as InterviewStyle)}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition ${
                  style === s.value
                    ? 'border-accent-2 bg-accent-2/15 text-white'
                    : 'border-border bg-bg-3 text-zinc-500 hover:border-border-2 hover:text-zinc-300'
                }`}
              >
                <span className="text-base mb-0.5">{s.icon}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty + Questions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Level
            </label>
            <div className="grid grid-cols-2 gap-1">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value as Difficulty)}
                  className={`p-2 rounded-xl border text-center transition ${
                    difficulty === d.value
                      ? 'border-accent-2 bg-accent-2/15 text-white'
                      : 'border-border bg-bg-3 text-zinc-500 hover:border-border-2'
                  }`}
                >
                  <div className="text-xs font-semibold">{d.label}</div>
                  <div className="text-xs text-zinc-600">{d.years}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Questions
            </label>
            <div className="flex flex-col gap-1">
              {[5, 8, 12].map(n => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={`p-2 rounded-xl border text-center text-xs transition ${
                    numQuestions === n
                      ? 'border-accent-2 bg-accent-2/15 text-white'
                      : 'border-border bg-bg-3 text-zinc-500 hover:border-border-2'
                  }`}
                >
                  {n} questions · ~{n * 3} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-700 to-violet-600 hover:from-violet-600 hover:to-violet-500 text-white font-display font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40 hover:shadow-violet-700/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              Start Mock Interview
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </main>
  )
}
