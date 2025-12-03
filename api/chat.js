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
    const { resumeText, prompt, elaborate, history, confessions } = req.body;

    const lengthRule = elaborate 
      ? 'Give a DETAILED, comprehensive response. No word limit.'
      : 'Be CONCISE - max 150 words unless listing items.';

    let historyContext = '';
    if (history && history.length > 0) {
      historyContext = '\n\nPrevious conversation:\n' + 
        history.map(h => `${h.role === 'user' ? 'User' : 'Professor Doom'}: ${h.content}`).join('\n');
    }

    let confessionsContext = '';
    if (confessions && confessions.length > 0) {
      confessionsContext = '\n\nUSER CONFESSIONS:\n- ' + confessions.join('\n- ');
    }

    const fullPrompt = `You are Professor Doom, a career advisor with dark humor.

RULES:
- ${lengthRule}
- ONLY use information from the resume - do NOT invent details
- No scene descriptions, stage directions, or sound effects
- Speak directly and dramatically

Resume context:
${resumeText}
${confessionsContext}
${historyContext}

User's message: ${prompt}

Respond:`;

    const response = await callGemini(fullPrompt);
    res.json({ success: true, response });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response' });
  }
}
