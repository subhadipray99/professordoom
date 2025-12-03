# Professor Doom - Project Guidelines

## Overview
Professor Doom is a spooky, AI-powered resume analyzer that roasts resumes with dark humor while providing genuinely helpful career advice.

## Tech Stack
- Backend: Node.js + Express
- AI: Google Gemini API (gemini-2.0-flash)
- Voice: ElevenLabs API (eleven_multilingual_v2)
- Frontend: Vanilla HTML/CSS/JavaScript
- PDF Parsing: pdf-parse

## Code Style
- Use async/await for all API calls
- Keep prompts concise to avoid lengthy AI responses
- No scene descriptions or theatrical stage directions in AI responses
- Always escape user content properly for security

## API Guidelines
- Gemini: Use REST API directly for reliability
- ElevenLabs: Truncate text to 5000 chars max
- Always handle errors gracefully with user-friendly messages

## Theme
- Dark horror/Halloween aesthetic
- Professor Doom character: brutally honest but ultimately helpful
- Purple/red/orange color scheme
- Spooky but friendly tone
