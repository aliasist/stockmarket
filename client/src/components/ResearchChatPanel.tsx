import React, { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import StockChartWidget from "./StockChartWidget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAT_API = "./api/chat";

type Msg = { role: "user" | "assistant"; content: string };

export default function ResearchChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    const userMessage: Msg = { role: "user", content: input.trim() };
    const history: Msg[] = [...messages, userMessage];
    setMessages(history);
    setInput("");
    try {
      const res = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Chat failed (${res.status})`);
      }
      const text = data.reply ?? "";
      setMessages((msgs) => [...msgs, { role: "assistant", content: text }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl flex flex-col theme-panel rounded-2xl overflow-hidden flex-1 min-h-0 max-h-[min(85vh,760px)]">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">AI research desk</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Groq-powered Q&A — keys stay on the server via <code className="text-[11px]">GROQ_API_KEY</code>
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0 h-[min(52vh,520px)] px-4 py-4">
        <div className="space-y-4 pr-2">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Ask about a ticker, sector, or headline. Charts appear when a symbol is detected in the reply.
            </p>
          )}
          {messages.map((msg, i) => {
            let tickerMatch: RegExpMatchArray | null = null;
            if (msg.role === "assistant") {
              tickerMatch = msg.content.match(
                /\b([A-Z]{2,5})(?:\s+stock|\s+Inc\.|\s+Corp\.|\s+Corporation|\s+Holdings|\s+Group|\s+Ltd\.|\s+plc|\s+N\.V\.|\s+S\.A.)?/
              );
            }
            const ticker = tickerMatch ? tickerMatch[1] : null;
            return (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-4 py-3 text-sm border",
                    msg.role === "user"
                      ? "bg-primary/15 border-primary/25 text-foreground"
                      : "bg-card border-border text-foreground"
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  {msg.role === "assistant" ? (
                    <>
                      <MarkdownRenderer content={msg.content} />
                      {ticker && <StockChartWidget symbol={ticker} />}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSend}
        className="p-4 border-t border-border bg-muted/20 flex gap-2 items-end"
      >
        <Textarea
          className="min-h-[44px] max-h-32 resize-y"
          placeholder="e.g. Summarize today’s macro drivers for tech…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button type="submit" disabled={loading || !input.trim()} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
