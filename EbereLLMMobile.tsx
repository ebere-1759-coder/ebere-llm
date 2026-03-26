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

interface EbereLLMMobileProps {
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
    borderFocus: "rgba(46,158,201,0.5)",
    orbColor: "rgba(46,158,201,0.35)",
    overlay: "rgba(0, 0, 0, 0.65)",
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
    borderFocus: "rgba(46,158,201,0.6)",
    orbColor: "rgba(46,158,201,0.2)",
    overlay: "rgba(0, 0, 0, 0.35)",
    errorBg: "rgba(220, 50, 50, 0.06)",
    errorText: "#cc3333",
  },
};

// ── Arrow icon ─────────────────────────────────────────────────────────────

function ArrowIcon({ size = 16 }: { size?: number }) {
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
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0" }}>
      <span className="ebere-dot-m" style={dotStyle} />
      <span className="ebere-dot-m ebere-dot-m2" style={dotStyle} />
      <span className="ebere-dot-m ebere-dot-m3" style={dotStyle} />
    </div>
  );
}

// ── Keyframe injection ────────────────────────────────────────────────────

const STYLE_ID = "ebere-llm-mobile-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes eberePulseM {
      0%, 100% { box-shadow: 0 0 0 3px rgba(46,158,201,0.2); }
      50%       { box-shadow: 0 0 0 3px rgba(46,158,201,0.45); }
    }
    @keyframes ebereFloatM {
      0%   { transform: translate(0px, 0px); }
      25%  { transform: translate(6px, -8px); }
      50%  { transform: translate(-4px, -14px); }
      75%  { transform: translate(-8px, -6px); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes ebereFadeInM {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ebereDotM {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
      30% { transform: translateY(-5px); opacity: 1; }
    }
    .ebere-msg-m { animation: ebereFadeInM 0.28s ease forwards; }
    .ebere-followup-m {
      transition: color 0.15s ease;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .ebere-dot-m { animation: ebereDotM 1.3s ease-in-out infinite; }
    .ebere-dot-m2 { animation-delay: 0.18s; }
    .ebere-dot-m3 { animation-delay: 0.36s; }
  `;
  document.head.appendChild(style);
}

// ── Viewport hook ─────────────────────────────────────────────────────────

function useViewportWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 390
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function EbereLLMMobile({
  colorScheme = "dark",
  isOpen = true,
  onClose,
}: EbereLLMMobileProps) {
  const t = tokens[colorScheme];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [hoveredFollowup, setHoveredFollowup] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportWidth = useViewportWidth();

  const isMobileNarrow = viewportWidth <= 810;
  const panelWidth = isMobileNarrow ? viewportWidth : Math.min(viewportWidth, 810);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
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
    if (e.key === "Enter" && !e.shiftKey && !isMobileNarrow) {
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

  // ── Overlay ────────────────────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: t.overlay,
    zIndex: 9998,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  // ── Panel ──────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: isOpen
      ? "translateX(-50%) translateY(0)"
      : "translateX(-50%) translateY(100%)",
    width: panelWidth,
    height: isMobileNarrow && panelWidth <= 430 ? "100dvh" : "92dvh",
    maxHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: '"Open Runde", sans-serif',
    background: t.bgPanel,
    borderRadius: panelWidth <= 430 ? "0" : "20px 20px 0 0",
    borderTop: panelWidth <= 430 ? "none" : `1px solid ${t.border}`,
    boxShadow: "0 -12px 48px rgba(0,0,0,0.35)",
    transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
    zIndex: 9999,
    overflow: "hidden",
  };

  // ── Drag handle ────────────────────────────────────────────────────────

  const dragHandleStyle: React.CSSProperties = {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: t.border,
    margin: "10px auto 0",
    flexShrink: 0,
    display: panelWidth <= 430 ? "none" : "block",
  };

  // ── Header ─────────────────────────────────────────────────────────────

  const headerStyle: React.CSSProperties = {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    background: t.bgPanel,
    borderBottom: `1px solid ${t.border}`,
    flexShrink: 0,
  };

  const avatarStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: "50%",
    objectFit: "cover",
    animation: "eberePulseM 3s ease-in-out infinite",
  };

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: t.textHint,
    fontSize: 20,
    cursor: "pointer",
    padding: 8,
    lineHeight: 1,
    fontFamily: "inherit",
    minWidth: 44,
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  };

  // ── Chat area ──────────────────────────────────────────────────────────

  const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px 12px",
    background: t.bgPage,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    WebkitOverflowScrolling: "touch",
  };

  // ── Input bar ──────────────────────────────────────────────────────────

  const inputBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "10px 14px",
    paddingBottom: "max(10px, env(safe-area-inset-bottom))",
    background: t.bgPanel,
    borderTop: `1px solid ${t.border}`,
    flexShrink: 0,
  };

  const inputWrapStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    background: t.bgElevated,
    border: `1px solid ${inputFocused ? t.borderFocus : t.border}`,
    borderRadius: 14,
    padding: "10px 10px 10px 14px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    boxShadow: inputFocused
      ? `0 0 0 3px ${colorScheme === "dark" ? "rgba(46,158,201,0.12)" : "rgba(46,158,201,0.1)"}`
      : "none",
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none",
    fontFamily: '"Geist Mono", monospace',
    fontSize: 15,
    color: t.textPrimary,
    lineHeight: "22px",
    caretColor: CTA,
    minHeight: 22,
    maxHeight: 100,
    overflowY: "auto",
    padding: 0,
    WebkitTextSizeAdjust: "100%",
  };

  const sendBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
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
  };

  return (
    <>
      {/* Backdrop */}
      <div style={overlayStyle} onClick={onClose} />

      <div style={panelStyle}>
        {/* Drag handle */}
        <div style={dragHandleStyle} />

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
            <button style={iconBtnStyle} title="New chat" onClick={reset}>
              ↺
            </button>
            {onClose && (
              <button style={iconBtnStyle} title="Close" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={chatAreaStyle}>
          {/* Ambient orb */}
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: t.orbColor,
              filter: "blur(20px)",
              pointerEvents: "none",
              animation: "ebereFloatM 9s ease-in-out infinite",
            }}
          />

          {/* ── Empty state ── */}
          {isEmpty && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingBottom: 24,
              }}
            >
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
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {config.suggestedQuestions.map((q) => (
                  <span
                    key={q}
                    className="ebere-followup-m"
                    style={{
                      fontSize: 15,
                      color: hoveredFollowup === q ? t.textPrimary : t.textSecondary,
                      fontFamily: '"Open Runde", sans-serif',
                      padding: "4px 0",
                      display: "block",
                      lineHeight: 1.5,
                    }}
                    onMouseEnter={() => setHoveredFollowup(q)}
                    onMouseLeave={() => setHoveredFollowup(null)}
                    onTouchStart={() => setHoveredFollowup(q)}
                    onTouchEnd={() => setHoveredFollowup(null)}
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
            <div key={i} className="ebere-msg-m" style={{ marginBottom: 20 }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      background: t.bgCard,
                      borderRadius: "16px 16px 4px 16px",
                      padding: "11px 16px",
                      color: t.textPrimary,
                      fontFamily: '"Open Runde", sans-serif',
                      fontSize: 15,
                      maxWidth: "82%",
                      lineHeight: 1.55,
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
                        borderRadius: 12,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                      <p
                        style={{
                          color: t.errorText,
                          fontFamily: '"Open Runde", sans-serif',
                          fontSize: 14,
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
                          fontSize: 16,
                          lineHeight: 1.7,
                          margin: "0 0 12px 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </p>
                      {i === messages.length - 1 && !loading && (
                        <>
                          <div style={{ height: 1, background: t.border, margin: "14px 0" }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {config.suggestedQuestions.slice(0, 2).map((q) => (
                              <span
                                key={q}
                                className="ebere-followup-m"
                                style={{
                                  fontSize: 15,
                                  color: hoveredFollowup === q ? t.textPrimary : t.textSecondary,
                                  fontFamily: '"Open Runde", sans-serif',
                                  padding: "4px 0",
                                  display: "block",
                                  lineHeight: 1.5,
                                }}
                                onMouseEnter={() => setHoveredFollowup(q)}
                                onMouseLeave={() => setHoveredFollowup(null)}
                                onTouchStart={() => setHoveredFollowup(q)}
                                onTouchEnd={() => setHoveredFollowup(null)}
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
            <div className="ebere-msg-m" style={{ marginBottom: 20 }}>
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
              <ArrowIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Framer property controls ───────────────────────────────────────────────

addPropertyControls(EbereLLMMobile, {
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
