import { NextRequest, NextResponse } from 'next/server'
import { getToken, chatComplete, parseJSON } from '@/lib/hf'

export async function POST(req: NextRequest) {
  try {
    const { question, answer, position, hfToken } = await req.json()
    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer required' }, { status: 400 })
    }

    const token = getToken(hfToken)

    const raw = await chatComplete(token, [
      {
        role: 'system',
        content: `You are a senior interviewer coaching a candidate for "${position || 'a tech role'}".
Evaluate the answer briefly and constructively.
Output ONLY valid JSON, no markdown, no extra text.
Format: {"score": 7, "feedback": "2-3 sentence evaluation", "highlight": "one thing done well", "improve": "one concrete improvement"}
score is 1-10.`,
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nCandidate Answer: ${answer}`,
      },
    ], 512)

    const result = parseJSON<{ score: number; feedback: string; highlight: string; improve: string }>(raw)

    return NextResponse.json(result ?? {
      score: 6,
      feedback: 'Good attempt. Keep working on structure and specificity.',
      highlight: 'You engaged with the question.',
      improve: 'Add concrete examples to support your points.',
    })
  } catch (err: unknown) {
    console.error('evaluate-answer error:', err)
    return NextResponse.json({
      score: 6,
      feedback: 'Could not evaluate — please continue to the next question.',
      highlight: 'You completed your answer.',
      improve: 'Try to be more specific and concise.',
    })
  }
}
