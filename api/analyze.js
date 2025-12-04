import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const form = formidable({ 
      maxFileSize: 5 * 1024 * 1024,
      uploadDir: os.tmpdir(),
      keepExtensions: true
    });
    
    const [fields, files] = await form.parse(req);
    const file = files.resume?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(file.filepath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Resume appears empty or too short.' });
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

  } catch (error) {
    console.error('Analysis error:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Failed to analyze resume' });
  }
}
