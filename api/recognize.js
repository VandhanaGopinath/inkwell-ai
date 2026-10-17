// POST /api/recognize  { imageData: "<base64 PNG, no data: prefix>" }
// Uses Groq's vision-capable model to transcribe handwriting from the
// canvas image. The Groq API key lives only in this serverless function's
// environment (set in Vercel project settings) -- it's never sent to the browser. 

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'qwen/qwen3.8-27b';

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
    const { imageData } = req.body || {};
    if (!imageData) {
      res.status(400).json({ error: 'imageData is required' });
      return;
    }

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageData}` } },
              {
                type: 'text',
                text: 'Transcribe all handwritten text visible in this image. Return only the text, no explanations.',
              },
            ],
          },
        ],
        max_completion_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const rawText = data.choices?.[0]?.message?.content || '';
    const cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    res.status(200).json({ text: cleanText });
  } catch (err) {
    console.error('recognize error:', err.message);
    res.status(500).json({ error: err.message || 'Recognition failed' });
  }
};
