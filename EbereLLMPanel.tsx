"use client";

import { addPropertyControls, ControlType } from "framer";
import { useState, useRef, useEffect, useCallback } from "react";
import { config } from "./ebereLLMConfig";

// ── Types ─────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface EbereLLMPanelProps {
  colorScheme: "dark" | "light";
  isOpen?: boolean;
  onClose?: () => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────

const CTA = "#2E9EC9";

const tokens = {
  dark: {
    bgPage: "#111111",
    bgPanel: "#1a1a1a",
    bgElevated: "#222222",
    bgUserMsg: "#1f1f1f",
    textPrimary: "#e8e8e8",
    textSecondary: "#a0a0a0",
    textHint: "#444444",
    accentGreen: "rgb(25, 230, 114)",
    border: "rgba(255,255,255,0.09)",
    borderUser: "rgba(255,255,255,0.11)",
    borderFocus: "rgba(46,158,201,0.45)",
    errorBg: "rgba(255,80,80,0.07)",
    errorText: "#ff8f8f",
    errorBorder: "rgba(255,80,80,0.14)",
  },
  light: {
    bgPage: "#f2f2f2",
    bgPanel: "#ffffff",
    bgElevated: "#efefef",
    bgUserMsg: "#ffffff",
    textPrimary: "#1a1f2e",
    textSecondary: "#3d4654",
    textHint: "#b8bcc8",
    accentGreen: "rgb(22,191,94)",
    border: "rgba(0,0,0,0.07)",
    borderUser: "rgba(0,0,0,0.1)",
    borderFocus: "rgba(46,158,201,0.55)",
    errorBg: "rgba(220,50,50,0.05)",
    errorText: "#c0392b",
    errorBorder: "rgba(220,50,50,0.14)",
  },
};

// ── Arrow icon ─────────────────────────────────────────────────────────────

function ArrowIcon({ size = 13 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 256 256">
      <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
    </svg>
  );
}

// ── Info icon ──────────────────────────────────────────────────────────────

function InfoIcon({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill={color} viewBox="0 0 256 256">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
    </svg>
  );
}

// ── Typing dots ────────────────────────────────────────────────────────────

function TypingDots() {
  const dot: React.CSSProperties = {
    display: "inline-block",
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: CTA,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
      <span className="ebere-dot" style={dot} />
      <span className="ebere-dot ebere-dot-2" style={dot} />
      <span className="ebere-dot ebere-dot-3" style={dot} />
    </div>
  );
}

// ── Keyframe injection ────────────────────────────────────────────────────

