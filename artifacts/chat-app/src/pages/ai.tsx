import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

const AI_API = "https://lbphvoonoxpbvpovozuo.supabase.co/functions/v1/pulse-ai";
const TOKEN_KEY = "pulse-supabase-access-token";

type Message = { role: "user" | "assistant"; content: string };

export default function AI() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages([{ role: "assistant", content: "Hey! I'm Pulse AI. Ask me anything, or use me to rewrite, brainstorm, summarize, or help with a Pulse post." }]);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");

    // Snapshot the conversation BEFORE adding the new user message so the
    // backend receives the actual conversation history, not the current
    // message twice.
    const history = messages.slice(-20);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Please sign in to use Pulse AI.");

      const r = await fetch(AI_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history,
        }),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Pulse AI is temporarily unavailable.");

      setMessages((m) => [...m, { role: "assistant", content: d.response || "I couldn't generate a response." }]);
    } catch (e: any) {
      setError(e.message || "Pulse AI is temporarily unavailable.");
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach Pulse AI right now. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return <div className="h-full overflow-y-auto"><div className="max-w-3xl mx-auto px-4 py-5 md:py-8"><button onClick={() => setLocation("/feed")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 cursor-pointer"><ArrowLeft className="w-4 h-4" />Back</button><div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Bot className="w-6 h-6" /></div><div><h1 className="text-2xl font-bold">Pulse AI</h1><p className="text-sm text-muted-foreground">Your built-in AI assistant.</p></div></div><div className="space-y-3 mb-5">{messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm leading-6 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>{m.content}</div></div>)}</div>{error && <div className="mb-3 text-sm text-destructive">{error}</div>}<div className="sticky bottom-2 bg-card border border-border rounded-2xl p-2 shadow-lg"><Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Message Pulse AI…" className="border-0 resize-none min-h-[52px] focus-visible:ring-0" maxLength={12000} /><div className="flex items-center justify-between px-2"><span className="text-[11px] text-muted-foreground">Shift + Enter for a new line</span><Button onClick={send} disabled={loading || !input.trim()} className="cursor-pointer">{loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send</Button></div></div><div className="flex flex-wrap gap-2 mt-4">{["Help me brainstorm a post", "Rewrite this more naturally", "Summarize this", "Give me some ideas"].map(x => <button key={x} onClick={() => setInput(x)} className="text-xs px-3 py-2 rounded-full border border-border hover:bg-secondary cursor-pointer"><Sparkles className="w-3 h-3 inline mr-1" />{x}</button>)}</div></div></div>;
}
