import axios from 'axios';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }]
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data.candidates[0].content.parts[0].text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resumeText, gender, language, chatContext, confessionContext } = req.body;

    const prompt = `You are Professor Doom introducing a job candidate.

TASK: Write a 50-second spoken introduction (120-150 words).

CRITICAL RULES:
- Write in ${language}
- Use ${gender} pronouns
- Be POSITIVE - highlight strengths and why someone should hire them
- Sound like a wise, caring mentor recommending someone
- ONLY use facts from the resume
- NO scene descriptions (no "clears throat", "eyes flicker", "thunder rumbles")
- NO asterisk actions (no *laughs*, *pauses*, *gestures*)
- NO parenthetical effects (no (dramatic pause), (softly))
- NO sound effects or stage directions
- JUST pure spoken narration - words that will be read aloud by text-to-speech
- Start directly with the introduction, no preamble

RESUME:
${resumeText}

Write the introduction:`;

    const summary = await callGemini(prompt);
    res.json({ success: true, summary });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
}
