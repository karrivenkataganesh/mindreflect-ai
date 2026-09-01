import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client Getter
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Requests will fail if key is required.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  systemInstruction?: string;
  temperature?: number;
}

async function generateContentWithFallback(
  promptOrContents: any,
  options: FallbackOptions = {}
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptOrContents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Recoverable error check: 404, 429, 500, 503, RESOURCE_EXHAUSTED, UNAVAILABLE
      const status = err?.status || err?.statusCode || 0;
      const msg = String(err?.message || '').toLowerCase();
      const isRecoverable =
        status === 404 ||
        status === 429 ||
        status === 500 ||
        status === 503 ||
        msg.includes('not found') ||
        msg.includes('quota') ||
        msg.includes('unavailable') ||
        msg.includes('overloaded');

      if (!isRecoverable && MODEL_LADDER.indexOf(modelName) === 0) {
        // Continue fallback attempts even if not standard status
      }
    }
  }

  throw new Error(
    lastError?.message || 'All Gemini model candidates in the fallback ladder failed to generate a response.'
  );
}

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Reflection / Chat Generation Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { message, history, mode = 'reflect', mood = 'Reflective' } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Valid "message" string is required.' });
      return;
    }

    const safeMessage = message.trim().slice(0, 10000); // 10k char cap
    const safeMood = typeof mood === 'string' ? mood.slice(0, 50) : 'Reflective';

    let systemPrompt = `You are a mindful, empathetic, and intellectually sharp journaling companion and cognitive reflection guide.
The user is writing in their private personal journal. Their current mood state is: "${safeMood}".
Your purpose:
1. Provide thoughtful, validating, and constructive feedback on their thoughts and reflections.
2. Ask 1-2 open-ended follow-up questions that help them gain deeper clarity or self-awareness.
3. Keep the tone warm, grounded, and concise without being overly preachy or generic.
4. Format using clean Markdown with bullet points or bold text where appropriate for readability.
Mode context: ${mode}`;

    if (mode === 'brainstorm') {
      systemPrompt += `\nFocus particularly on generating creative ideas, practical solutions, and actionable next steps for the challenges or ideas they shared.`;
    } else if (mode === 'deep_question') {
      systemPrompt += `\nFocus particularly on uncovering underlying assumptions, beliefs, and emotions through Socratic and psychological reflection prompts.`;
    }

    // Build multi-turn contents format
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) { // Keep last 10 turns for context
        if (turn && typeof turn === 'object' && turn.content) {
          const role = turn.sender === 'user' ? 'user' : 'model';
          contents.push({
            role,
            parts: [{ text: String(turn.content).slice(0, 4000) }],
          });
        }
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: safeMessage }],
    });

    const result = await generateContentWithFallback(contents, {
      systemInstruction: systemPrompt,
      temperature: 0.75,
    });

    res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reflection with Gemini.',
    });
  }
});

// Summarize & Tag Extraction Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { title, turns, mood } = body;

    if (!Array.isArray(turns) || turns.length === 0) {
      res.status(400).json({ error: 'Array of chat turns is required to summarize.' });
      return;
    }

    const conversationText = turns
      .map((t: any) => `${t.sender === 'user' ? 'User' : 'Gemini'}: ${t.content}`)
      .join('\n\n')
      .slice(0, 15000);

    const prompt = `Here is a personal journal entry reflection session:
Title: ${title || 'Untitled Entry'}
Mood: ${mood || 'Reflective'}

Content:
${conversationText}

Please respond in valid JSON format with the following schema:
{
  "summary": "A concise 2-3 sentence executive summary of key insights, thoughts, and emotional themes.",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedAction": "One small, achievable micro-action or mindfulness practice based on this reflection."
}
Provide ONLY the JSON object, with no extra markdown backticks or commentary if possible.`;

    const result = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are a precise JSON analysis engine for personal mindfulness journals. Return strictly valid JSON.',
      temperature: 0.3,
    });

    let parsed = null;
    try {
      const cleanJson = result.text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        summary: result.text.slice(0, 300),
        keyTakeaways: ['Reflected on personal insights'],
        tags: ['journal', 'reflection'],
        suggestedAction: 'Take a moment to breathe and reflect on today.',
      };
    }

    res.json({
      success: true,
      data: parsed,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({
      error: error?.message || 'Failed to summarize journal entry.',
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : undefined,
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (0.0.0.0:${PORT})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
