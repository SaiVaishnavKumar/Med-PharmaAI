import { useState } from 'react';
import {
  Sparkles,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { pharmacyStore } from '../services/pharmacyStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { CopilotMessage } from '../types';

export function Copilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **MediFlow AI Copilot**.\n\nI monitor your pharmacy telemetry in real-time. I can help identify low-stock items, upcoming batch expirations, sales velocity, and inventory valuation.\n\n*Note:* As an operational management system, I strictly enforce healthcare safety guardrails and do not provide medical diagnosis or prescribing advice.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'ai',
      suggestions: [
        'Which medicines are below their reorder level?',
        'What batches expire soon?',
        'Summarise this week’s sales performance',
        'What is our inventory valuation?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = (queryText ?? input).trim();
    if (!q || busy) return;

    const userMsg: CopilotMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      try {
        const response = pharmacyStore.askCopilot(q);
        const botMsg: CopilotMessage = {
          id: `msg-b-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: response.provider,
          suggestions: response.suggestions,
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        const errorMsg: CopilotMessage = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to analyze pharmacy data at this moment. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: 'analytics',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setBusy(false);
      }
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-800 font-display flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Operations Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-0.5">
            MediFlow AI Copilot
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Query formulary stock health, expiry forecasting, and sales analytics with natural language.
          </p>
        </div>

        <Badge variant="brand" size="md">
          Deterministic Verified Facts
        </Badge>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : 'bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">{m.content}</div>

                  {/* Metadata and suggestions */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{m.provider === 'ai' ? 'Operational AI' : 'Deterministic Query'}</span>
                      <span>{m.timestamp}</span>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {!isUser && m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {busy && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs text-slate-500 animate-pulse">
                Analyzing inventory telemetry...
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about low stock, expiry, valuation, or sales..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 shadow-xs"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={!input.trim() || busy}
              className="rounded-xl px-4"
              icon={<Send className="w-4 h-4" />}
            >
              Ask
            </Button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Grounded in real-time pharmacy inventory database
            </span>
            <span className="hidden sm:inline">No external medical diagnostic claims</span>
          </div>
        </div>
      </div>
    </div>
  );
}
