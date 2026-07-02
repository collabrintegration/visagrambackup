import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Plus, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useListAnthropicConversations,
  useCreateAnthropicConversation,
  useGetAnthropicConversation,
  getListAnthropicConversationsQueryKey,
  getGetAnthropicConversationQueryKey,
  getGetAnthropicConversationQueryOptions,
} from "@workspace/api-client-react";
import type { AnthropicMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

function CountryCard({ name, flag }: { name: string; flag?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
      {flag && <span>{flag}</span>}
      {name}
    </span>
  );
}

function MessageBubble({ msg }: { msg: LocalMessage | AnthropicMessage }) {
  const isUser = msg.role === "user";
  const isStreaming = "streaming" in msg && msg.streaming;

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border text-card-foreground rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 pl-4 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 pl-4 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-card-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                h1: ({ children }) => <h1 className="text-base font-bold mb-1 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-1 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>,
                code: ({ children }) => <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{children}</code>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STARTER_PROMPTS = [
  "Where can I travel visa-free with a US passport?",
  "Best countries to visit on a budget?",
  "How do I get a Schengen visa?",
  "Most visited countries in Southeast Asia?",
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessages, setStreamingMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useListAnthropicConversations();
  const { data: activeConv } = useGetAnthropicConversation(
    activeConvId!,
    {
      query: {
        ...getGetAnthropicConversationQueryOptions(activeConvId!),
        enabled: activeConvId !== null,
      },
    }
  );
  const createConversation = useCreateAnthropicConversation();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingMessages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeConvId]);

  const startNewConversation = useCallback(async (firstMessage?: string) => {
    const title = firstMessage
      ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : "")
      : "Travel advice";

    const conv = await createConversation.mutateAsync({ data: { title } });
    setActiveConvId(conv.id);
    await queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
    return conv.id;
  }, [createConversation, queryClient]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || isStreaming) return;

    setInput("");
    setIsStreaming(true);

    let convId = activeConvId;
    if (!convId) {
      convId = await startNewConversation(text);
    }

    // Optimistically add user message to streaming messages
    setStreamingMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch(`/api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const evt = JSON.parse(json) as { content?: string; done?: boolean; error?: string };
            if (evt.error) throw new Error(evt.error);
            if (evt.done) {
              setStreamingMessages([]);
              await queryClient.invalidateQueries({
                queryKey: getGetAnthropicConversationQueryKey(convId!),
              });
              break;
            }
            if (evt.content) {
              fullContent += evt.content;
              setStreamingMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  return [...updated.slice(0, -1), { ...last, content: fullContent }];
                }
                return updated;
              });
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setStreamingMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          return [...updated.slice(0, -1), { ...last, content: `❌ ${errMsg}`, streaming: false }];
        }
        return updated;
      });
      // Clear streaming messages after a delay
      setTimeout(() => {
        setStreamingMessages([]);
        queryClient.invalidateQueries({ queryKey: getGetAnthropicConversationQueryKey(convId!) });
      }, 2000);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeConvId, startNewConversation, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const persistedMessages: AnthropicMessage[] = activeConv?.messages ?? [];
  const displayMessages: (LocalMessage | AnthropicMessage)[] =
    streamingMessages.length > 0 ? streamingMessages : persistedMessages;

  const showWelcome = !activeConvId && streamingMessages.length === 0;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isOpen
            ? "bg-muted border border-border text-muted-foreground rotate-0"
            : "bg-primary text-primary-foreground hover:scale-105"
        }`}
        aria-label={isOpen ? "Close AI advisor" : "Open AI travel advisor"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        }`}
        style={{ height: "520px", maxHeight: "calc(100dvh - 7rem)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Visagram AI</p>
              <p className="text-xs text-muted-foreground mt-0.5">Travel advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Conversation selector */}
            {conversations.length > 0 && (
              <select
                className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[120px] truncate"
                value={activeConvId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveConvId(val ? Number(val) : null);
                  setStreamingMessages([]);
                }}
              >
                <option value="">New chat</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              title="New conversation"
              onClick={() => {
                setActiveConvId(null);
                setStreamingMessages([]);
                setInput("");
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Hi! I'm your AI travel advisor.</p>
                <p className="text-xs text-muted-foreground mt-1">Ask me about visa requirements, destinations, or travel tips.</p>
              </div>
              <div className="w-full space-y-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {displayMessages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border">
          <div className="flex items-end gap-2 bg-muted rounded-xl border border-border px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about visas, destinations…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 max-h-24 leading-5"
              style={{ minHeight: "20px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 96) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isStreaming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
            Powered by Claude · Press Enter to send
          </p>
        </div>
      </div>
    </>
  );
}
