// POST /api/translate  { text: "...", language: "Spanish" }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'openai/gpt-oss-120b';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing GROQ_API_KEY' });
    return;
  }

  try {
    const { text, language } = req.body || {};
    if (!text || !language) {
      res.status(400).json({ error: 'text and language are required' });
      return;
    }

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'user',
            content: `Translate to ${language}. Return only the translated text:\n\n${text}`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.status(200).json({ text: data.choices[0].message.content });
  } catch (err) {
    console.error('translate error:', err.message);
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
};
