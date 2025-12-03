import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { skills } = req.body;

    if (!skills || skills.length === 0) {
      return res.status(400).json({ error: 'No skills provided' });
    }

    // Search for learning resources using Exa.ai
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
}
