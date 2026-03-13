# 🎯 InterviewAI — AI Mock Interview Coach

A full-stack Next.js app for AI-powered mock interviews. **100% free, no subscription required.**

Uses:
- **HuggingFace Router API** (`router.huggingface.co`) for all AI inference
- **Mistral-7B-Instruct** via Nebius provider for question generation and feedback
- **OpenAI Whisper Large v3** via HF Inference provider for speech-to-text
- **Web Speech API** as real-time live-transcript fallback
- **WebRTC MediaDevices** for webcam preview

> ⚠️ Note: The old `api-inference.huggingface.co` endpoint is deprecated. This app uses the new `router.huggingface.co` endpoint with the OpenAI-compatible chat completions format.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your HuggingFace token

Get a free token at https://huggingface.co/settings/tokens (free account, no credit card needed)

```bash
cp .env.local.example .env.local
# Edit .env.local:
# HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Users can also paste their token directly in the app UI — it's never stored, only kept in sessionStorage for the active session.

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## 🔌 API Endpoints Used

| Route | HF Endpoint | Model |
|---|---|---|
| Text generation | `router.huggingface.co/nebius/v1/chat/completions` | Mistral-7B-Instruct-v0.3 |
| Fallback generation | `router.huggingface.co/novita/v1/chat/completions` | Mistral-7B-Instruct-v0.3 |
| Speech-to-text | `router.huggingface.co/hf-inference/models/openai/whisper-large-v3` | Whisper Large v3 |

---

## 📁 Project Structure

```
interview-ai/
├── app/
│   ├── page.tsx                          # Setup screen
│   ├── interview/page.tsx                # Live interview
│   ├── results/page.tsx                  # Final report
│   └── api/
│       ├── generate-questions/route.ts   # Mistral question generation
│       ├── evaluate-answer/route.ts      # Per-answer feedback
│       ├── transcribe/route.ts           # Whisper STT
│       ├── final-report/route.ts         # Final assessment
│       └── parse-cv/route.ts             # PDF parsing
├── components/
│   ├── WebcamFeed.tsx
│   └── AudioRecorder.tsx
└── lib/
    ├── hf.ts        # HF Router helpers (no SDK, plain fetch)
    └── store.ts     # Session state
```

---

## 🎤 Features

| Feature | Tech |
|---|---|
| CV Upload & Parsing | pdf-parse (server-side) |
| AI Question Generation | Mistral-7B via HF Router |
| Speech-to-Text | Whisper Large v3 via HF Router |
| Live Transcript | Web Speech API |
| Webcam | WebRTC MediaDevices |
| Per-answer Feedback | Mistral-7B scoring & coaching |
| Final Report | Mistral-7B comprehensive assessment |
| Text-to-Speech | Web Speech Synthesis API |
| Audio Meter | Web Audio API AnalyserNode |

---

## 📦 Production Build

```bash
npm run build && npm start
```
