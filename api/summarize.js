// POST /api/summarize  { text: "...", mode: "summary" | "bullets" | "insights" }

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

const PROMPTS = {
  summary: 'Write a clear, concise summary. Return only the summary.',
  bullets: 'Extract the key points as a bullet list using •. Return only the bullets.',
  insights: 'Extract the important insights as a numbered list.',
};

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
    const { text, mode } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const prompt = PROMPTS[mode] || PROMPTS.summary;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: 'user', content: `${prompt}\n\nNotes:\n${text}` }],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.status(200).json({ text: data.choices[0].message.content });
  } catch (err) {
    console.error('summarize error:', err.message);
    res.status(500).json({ error: err.message || 'Summarization failed' });
  }
};
