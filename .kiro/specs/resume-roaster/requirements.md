# Professor Doom - Resume Roaster Requirements

## Project Overview
An AI-powered web application that analyzes resumes with a spooky, horror-themed personality while providing genuinely helpful career advice.

## Functional Requirements

### FR-1: Resume Upload
- Users can upload PDF resumes via drag-and-drop or file picker
- Maximum file size: 5MB
- Only PDF format accepted
- Extract text content from PDF for analysis

### FR-2: AI Analysis
- Analyze resume using Gemini AI
- Provide brutally honest but constructive feedback
- Categories: Roast, AI Replacement Risk, Futureproof Score, Improvements, Eligible Jobs

### FR-3: Voice Synthesis
- Convert AI responses to speech using ElevenLabs
- Horror-themed voice personality
- Play/Pause/Stop audio controls
- Per-section audio playback

### FR-4: Confession Booth
- Users can confess resume exaggerations
- AI provides advice on how to legitimately achieve claims
- Confessions added to context for personalized advice

### FR-5: Summary Room
- Unlocks after 3 manual chat messages
- Interactive flow: Gender → Language → Generate
- Creates positive 50-second introduction
- Downloadable audio summary

### FR-6: Chat Interface
- Custom questions about resume
- Chat history for context
- Markdown rendering for responses
- Elaborate button for detailed responses

## Non-Functional Requirements

### NFR-1: Performance
- Resume analysis < 10 seconds
- Audio generation < 15 seconds

### NFR-2: Security
- API keys stored in environment variables
- No sensitive data logged
- File cleanup after processing

### NFR-3: User Experience
- Spooky but friendly UI
- Mobile responsive
- Loading animations with themed messages
