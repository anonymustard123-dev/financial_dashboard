import { useMemo, useState } from "react";
import { MessageSquareText, Send, X } from "lucide-react";
import {
  displayRevenueLevel,
  formatCurrency,
  formatNumber,
} from "../lib/formatters";
import type { LevelSummary, NormalizedOpportunity } from "../types/revenue";

interface DataChatPanelProps {
  opportunities: NormalizedOpportunity[];
  summaries: LevelSummary[];
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  answer?: string;
  error?: string;
}

export function DataChatPanel({
  opportunities,
  summaries,
  onClose,
}: DataChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "AI-enabled revenue analysis is ready. Ask a question about the filtered view and I will frame an executive summary from the dashboard context.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const contextSummary = useMemo(() => {
    const total = summaries.find(
      (summary) => summary.level === "Total Revenue Universe",
    );
    const levelLines = summaries
      .filter((summary) => summary.level !== "Total Revenue Universe")
      .map(
        (summary) =>
          `${displayRevenueLevel(summary.level)}: ${formatCurrency(
            summary.value,
          )} across ${formatNumber(summary.count)} opportunities`,
      );

    return [
      `Filtered opportunities: ${formatNumber(opportunities.length)}`,
      `Total value: ${formatCurrency(total?.value ?? 0)}`,
      ...levelLines,
    ].join("\n");
  }, [opportunities.length, summaries]);

  const opportunityContext = useMemo(
    () =>
      opportunities
        .map((opportunity) => ({
          revenueType: displayRevenueLevel(opportunity.revenueLevel),
          subcategory: opportunity.revenueSubcategory,
          client: opportunity.client,
          clientGroup: opportunity.clientGroup,
          opportunityName: opportunity.opportunityName,
          businessLine: opportunity.platformBusinessLine,
          status: opportunity.status,
          probability: opportunity.probability,
          bidValue: opportunity.bidValue,
          weightedValue: opportunity.weightedValue,
          closeDate: opportunity.closeDate,
          quarter: opportunity.quarter,
          sourceTab: opportunity.sourceTab,
        }))
        .sort((a, b) => b.bidValue - a.bidValue),
    [opportunities],
  );

  const submit = async () => {
    const prompt = draft.trim();
    if (!prompt || isThinking) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: prompt },
    ]);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: prompt,
          summary: contextSummary,
          opportunities: opportunityContext,
        }),
      });
      const body = (await response.json()) as ChatResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "AI request failed.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: body.answer ?? "No AI response returned.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The AI request failed. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside className="h-full overflow-y-auto bg-bny-navy p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="rounded-2xl border border-bny-primary/35 bg-bny-primary/15 p-3 text-bny-teal">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bny-teal">
            AI-enabled insights
          </p>
          <h2 className="text-lg font-semibold text-white">
            AI Revenue Copilot
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex min-h-[calc(100%-8rem)] flex-col gap-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-2xl border p-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-6 border-bny-primary/35 bg-bny-primary/15 text-white"
                : "mr-4 border-white/10 bg-bny-navy/55 text-slate-200"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isThinking && (
          <div className="mr-4 rounded-2xl border border-white/10 bg-bny-navy/55 p-3 text-sm leading-6 text-slate-200">
            AI is analyzing the filtered revenue context...
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          placeholder="Ask AI about pipeline, quarters, clients..."
          disabled={isThinking}
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-bny-navy px-4 py-3 text-sm text-white outline-none ring-bny-primary/40 placeholder:text-slate-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isThinking}
          className="rounded-2xl bg-bny-primary px-4 text-white transition hover:bg-bny-teal disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
