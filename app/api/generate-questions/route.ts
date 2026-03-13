import { NextRequest, NextResponse } from 'next/server'
import { getToken, chatComplete, parseJSON } from '@/lib/hf'
import { Question } from '@/lib/store'

export async function POST(req: NextRequest) {
  try {
    const { cvText, position, style, difficulty, numQuestions, hfToken } = await req.json()

    if (!position) return NextResponse.json({ error: 'Position is required' }, { status: 400 })

    const token = getToken(hfToken)
    if (!token) return NextResponse.json({ error: 'HuggingFace token is required' }, { status: 401 })

    const styleMap: Record<string, string> = {
      technical: 'technical and coding questions about skills and problem-solving',
      behavioral: 'behavioral questions using the STAR method (Situation, Task, Action, Result)',
      mixed: 'a balanced mix of technical and behavioral questions',
      case: 'case study and analytical problem-solving questions',
      hr: 'HR, culture-fit and situational judgement questions',
    }
    const diffMap: Record<string, string> = {
      entry: 'entry-level candidate (0–2 years experience)',
      mid: 'mid-level candidate (2–5 years experience)',
      senior: 'senior-level candidate (5–8 years experience)',
      staff: 'staff/principal-level candidate (8+ years experience)',
    }

    const cvContext = cvText
      ? `\n\nCandidate CV:\n${cvText.slice(0, 2500)}`
      : '\n\nNo CV provided — generate general questions for the role.'

    const raw = await chatComplete(token, [
      {
        role: 'system',
        content: `You are an expert technical interviewer at a top tech company.
Generate exactly ${numQuestions} realistic interview questions.
Output ONLY a valid JSON array, no explanation, no markdown.
Format: [{"id":1,"text":"question here","type":"technical","tip":"what a great answer covers"}]
type must be one of: technical, behavioral, situational, hr`,
      },
      {
        role: 'user',
        content: `Generate ${numQuestions} ${styleMap[style] || styleMap.mixed} for a ${diffMap[difficulty] || diffMap.mid} applying for: "${position}".${cvContext}`,
      },
    ], 2048)

    const questions = parseJSON<Question[]>(raw)

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ questions: fallbackQuestions(style, numQuestions) })
    }

    return NextResponse.json({ questions: questions.slice(0, numQuestions) })
  } catch (err: unknown) {
    console.error('generate-questions error:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate questions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function fallbackQuestions(style: string, count: number): Question[] {
  const technical = [
    "Walk me through your technical background and the projects you're most proud of.",
    'Describe a complex technical problem you solved. What was your approach?',
    'How do you approach system design for a large-scale application?',
    'What is your experience with testing and code quality practices?',
    'Tell me about a time you had to learn a new technology quickly.',
    'How do you handle performance bottlenecks in your applications?',
    'Explain a time you refactored legacy code. What was the process?',
    'How do you stay current with new technologies and best practices?',
  ]
  const behavioral = [
    'Tell me about a time you led a project under tight deadlines.',
    'Describe a conflict with a teammate and how you resolved it.',
    'Give an example of when you failed and what you learned.',
    'Tell me about your proudest professional achievement.',
    'How do you prioritize when you have multiple urgent tasks?',
    'Describe a time you had to influence someone without direct authority.',
    'Tell me about a time you received tough feedback. How did you respond?',
    'Give an example of going above and beyond for a project or customer.',
  ]
  const pool = style === 'technical' ? technical : behavioral
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    text: pool[i % pool.length],
    type: i % 2 === 0 ? 'technical' : 'behavioral',
    tip: 'Be specific, use concrete examples, and structure your answer clearly.',
  }))
}
