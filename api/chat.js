const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
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
    "",
    "Revenue type mapping:",
    "- L1 = Direct Digital Revenue",
    "- L2 = Digitally Enabled Revenue",
    "- L3 = Halo Effect Revenue",
    'When the user says "direct sales" or "direct digital", they mean L1 Direct Digital Revenue.',
    'When the user says "digitally enabled", they mean L2 Digitally Enabled Revenue.',
    'When the user says "halo", they mean L3 Halo Effect Revenue.',
    "",
    "Response rules:",
    "- Be concise and executive-ready.",
    "- If ranking opportunities, use bidValue unless the user asks for weighted value.",
    "- Format currency in dollars using M/B notation where helpful.",
    "- If the context is insufficient, say what is missing.",
    "",
    'Return only valid JSON: {"answer":"...","table":null}.',
    "When the user asks for a list, ranking, top deals, or tabular output:",
    '- Set table to {"columns":["Col1","Col2",...],"rows":[["val1","val2",...],...]}.',
    "- Keep answer to 1-2 short summary sentences; put the detail in the table.",
    "- Use clear column headers such as Client, Opportunity, Revenue Type, Bid Value, Status, Close Date.",
    "- Include only rows needed to answer the question.",
    "For general questions without a list, set table to null and answer in 2-4 sentences.",
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

function buildGenerationConfig() {
  return {
    temperature: 0.2,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  };
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
    return { answer: trimmed || "No AI response returned.", table: null };
  }
}

function normalizeTable(table) {
  if (!table || typeof table !== "object") return null;

  const columns = Array.isArray(table.columns)
    ? table.columns.map((col) => String(col ?? "").trim()).filter(Boolean)
    : [];
  const rows = Array.isArray(table.rows)
    ? table.rows
        .filter((row) => Array.isArray(row))
        .map((row) =>
          columns.map((_, index) => String(row[index] ?? "").trim()),
        )
        .filter((row) => row.some(Boolean))
    : [];

  if (!columns.length || !rows.length) return null;

  return { columns, rows };
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
          generationConfig: buildGenerationConfig(),
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
    const table = normalizeTable(parsedResponse.table);

    return response.status(200).json({ answer, table });
  } catch (error) {
    return response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "The AI request could not be completed.",
    });
  }
}
