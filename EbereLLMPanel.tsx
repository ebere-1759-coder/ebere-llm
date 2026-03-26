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
    bgPage: "#121212",
    bgPanel: "#171717",
    bgElevated: "#1e1e1e",
    bgCard: "#242424",
    textPrimary: "#ffffff",
    textSecondary: "#9e9e9e",
    textHint: "#464646",
    accentGreen: "rgb(25, 230, 114)",
    border: "rgba(255, 255, 255, 0.07)",
    borderFocus: `rgba(46,158,201,0.5)`,
    orbColor: "rgba(46,158,201,0.35)",
    errorBg: "rgba(255, 80, 80, 0.07)",
    errorText: "#ff8f8f",
  },
  light: {
    bgPage: "#f4f4f4",
    bgPanel: "#ffffff",
    bgElevated: "#efefef",
    bgCard: "#e6e6e6",
    textPrimary: "#0a0a0a",
    textSecondary: "#6e6e6e",
    textHint: "#b0b0b0",
    accentGreen: "rgb(22, 191, 94)",
    border: "rgba(0, 0, 0, 0.08)",
    borderFocus: `rgba(46,158,201,0.6)`,
    orbColor: "rgba(46,158,201,0.2)",
    errorBg: "rgba(220, 50, 50, 0.06)",
    errorText: "#cc3333",
  },
};

// ── Arrow icon ─────────────────────────────────────────────────────────────

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
    </svg>
  );
}

// ── Typing dots ────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  const dotStyle: React.CSSProperties = {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0" }}>
      <span className="ebere-dot" style={dotStyle} />
      <span className="ebere-dot ebere-dot-2" style={dotStyle} />
      <span className="ebere-dot ebere-dot-3" style={dotStyle} />
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
    @keyframes eberePulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(46,158,201,0.2); }
      50%       { box-shadow: 0 0 0 3px rgba(46,158,201,0.45); }
    }
    @keyframes ebereFloat {
      0%   { transform: translate(0px, 0px); }
      25%  { transform: translate(6px, -8px); }
      50%  { transform: translate(-4px, -14px); }
      75%  { transform: translate(-8px, -6px); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes ebereFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ebereDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    .ebere-msg { animation: ebereFadeIn 0.28s ease forwards; }
    .ebere-followup {
      transition: color 0.15s ease;
      cursor: pointer;
      user-select: none;
    }
    .ebere-dot { animation: ebereDot 1.3s ease-in-out infinite; }
    .ebere-dot-2 { animation-delay: 0.18s; }
    .ebere-dot-3 { animation-delay: 0.36s; }
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

  // Auto-grow textarea up to 4 lines
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

    const trimmedHistory = newMessages.slice(-6);

    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: config.systemPrompt,
          messages: trimmedHistory,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const reply = data.text ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          isError: true,
        },
      ]);
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

  const reset = () => {
    setMessages([]);
    setInput("");
  };

  const isEmpty = messages.length === 0;
  const canSend = input.trim().length > 0 && !loading;

  // ── Panel ──────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
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
  };

  // ── Header ─────────────────────────────────────────────────────────────

  const headerStyle: React.CSSProperties = {
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: t.bgPanel,
    borderBottom: `1px solid ${t.border}`,
    flexShrink: 0,
  };

  const avatarStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    objectFit: "cover",
    animation: "eberePulse 3s ease-in-out infinite",
  };

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: t.textHint,
    fontSize: 17,
    cursor: "pointer",
    padding: 6,
    lineHeight: 1,
    fontFamily: "inherit",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s ease",
  };

  // ── Chat area ──────────────────────────────────────────────────────────

  const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "28px 20px 12px",
    background: t.bgPage,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative",
  };

  // ── Input bar ──────────────────────────────────────────────────────────

  const inputBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "10px 12px",
    background: t.bgPanel,
    borderTop: `1px solid ${t.border}`,
    flexShrink: 0,
  };

  const inputWrapStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 6,
    background: t.bgElevated,
    border: `1px solid ${inputFocused ? t.borderFocus : t.border}`,
    borderRadius: 12,
    padding: "8px 10px 8px 14px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    boxShadow: inputFocused ? `0 0 0 3px ${colorScheme === "dark" ? "rgba(46,158,201,0.12)" : "rgba(46,158,201,0.1)"}` : "none",
  };

  const textareaStyle: React.CSSProperties = {
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
  };

  const sendBtnStyle: React.CSSProperties = {
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
    opacity: canSend ? 1 : 0.3,
    flexShrink: 0,
    transition: "opacity 0.15s ease, transform 0.1s ease",
    transform: canSend ? "scale(1)" : "scale(0.95)",
    alignSelf: "flex-end",
    marginBottom: 1,
  };

  return (
    <div style={panelStyle}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={config.avatarUrl}
            alt="Ebere"
            style={avatarStyle}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: 11,
              letterSpacing: "0.1em",
              color: t.textSecondary,
              textTransform: "uppercase",
            }}
          >
            {config.panelTitle}
          </span>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.accentGreen,
              display: "inline-block",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={iconBtnStyle} title="New chat" onClick={reset}>↺</button>
          {onClose && (
            <button style={iconBtnStyle} title="Close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={chatAreaStyle}>
        {/* Ambient orb */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: t.orbColor,
            filter: "blur(20px)",
            pointerEvents: "none",
            animation: "ebereFloat 9s ease-in-out infinite",
          }}
        />

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
                fontSize: 11,
                color: t.textHint,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 24px 0",
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
                  <span style={{ color: hoveredFollowup === q ? CTA : t.textHint, marginRight: 2 }}>
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
          <div key={i} className="ebere-msg" style={{ marginBottom: 20 }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    background: t.bgCard,
                    borderRadius: "14px 14px 4px 14px",
                    padding: "10px 14px",
                    color: t.textPrimary,
                    fontFamily: '"Open Runde", sans-serif',
                    fontSize: 14,
                    maxWidth: "80%",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ) : (
              <div>
                {msg.isError ? (
                  <div
                    style={{
                      background: t.errorBg,
                      border: `1px solid ${colorScheme === "dark" ? "rgba(255,80,80,0.15)" : "rgba(200,50,50,0.12)"}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⚠</span>
                    <p
                      style={{
                        color: t.errorText,
                        fontFamily: '"Open Runde", sans-serif',
                        fontSize: 13,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <>
                    <p
                      style={{
                        color: t.textSecondary,
                        fontFamily: '"Open Runde", sans-serif',
                        fontSize: 15,
                        lineHeight: 1.65,
                        margin: "0 0 12px 0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </p>
                    {i === messages.length - 1 && !loading && (
                      <>
                        <div style={{ height: 1, background: t.border, margin: "14px 0" }} />
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
                              <span style={{ color: hoveredFollowup === q ? CTA : t.textHint, marginRight: 2 }}>
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
          <div className="ebere-msg" style={{ marginBottom: 20 }}>
            <TypingDots color={t.textHint} />
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div style={inputBarStyle}>
        <div style={inputWrapStyle}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={config.inputPlaceholder}
            style={textareaStyle}
          />
          <button
            style={sendBtnStyle}
            onClick={() => sendMessage(input)}
            disabled={!canSend}
            title="Send"
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
