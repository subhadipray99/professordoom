require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Call Gemini API directly via REST (more reliable than SDK)
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(url, {
    contents: [{
      parts: [{ text: prompt }]
    }]
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data.candidates[0].content.parts[0].text;
}

// Analyze resume endpoint
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    console.log('File uploaded:', req.file.originalname);

    // Parse PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    console.log('PDF parsed, text length:', resumeText.length);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Resume appears empty or too short. Make sure your PDF contains readable text.' 
      });
    }

    // Build prompt
    const prompt = `You are Professor Doom, a brutally honest career advisor with dark humor.

CRITICAL RULES:
- ONLY use information that is ACTUALLY in the resume below
- Do NOT invent or assume any details not explicitly stated
- Do NOT make up page counts, years of experience, or any other facts
- No scene descriptions, stage directions, sound effects, or asterisks
- Speak directly without theatrical descriptions

Analyze this resume and provide a brief summary of:
1. Key skills and experience found
2. Strengths
3. Weaknesses
4. Overall impression

Be dramatic but ONLY reference what's actually written in the resume.

RESUME CONTENT:
${resumeText}`;

    console.log('Calling Gemini API...');
    const analysis = await callGemini(prompt);
    console.log('Gemini response received');

    res.json({ success: true, analysis, resumeText });

  } catch (error) {
    console.error('Analysis error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'Failed to analyze resume' 
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Text-to-speech endpoint
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;

    // Truncate text if too long for ElevenLabs
    const truncatedText = text.length > 5000 ? text.substring(0, 5000) + '...' : text;

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: truncatedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.8,
          style: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);

  } catch (error) {
    const errorDetail = error.response?.data 
      ? Buffer.isBuffer(error.response.data) 
        ? error.response.data.toString() 
        : JSON.stringify(error.response.data)
      : error.message;
    console.error('TTS error:', errorDetail);
    res.status(500).json({ error: 'Failed to generate speech', detail: errorDetail });
  }
});

// Chat endpoint for section-specific analysis
app.post('/api/chat', async (req, res) => {
  try {
    const { resumeText, prompt, elaborate, history, confessions } = req.body;

    const lengthRule = elaborate 
      ? 'Give a DETAILED, comprehensive response. Be thorough with examples and specifics. No word limit.'
      : 'Be CONCISE - max 150 words unless listing items. Short and punchy.';

    // Build conversation history if provided
    let historyContext = '';
    if (history && history.length > 0) {
      historyContext = '\n\nPrevious conversation:\n' + 
        history.map(h => `${h.role === 'user' ? 'User' : 'Professor Doom'}: ${h.content}`).join('\n');
    }

    // Build confessions context if provided
    let confessionsContext = '';
    if (confessions && confessions.length > 0) {
      confessionsContext = '\n\nUSER CONFESSIONS (resume exaggerations they admitted to):\n- ' + 
        confessions.join('\n- ') +
        '\n\nUse these confessions to give more honest, tailored advice. Help them achieve these claims legitimately.';
    }

    const fullPrompt = `You are Professor Doom, a career advisor with dark humor.

CRITICAL RULES:
- ${lengthRule}
- ONLY use information that is ACTUALLY in the resume - do NOT invent details
- Do NOT make up page counts, years, numbers, or any facts not explicitly stated
- "24 Pgs" or "24 Parganas" is a PLACE NAME in India, NOT page count!
- No scene descriptions, stage directions, or sound effects
- No asterisks for actions or parentheses for effects
- Speak directly and dramatically
- If user corrects you, acknowledge and adjust

Resume context:
${resumeText}
${confessionsContext}
${historyContext}

User's message: ${prompt}

Respond based ONLY on what's in the resume:`;

    const response = await callGemini(fullPrompt);
    res.json({ success: true, response });

  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'Failed to get response' 
    });
  }
});

// Summary endpoint - generates positive introduction
app.post('/api/summary', async (req, res) => {
  try {
    const { resumeText, gender, language, chatContext, confessionContext } = req.body;

    const prompt = `You are Professor Doom, but now you're like a caring old family member who wants the best for this person. 
You're introducing them to the world - like a proud grandfather presenting his grandchild.

TASK: Write a 50-second spoken introduction (approximately 120-150 words) for this person.

CRITICAL RULES:
- Write in ${language}
- Use ${gender} pronouns
- Be ONLY POSITIVE - highlight their strengths, potential, and why someone should hire them
- Sound like a wise, caring mentor who believes in them
- Make it heartfelt and genuine, not sarcastic
- No scene descriptions, sound effects, or stage directions
- Write it as a flowing speech, not bullet points
- This is meant to be spoken aloud, so make it natural and warm
- ONLY use facts from the resume - do not invent details

RESUME:
${resumeText}

CONVERSATION CONTEXT (what we discussed):
${chatContext || 'No previous conversation'}

${confessionContext ? `CONFESSIONS (things they want to improve): ${confessionContext}` : ''}

Write the introduction now - remember, you're a proud mentor introducing someone you believe in:`;

    const summary = await callGemini(prompt);
    res.json({ success: true, summary });

  } catch (error) {
    console.error('Summary error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'Failed to generate summary' 
    });
  }
});

// Learning Resources endpoint - uses Exa.ai
app.post('/api/resources', async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || skills.length === 0) {
      return res.status(400).json({ error: 'No skills provided' });
    }

    const searchQuery = `best online courses tutorials to learn ${skills.join(' ')} for career growth`;

    const response = await axios.post(
      'https://api.exa.ai/search',
      {
        query: searchQuery,
        type: 'neural',
        useAutoprompt: true,
        numResults: 8,
        contents: {
          text: { maxCharacters: 300 },
          highlights: true
        }
      },
      {
        headers: {
          'x-api-key': process.env.EXA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const results = response.data.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.text || r.highlights?.[0] || '',
      publishedDate: r.publishedDate
    }));

    res.json({ success: true, resources: results });

  } catch (error) {
    console.error('Exa search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to find resources' });
  }
});

// Skill Trends endpoint - uses Exa.ai
app.post('/api/trends', async (req, res) => {
  try {
    const { industry } = req.body;

    if (!industry) {
      return res.status(400).json({ error: 'No industry provided' });
    }

    const searchQuery = `trending skills ${industry} 2024 2025 most in-demand skills hiring job market`;

    const response = await axios.post(
      'https://api.exa.ai/search',
      {
        query: searchQuery,
        type: 'neural',
        useAutoprompt: true,
        numResults: 10,
        contents: {
          text: { maxCharacters: 400 },
          highlights: true
        }
      },
      {
        headers: {
          'x-api-key': process.env.EXA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const results = response.data.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.text || r.highlights?.[0] || '',
      publishedDate: r.publishedDate
    }));

    res.json({ success: true, trends: results });

  } catch (error) {
    console.error('Exa trends error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to find trends' });
  }
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const result = await callGemini('Say hello in 5 words');
    res.json({ success: true, gemini: result });
  } catch (error) {
    res.json({ success: false, error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
