import { NextRequest, NextResponse } from 'next/server'
import { getToken, chatComplete, parseJSON } from '@/lib/hf'

export async function POST(req: NextRequest) {
  try {
    const { questions, answers, position, style, hfToken } = await req.json()
    const token = getToken(hfToken)

    const qa = questions.map((q: { text: string }, i: number) => ({
      question: q.text,
      answer: answers[i]?.text || '(no answer given)',
      score: answers[i]?.score || 0,
    }))

    const avgScore = Math.round(qa.reduce((s: number, a: { score: number }) => s + a.score, 0) / qa.length * 10)

    const raw = await chatComplete(token, [
      {
        role: 'system',
        content: `You are a senior interview coach providing a post-interview assessment.
Output ONLY valid JSON, no markdown, no extra text.
Format: {
  "overallScore": 72,
  "grade": "Good",
  "strengths": "2-3 sentences on what the candidate did well",
  "improvements": "2-3 sentences on what to improve",
  "tips": "2-3 actionable tips for their next interview",
  "communication": "assessment of communication clarity and structure",
  "hiringRecommendation": "Hire",
  "hiringReason": "1 sentence justification"
}
overallScore is 0-100. grade is one of: Excellent, Good, Fair, Needs Work.
hiringRecommendation is one of: Hire, Consider, Pass.`,
      },
      {
        role: 'user',
        content: `Role: ${position}\nInterview style: ${style}\n\nQ&A:\n${JSON.stringify(qa, null, 2)}`,
      },
    ], 1024)

    const report = parseJSON<Record<string, unknown>>(raw)

    return NextResponse.json(report ?? {
      overallScore: avgScore,
      grade: avgScore >= 75 ? 'Good' : avgScore >= 55 ? 'Fair' : 'Needs Work',
      strengths: 'You completed the full interview and engaged with all questions.',
      improvements: 'Focus on structuring answers using the STAR method with concrete examples.',
      tips: 'Practice out loud, record yourself, and time your answers to keep them under 2 minutes.',
      communication: 'Work on being concise and leading with your conclusion first.',
      hiringRecommendation: avgScore >= 70 ? 'Consider' : 'Pass',
      hiringReason: 'Based on the answers provided in this session.',
    })
  } catch (err: unknown) {
    console.error('final-report error:', err)
    return NextResponse.json({
      overallScore: 65,
      grade: 'Fair',
      strengths: 'You completed the interview.',
      improvements: 'Continue practicing with mock interviews.',
      tips: 'Use the STAR method for behavioral questions.',
      communication: 'Work on clarity and structure.',
      hiringRecommendation: 'Consider',
      hiringReason: 'More preparation recommended.',
    })
  }
}
