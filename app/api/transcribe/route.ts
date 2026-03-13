import { NextRequest, NextResponse } from 'next/server'
import { getToken, transcribeAudio } from '@/lib/hf'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const hfToken = formData.get('hfToken') as string | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const token = getToken(hfToken || undefined)
    const buffer = await audioFile.arrayBuffer()
    const blob = new Blob([buffer], { type: audioFile.type || 'audio/webm' })

    const text = await transcribeAudio(token, blob)
    return NextResponse.json({ text })
  } catch (err: unknown) {
    console.error('transcribe error:', err)
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
