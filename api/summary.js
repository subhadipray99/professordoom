const axios = require('axios');

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

    const prompt = `You are Professor Doom, but now you're like a caring old family member.
You're introducing them to the world - like a proud grandfather.

TASK: Write a 50-second spoken introduction (120-150 words).

RULES:
- Write in ${language}
- Use ${gender} pronouns
- Be ONLY POSITIVE - highlight strengths and why someone should hire them
- Sound like a wise, caring mentor
- No scene descriptions or sound effects
- ONLY use facts from the resume

RESUME:
${resumeText}

CONTEXT:
${chatContext || 'No previous conversation'}
${confessionContext || ''}

Write the introduction:`;

    const summary = await callGemini(prompt);
    res.json({ success: true, summary });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate summary' });
  }
}
