# Resume Roaster 🎃

An AI-powered resume analyzer that roasts your CV with a horror-themed voice using ElevenLabs and Gemini AI.

## Features

- Upload PDF resumes
- AI-powered analysis with brutal honesty
- Horror-themed voice feedback
- Checks AI replacement risk
- Future-proof career scoring
- Job eligibility suggestions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
   - Get Gemini API key: https://makersuite.google.com/app/apikey
   - Get ElevenLabs API key: https://elevenlabs.io/
   - Find a horror voice ID in ElevenLabs voice library

4. Run the server:
```bash
npm start
```

5. Open http://localhost:3000

## Finding a Horror Voice

1. Go to ElevenLabs Voice Library
2. Search for voices with dark/horror characteristics
3. Some suggestions: "Adam" (deep), "Antoni" (dramatic), or create a custom voice
4. Copy the Voice ID and add to your `.env` file

## Tech Stack

- Backend: Node.js + Express
- AI: Google Gemini API (free tier)
- Voice: ElevenLabs API
- Frontend: Vanilla JavaScript
- PDF Parsing: pdf-parse

## API Endpoints

- `POST /api/analyze` - Upload and analyze resume
- `POST /api/speak` - Convert text to horror voice

Enjoy the roast! 👻
