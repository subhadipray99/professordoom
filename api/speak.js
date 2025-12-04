import axios from 'axios';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;

    console.log('Murf API Key exists:', !!process.env.MURF_API_KEY);
    console.log('Voice ID:', process.env.MURF_VOICE_ID);

    // Use Murf AI API
    const response = await axios.post(
      'https://api.murf.ai/v1/speech/generate',
      {
        voiceId: process.env.MURF_VOICE_ID || 'en-US-terrell',
        style: 'Conversational',
        text: truncatedText,
        format: 'MP3',
        sampleRate: 48000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.MURF_API_KEY
        }
      }
    );

    console.log('Murf response:', JSON.stringify(response.data));

    // Murf returns audioFile URL, download it
    if (response.data && response.data.audioFile) {
      const audioResponse = await axios.get(response.data.audioFile, {
        responseType: 'arraybuffer'
      });
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioResponse.data));
    } else {
      throw new Error('No audio file in response: ' + JSON.stringify(response.data));
    }

  } catch (error) {
    console.error('TTS error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate speech', 
      detail: JSON.stringify(error.response?.data) || error.message 
    });
  }
}
