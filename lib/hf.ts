/**
 * HuggingFace Inference Router
 * Unified endpoint: https://router.huggingface.co/v1/chat/completions
 * Model format:  "org/model-name:provider"
 *
 * Docs: https://huggingface.co/docs/inference-providers/en/index
 */

const HF_BASE = 'https://router.huggingface.co/v1'

// Model + provider combos — use :auto to let HF pick the fastest available provider
// Or pin a free provider: cerebras, sambanova, together, nebius, novita, groq, fireworks-ai
export const CHAT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3:cerebras'
export const CHAT_MODEL_FALLBACK = 'meta-llama/Llama-3.1-8B-Instruct:sambanova'
export const CHAT_MODEL_FALLBACK2 = 'mistralai/Mistral-7B-Instruct-v0.3:auto'

// Whisper via hf-inference (binary POST, separate path)
export const STT_MODEL = 'openai/whisper-large-v3'
export const STT_URL = `https://router.huggingface.co/hf-inference/models/${STT_MODEL}`

export function getToken(token?: string): string {
  return (token || process.env.HUGGINGFACE_API_TOKEN || '').trim()
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Chat completions — OpenAI-compatible via HF Router
 * model format: "org/repo:provider" or "org/repo:auto"
 */
export async function chatComplete(
  token: string,
  messages: ChatMessage[],
  maxTokens = 1024,
  model = CHAT_MODEL
): Promise<string> {
  const res = await fetch(`${HF_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } | string }
    const msg = typeof body.error === 'string'
      ? body.error
      : (body.error as { message?: string })?.message || `HF Router ${res.status}`

    // Try fallbacks in order
    if (model === CHAT_MODEL) {
      console.warn(`[HF] ${msg} — trying fallback model`)
      return chatComplete(token, messages, maxTokens, CHAT_MODEL_FALLBACK)
    }
    if (model === CHAT_MODEL_FALLBACK) {
      console.warn(`[HF] fallback failed — trying :auto`)
      return chatComplete(token, messages, maxTokens, CHAT_MODEL_FALLBACK2)
    }
    throw new Error(msg)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

/**
 * Whisper speech-to-text — binary audio body
 */
export async function transcribeAudio(token: string, audioBlob: Blob): Promise<string> {
  const res = await fetch(STT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': audioBlob.type || 'audio/webm',
    },
    body: audioBlob,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error || `Whisper error ${res.status}`)
  }

  const data = await res.json() as { text?: string }
  return data.text?.trim() ?? ''
}

/**
 * Safely parse JSON from LLM output (handles markdown fences, extra text)
 */
export function parseJSON<T>(text: string): T | null {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Grab the first complete JSON array or object
  const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/m)
  if (!match) return null

  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}
