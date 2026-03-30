import type { Request, Response } from "express"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const DEFAULT_MODEL = "llama-3.3-70b-versatile"

type ChatMsg = { role: string; content: string }

function normalizeMessages(messages: ChatMsg[]): { role: "system" | "user" | "assistant"; content: string }[] {
  return messages
    .filter((m) => m.content && typeof m.content === "string")
    .map((m) => {
      const role = m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user"
      return { role, content: m.content }
    })
}

/**
 * POST /api/chat — OpenAI-compatible Groq proxy (keeps GROQ_API_KEY on the server).
 * Body: { message?: string, messages?: { role, content }[], model?: string }
 * Response: { reply: string } or { error, reply: null }
 */
export async function groqChatHandler(req: Request, res: Response): Promise<void> {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    res.status(503).json({
      error: "GROQ_API_KEY is not set on the server. Add it to .env and restart.",
      reply: null,
    })
    return
  }

  const body = req.body as {
    message?: string
    messages?: ChatMsg[]
    model?: string
  }

  let messages: ChatMsg[] | undefined = body.messages
  if (!messages?.length && typeof body.message === "string" && body.message.trim()) {
    messages = [{ role: "user", content: body.message.trim() }]
  }

  if (!messages?.length) {
    res.status(400).json({ error: "Provide `message` or non-empty `messages`.", reply: null })
    return
  }

  const model = body.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL
  const normalized = normalizeMessages(messages)

  try {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: normalized,
        max_tokens: 1024,
      }),
    })

    const data = (await r.json()) as {
      error?: { message?: string }
      choices?: { message?: { content?: string } }[]
    }

    if (!r.ok) {
      const msg = data.error?.message ?? `Groq HTTP ${r.status}`
      console.error("Groq error:", msg, data)
      res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({
        error: msg,
        reply: null,
      })
      return
    }

    const reply = data.choices?.[0]?.message?.content ?? ""
    res.json({ reply })
  } catch (e) {
    console.error("Groq request failed:", e)
    res.status(500).json({ error: "Groq request failed", reply: null })
  }
}
