"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { getAiCreditsRemaining, consumeAiCredit } from "@/lib/ai/credits";

export interface AiAdvisorSuggestion {
  id: string;
  title: string;
  icon: string;
  prompt: string;
}

export interface AiAdvisorMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface CommerceOsAiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string; // e.g. "Storage AI Advisor", "Purchase AI Advisor", "Inventory AI Advisor"
  moduleSubtitle: string; // e.g. "Live warehouse space & inwarding intelligence"
  diagnosticTitle: string; // e.g. "Full Warehouse Diagnostic"
  diagnosticPrompt: string;
  welcomeMessage: string;
  suggestedQueriesHeader: string; // e.g. "Suggested Storage Queries"
  suggestedQueries: AiAdvisorSuggestion[];
  inputPlaceholder: string;
  onGenerateResponse: (promptText: string) => Promise<string> | string;
  onCreditsUpdated?: (credits: number) => void;
}

export default function CommerceOsAiAdvisorDrawer({
  isOpen,
  onClose,
  moduleTitle,
  moduleSubtitle,
  diagnosticTitle,
  diagnosticPrompt,
  welcomeMessage,
  suggestedQueriesHeader,
  suggestedQueries,
  inputPlaceholder,
  onGenerateResponse,
  onCreditsUpdated,
}: CommerceOsAiAdvisorDrawerProps) {
  const [messages, setMessages] = useState<AiAdvisorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [credits, setCredits] = useState(getAiCreditsRemaining());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCredits(getAiCreditsRemaining());
      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            text: welcomeMessage,
            timestamp: "Just now",
          },
        ]);
      }
    }
  }, [isOpen, welcomeMessage, messages.length]);

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    } catch {}
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: AiAdvisorMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: promptText,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await onGenerateResponse(promptText);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: response,
          timestamp: "Just now",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: "I was unable to analyze the data. Please try again or check system connectivity.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunFullDiagnostic = async () => {
    if (credits <= 0) return;
    consumeAiCredit(1);
    const remaining = getAiCreditsRemaining();
    setCredits(remaining);
    onCreditsUpdated?.(remaining);

    await handleSendPrompt(diagnosticPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  {moduleTitle}
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-800 border border-violet-200">
                    Copilot
                  </span>
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {moduleSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-200/80 shadow-2xs">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                {credits} Credits
              </span>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick AI Action Banner */}
          <div className="bg-violet-600 px-6 py-3 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Bot className="h-4 w-4 text-violet-200" />
              <span>{diagnosticTitle}</span>
            </div>
            <button
              type="button"
              onClick={handleRunFullDiagnostic}
              disabled={credits <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-black text-violet-900 shadow-sm hover:bg-violet-50 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-violet-600" />
              <span>Run Audit (1 Cr)</span>
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 border border-violet-200 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-4 text-xs font-medium leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs whitespace-pre-line"
                  }`}
                >
                  {msg.text}
                  <span
                    className={`block text-[9px] mt-1.5 ${
                      msg.role === "user" ? "text-slate-400 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 border border-violet-200">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-slate-200/80 bg-white p-3 shadow-xs">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="border-t border-slate-100 bg-white p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              {suggestedQueriesHeader}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {suggestedQueries.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleSendPrompt(sug.prompt)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2 text-left hover:border-violet-300 hover:bg-violet-50/30 transition text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  <span className="text-base">{sug.icon}</span>
                  <span className="truncate flex-1">{sug.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-200 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:opacity-40 transition active:scale-95 shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
