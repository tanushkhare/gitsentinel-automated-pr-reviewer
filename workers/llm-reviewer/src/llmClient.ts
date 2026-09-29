import axios from 'axios';

export const callLLM = async (messages: { role: string; content: string }[]): Promise<string> => {
  const base = process.env.LLM_BASE_URL || 'http://localhost:11434/v1';
  const res = await axios.post(
    `${base}/chat/completions`,
    { model: process.env.LLM_MODEL || 'llama3', messages, temperature: 0.1 },
    {
      timeout: 60_000,
      headers: process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {},
    }
  );
  return res.data.choices[0].message.content as string;
};
