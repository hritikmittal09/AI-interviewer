'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface Props {
  onTranscript: (text: string) => void
  hfToken: string
  disabled?: boolean
}

export default function AudioRecorder({ onTranscript, hfToken, disabled }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [liveText, setLiveText] = useState('')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [useWhisper, setUseWhisper] = useState(true)

  // Audio level meter
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)
  const [levels, setLevels] = useState<number[]>(Array(12).fill(2))

  // Setup Web Speech API as fallback
  useEffect(() => {
    const SR = (window as Window & typeof globalThis & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as Window & typeof globalThis & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (SR) {
      const r = new SR()
      r.continuous = true
      r.interimResults = true
      r.lang = 'en-US'
      r.onresult = (e: SpeechRecognitionEvent) => {
        let final = ''
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript
          else interim += e.results[i][0].transcript
        }
        setLiveText(prev => (prev + final + interim))
      }
      r.onerror = () => {}
      recognitionRef.current = r
    }
  }, [])

  function startAudioMeter(stream: MediaStream) {
    audioCtxRef.current = new AudioContext()
    analyserRef.current = audioCtxRef.current.createAnalyser()
    analyserRef.current.fftSize = 32
    const src = audioCtxRef.current.createMediaStreamSource(stream)
    src.connect(analyserRef.current)
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyserRef.current!.getByteFrequencyData(data)
      setLevels(Array.from(data.slice(0, 12)).map(v => Math.max(2, (v / 255) * 36)))
    }
    draw()
  }

  function stopAudioMeter() {
    cancelAnimationFrame(animFrameRef.current)
    audioCtxRef.current?.close().catch(() => {})
    setLevels(Array(12).fill(2))
  }

  const startRecording = useCallback(async () => {
    setError('')
    setLiveText('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startAudioMeter(stream)

      // Start Web Speech for live text
      recognitionRef.current?.start()

      if (useWhisper) {
        chunksRef.current = []
        const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' })
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        mr.start(250)
        mediaRecorderRef.current = mr
      }

      setState('recording')
    } catch {
      setError('Microphone access denied')
    }
  }, [useWhisper])

  const stopRecording = useCallback(async () => {
    stopAudioMeter()
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())

    if (!useWhisper) {
      setState('idle')
      onTranscript(liveText)
      return
    }

    setState('processing')

    try {
      const mr = mediaRecorderRef.current
      if (!mr) throw new Error('No recorder')

      await new Promise<void>(resolve => {
        mr.onstop = () => resolve()
        mr.stop()
      })

      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('hfToken', hfToken)

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.text) {
        onTranscript(data.text)
      } else if (liveText) {
        onTranscript(liveText) // fallback to web speech
      } else {
        setError('Could not transcribe — please type your answer')
      }
    } catch {
      if (liveText) onTranscript(liveText)
      else setError('Transcription failed — please type your answer')
    } finally {
      setState('idle')
    }
  }, [useWhisper, liveText, hfToken, onTranscript])

  const toggle = () => {
    if (state === 'idle') startRecording()
    else if (state === 'recording') stopRecording()
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={disabled || state === 'processing'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
            state === 'recording'
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-mic-ring'
              : state === 'processing'
              ? 'bg-violet-500/20 border border-violet-500/40 text-violet-400'
              : 'bg-bg-3 border border-border-2 text-zinc-300 hover:border-accent-2 hover:text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {state === 'processing' ? (
            <><Loader2 size={16} className="animate-spin" /> Transcribing...</>
          ) : state === 'recording' ? (
            <><MicOff size={16} /> Stop Recording</>
          ) : (
            <><Mic size={16} /> Record Answer</>
          )}
        </button>

        {/* Wave bars when recording */}
        {state === 'recording' && (
          <div className="flex items-center gap-[3px] h-6">
            {levels.slice(0, 8).map((h, i) => (
              <div
                key={i}
                className="wave-bar bg-red-400 rounded-sm"
                style={{ height: `${h}px`, transitionDuration: '80ms', transition: 'height' }}
              />
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-zinc-500 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={useWhisper}
            onChange={e => setUseWhisper(e.target.checked)}
            className="accent-violet-500"
          />
          Use Whisper AI
        </label>
      </div>

      {/* Live transcript preview */}
      {state === 'recording' && liveText && (
        <div className="bg-bg-3 border border-border rounded-xl px-3 py-2 text-sm text-zinc-400 italic">
          {liveText}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
