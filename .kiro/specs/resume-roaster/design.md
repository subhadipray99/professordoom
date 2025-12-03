# Professor Doom - Technical Design

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Express API   │────▶│   External APIs │
│   (Vanilla JS)  │◀────│   (Node.js)     │◀────│   Gemini/11Labs │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## API Endpoints

### POST /api/analyze
- Input: PDF file (multipart/form-data)
- Process: Parse PDF → Extract text → Gemini analysis
- Output: { success, analysis, resumeText }

### POST /api/chat
- Input: { resumeText, prompt, elaborate?, history?, confessions? }
- Process: Build context → Gemini query
- Output: { success, response }

### POST /api/speak
- Input: { text }
- Process: ElevenLabs TTS
- Output: audio/mpeg stream

### POST /api/summary
- Input: { resumeText, gender, language, chatContext, confessionContext }
- Process: Generate positive introduction
- Output: { success, summary }

## Frontend Components

### Screens
1. Landing Page - Hero, features, CTA
2. Upload Screen - Drag-drop PDF upload
3. Loading Screen - Animated messages
4. Main Screen - Sidebar + Chat area

### Modals
1. Confession Booth - Add/remove confessions, get absolution
2. Summary Room - Interactive flow for voice summary

## State Management
- resumeData: Parsed resume and analysis
- rawResumeText: Original PDF text
- chatHistory: Conversation context
- confessions: User's admitted exaggerations
- analysisCache: Cached section responses
- manualChatCount: For Summary Room unlock

## External Services

### Gemini API
- Model: gemini-2.0-flash
- Direct REST calls for reliability
- Structured prompts with strict rules

### ElevenLabs API
- Model: eleven_multilingual_v2
- Voice settings: stability 0.3, similarity 0.8
- Max text: 5000 characters
