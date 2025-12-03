const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const upload = multer({ storage: multer.memoryStorage() });

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

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve, reject) => {
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: 'File upload failed' });
        return resolve();
      }

      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return resolve();
        }

        const pdfData = await pdfParse(req.file.buffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length < 50) {
          res.status(400).json({ error: 'Resume appears empty or too short.' });
          return resolve();
        }

        const prompt = `You are Professor Doom, a brutally honest career advisor with dark humor.

CRITICAL RULES:
- ONLY use information that is ACTUALLY in the resume below
- Do NOT invent or assume any details not explicitly stated
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

        const analysis = await callGemini(prompt);
        res.json({ success: true, analysis, resumeText });
        resolve();
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze resume' });
        resolve();
      }
    });
  });
}
