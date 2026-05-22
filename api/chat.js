const GEMINI_MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function buildPrompt({ question, summary, opportunities }) {
  const rows = Array.isArray(opportunities) ? opportunities : [];

  return [
    "You are an AI revenue copilot for a BNY-style P&I Master Revenue View dashboard.",
    "Answer the user's question using only the filtered dashboard context below.",
    "Be concise, executive-ready, and specific. If ranking opportunities, use bidValue unless the user asks for weighted value.",
    "Format currency in dollars using M/B notation where helpful.",
    "If the context is insufficient, say what is missing.",
    "",
    "Filtered dashboard summary:",
    summary,
    "",
    "Filtered opportunity rows as JSON:",
    JSON.stringify(rows),
    "",
    `User question: ${question}`,
  ].join("\n");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel.",
    });
  }

  try {
    const body =
      typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const { question, summary, opportunities } = body ?? {};

    if (!question || !summary) {
      return response.status(400).json({
        error: "Missing question or dashboard context.",
      });
    }

    const geminiResponse = await fetch(`${GEMINI_MODEL_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt({ question, summary, opportunities }) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 1200,
        },
      }),
    });

    const geminiBody = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return response.status(geminiResponse.status).json({
        error: geminiBody?.error?.message ?? "AI request failed.",
      });
    }

    const answer =
      geminiBody?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() || "No AI response returned.";

    return response.status(200).json({ answer });
  } catch (error) {
    return response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "The AI request could not be completed.",
    });
  }
}
