import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ text: '' })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return NextResponse.json({ text: data.text || '' })
  } catch (err) {
    console.error('parse-cv error:', err)
    return NextResponse.json({ text: '' })
  }
}
