import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { industry, currentSkills } = req.body;

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
}
