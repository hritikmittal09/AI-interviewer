'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setActive(true)
      setError('')
    } catch {
      setError('Camera access denied')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Candidate View
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
          active
            ? 'bg-green-500/15 border border-green-500/30 text-green-400'
            : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-500'
        }`}>
          {active ? '● Live' : 'Off'}
        </span>
      </div>

      <div className="relative bg-bg aspect-[4/3] flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover scale-x-[-1] ${active ? 'block' : 'hidden'}`}
        />
        {!active && (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <Camera size={32} />
            <span className="text-sm">{error || 'Camera off'}</span>
          </div>
        )}
      </div>

      <button
        onClick={active ? stopCamera : startCamera}
        className="w-full py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-surface-2 transition flex items-center justify-center gap-2"
      >
        {active ? (
          <><CameraOff size={14} /> Disable Webcam</>
        ) : (
          <><Camera size={14} /> Enable Webcam</>
        )}
      </button>
    </div>
  )
}
