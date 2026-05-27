const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_CONTEXT_ROWS = 250;

function buildPrompt({ question, summary, opportunities }) {
  const rows = Array.isArray(opportunities)
    ? opportunities.slice(0, MAX_CONTEXT_ROWS)
    : [];

  return [
    "You are an AI revenue copilot for a BNY-style P&I Master Revenue View dashboard.",
    "Answer the user's question using only the filtered dashboard context below.",
    "Be concise, executive-ready, and specific. If ranking opportunities, use bidValue unless the user asks for weighted value.",
    "Answer in complete sentences only. Do not end with an unfinished clause or mid-sentence fragment.",
    "Keep the response to 3-5 sentences unless the user asks for a list.",
    "Format currency in dollars using M/B notation where helpful.",
    "If the context is insufficient, say what is missing.",
    "Return only valid JSON with this shape: {\"answer\":\"...\",\"csvAttachment\":null}.",
    "When the user asks for a list, ranking, table, top deals, specific output, or exportable result, set csvAttachment to {\"filename\":\"descriptive-name.csv\",\"content\":\"csv text\"}. Otherwise set csvAttachment to null.",
    "CSV attachments should use clear headers and include only rows needed to answer the question.",
    "",
    "Filtered dashboard summary:",
    summary,
    "",
    `Filtered opportunity rows as JSON, limited to the top ${MAX_CONTEXT_ROWS} rows already sorted by bid value:`,
    JSON.stringify(rows),
    "",
    `User question: ${question}`,
  ].join("\n");
}

function buildGenerationConfig(model) {
  const config = {
    temperature: 0.2,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  };

  if (model.includes("2.5")) {
    config.thinkingConfig = {
      thinkingBudget: 0,
    };
  }

  return config;
}

function parseJsonResponse(text) {
  const trimmed = String(text ?? "").trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    return { answer: trimmed || "No AI response returned.", csvAttachment: null };
  }
}

function normalizeCsvAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const filename =
    typeof attachment.filename === "string" && attachment.filename.trim()
      ? attachment.filename.trim()
      : "dashboard-output.csv";
  const content =
    typeof attachment.content === "string" ? attachment.content.trim() : "";

  if (!content) return null;

  return {
    filename: filename.toLowerCase().endsWith(".csv")
      ? filename
      : `${filename}.csv`,
    content,
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
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

    const prompt = buildPrompt({ question, summary, opportunities });
    const geminiResponse = await fetch(
      `${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: buildGenerationConfig(model),
        }),
      },
    );

    const geminiBody = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return response.status(geminiResponse.status).json({
        error: geminiBody?.error?.message ?? "AI request failed.",
      });
    }

    const candidate = geminiBody?.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS") {
      return response.status(502).json({
        error:
          "The AI response hit the model output limit before finishing. Try a narrower filter or a more specific question.",
      });
    }

    const responseText =
      candidate?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() || "";
    const parsedResponse = parseJsonResponse(responseText);
    const answer =
      typeof parsedResponse.answer === "string" && parsedResponse.answer.trim()
        ? parsedResponse.answer.trim()
        : responseText || "No AI response returned.";
    const csvAttachment = normalizeCsvAttachment(parsedResponse.csvAttachment);

    return response.status(200).json({ answer, csvAttachment });
  } catch (error) {
    return response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "The AI request could not be completed.",
    });
  }
}