const STYLE_ID = "ebere-llm-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ebereFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ebereDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    .ebere-msg { animation: ebereFadeIn 0.25s ease forwards; }
    .ebere-followup { transition: color 0.15s ease; cursor: pointer; user-select: none; }
    .ebere-dot { animation: ebereDot 1.3s ease-in-out infinite; }
    .ebere-dot-2 { animation-delay: 0.18s; }
    .ebere-dot-3 { animation-delay: 0.36s; }
    .ebere-icon-btn:hover { opacity: 0.7; }
  `;
  document.head.appendChild(style);
}

// ── Component ─────────────────────────────────────────────────────────────

export default function EbereLLMPanel({
  colorScheme = "dark",
  isOpen = true,
  onClose,
}: EbereLLMPanelProps) {
  const t = tokens[colorScheme];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [hoveredFollowup, setHoveredFollowup] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 88) + "px";
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: config.systemPrompt,
          messages: newMessages.slice(-6),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text ?? "Sorry, I couldn't get a response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", isError: true }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => { setMessages([]); setInput(""); };
  const isEmpty = messages.length === 0;
  const canSend = input.trim().length > 0 && !loading;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 380,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Open Runde", sans-serif',
        background: t.bgPanel,
        borderLeft: `1px solid ${t.border}`,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        opacity: isOpen ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          background: t.bgPanel,
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: 11,
              letterSpacing: "0.1em",
              color: t.textPrimary,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {config.panelTitle}
          </span>
          <InfoIcon color={t.textHint} />
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.accentGreen,
              display: "inline-block",
              marginLeft: 2,
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="ebere-icon-btn"
            title="New chat"
            onClick={reset}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.textSecondary, padding: 6, display: "flex", alignItems: "center", transition: "opacity 0.15s" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a80,80,0,1,0,1.68,114,8,8,0,1,1,11.22,11.39A96,96,0,1,1,178.06,62l14.63,14.63V48a8,8,0,0,1,16,0Z" />
            </svg>
          </button>
          {onClose && (
            <button
              className="ebere-icon-btn"
              title="Close"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: t.textSecondary, padding: 6, fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", transition: "opacity 0.15s" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 20px 16px",
          background: t.bgPage,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* ── Empty state ── */}
        {isEmpty && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p
              style={{
                fontFamily: '"Open Runde", sans-serif',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: t.textPrimary,
                margin: "0 0 6px 0",
                lineHeight: 1.2,
              }}
            >
              {config.greeting}
            </p>
            <p
              style={{
                fontFamily: '"Geist Mono", monospace',
                fontSize: 10,
                color: t.textHint,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: "0 0 28px 0",
              }}
            >
              Ask anything
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {config.suggestedQuestions.map((q) => (
                <span
                  key={q}
                  className="ebere-followup"
                  style={{
                    fontSize: 13,
                    color: hoveredFollowup === q ? t.textPrimary : t.textSecondary,
                    fontFamily: '"Open Runde", sans-serif',
                    lineHeight: 1.5,
                  }}
                  onMouseEnter={() => setHoveredFollowup(q)}
                  onMouseLeave={() => setHoveredFollowup(null)}
                  onClick={() => sendMessage(q)}
                >
                  <span style={{ color: hoveredFollowup === q ? CTA : t.textHint, marginRight: 3 }}>
                    {config.followUpPrefix}
                  </span>
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Messages ── */}
        {messages.map((msg, i) => (
          <div key={i} className="ebere-msg" style={{ marginBottom: 24 }}>
            {msg.role === "user" ? (
              /* User message — centered bordered card */
              <div
                style={{
                  background: t.bgUserMsg,
                  border: `1px solid ${t.borderUser}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  color: t.textSecondary,
                  fontFamily: '"Open Runde", sans-serif',
                  fontSize: 14,
                  lineHeight: 1.55,
                  width: "100%",
                  boxSizing: "border-box",
                  boxShadow: colorScheme === "light" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {msg.content}
              </div>
            ) : (
              /* Assistant message — plain text, no container */
              <div style={{ marginTop: 4 }}>
                {msg.isError ? (
                  <div
                    style={{
                      background: t.errorBg,
                      border: `1px solid ${t.errorBorder}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                    <p style={{ color: t.errorText, fontFamily: '"Open Runde", sans-serif', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <>
                    <p
                      style={{
                        color: t.textSecondary,
                        fontFamily: '"Open Runde", sans-serif',
                        fontSize: 16,
                        lineHeight: 1.7,
                        margin: "0 0 8px 0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </p>
                    {i === messages.length - 1 && !loading && (
                      <>
                        <div style={{ height: 1, background: t.border, margin: "16px 0 14px" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {config.suggestedQuestions.slice(0, 2).map((q) => (
                            <span
                              key={q}
                              className="ebere-followup"
                              style={{
                                fontSize: 13,
                                color: hoveredFollowup === q ? t.textPrimary : t.textSecondary,
                                fontFamily: '"Open Runde", sans-serif',
                                lineHeight: 1.5,
                              }}
                              onMouseEnter={() => setHoveredFollowup(q)}
                              onMouseLeave={() => setHoveredFollowup(null)}
                              onClick={() => sendMessage(q)}
                            >
                              <span style={{ color: hoveredFollowup === q ? CTA : t.textHint, marginRight: 3 }}>
                                {config.followUpPrefix}
                              </span>
                              {q}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── Typing indicator ── */}
        {loading && (
          <div className="ebere-msg">
            <TypingDots />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "10px 12px",
          background: t.bgPanel,
          borderTop: `1px solid ${t.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            background: t.bgElevated,
            border: `1px solid ${inputFocused ? t.borderFocus : t.border}`,
            borderRadius: 12,
            padding: "8px 8px 8px 14px",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            boxShadow: inputFocused
              ? `0 0 0 3px ${colorScheme === "dark" ? "rgba(46,158,201,0.1)" : "rgba(46,158,201,0.08)"}`
              : "none",
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={config.inputPlaceholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: '"Geist Mono", monospace',
              fontSize: 13,
              color: t.textPrimary,
              lineHeight: "20px",
              caretColor: CTA,
              minHeight: 20,
              maxHeight: 88,
              overflowY: "auto",
              padding: 0,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!canSend}
            title="Send"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: CTA,
              border: "none",
              color: "#fff",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: canSend ? 1 : 0.28,
              flexShrink: 0,
              transition: "opacity 0.15s ease, transform 0.1s ease",
              transform: canSend ? "scale(1)" : "scale(0.93)",
              alignSelf: "flex-end",
              marginBottom: 1,
            }}
          >
            <ArrowIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Framer property controls ───────────────────────────────────────────────

addPropertyControls(EbereLLMPanel, {
  colorScheme: {
    type: ControlType.Enum,
    title: "Color Scheme",
    options: ["dark", "light"],
    optionTitles: ["Dark", "Light"],
    defaultValue: "dark",
  },
  isOpen: {
    type: ControlType.Boolean,
    title: "Open",
    defaultValue: true,
  },
});
