import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'InterviewAI — AI Mock Interview Coach',
  description: 'Practice interviews with AI powered by HuggingFace. Upload your CV, pick a role, and get real-time feedback. Free, no subscription.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
