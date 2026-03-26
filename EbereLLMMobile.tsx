"use client";

import { addPropertyControls, ControlType } from "framer";
import { useState, useRef, useEffect, useCallback } from "react";
import { config } from "./ebereLLMConfig";

// ── Types ─────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EbereLLMMobileProps {
  colorScheme: "dark" | "light";
  isOpen?: boolean;
  onClose?: () => void;
}

// ── Design tokens ─────────────────────────────────────────────────────────

const tokens = {
  dark: {
    bgPage: "#121212",
    bgPanel: "#171717",
    bgElevated: "#1e1e1e",
    bgCard: "#2b2b2b",
    textPrimary: "#ffffff",
    textSecondary: "#9e9e9e",
    textHint: "#525252",
    accent: "rgb(158, 158, 255)",
    accentGreen: "rgb(25, 230, 114)",
    border: "rgba(255, 255, 255, 0.08)",
    avatarGlow: "rgba(158, 158, 255, 0.25)",
    orbColor: "rgba(158, 158, 255, 0.5)",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
  light: {
    bgPage: "#f7f7f7",
    bgPanel: "#ffffff",
    bgElevated: "#f0f0f0",
    bgCard: "#e8e8e8",
    textPrimary: "#000000",
    textSecondary: "#6e6e6e",
    textHint: "#9e9e9e",
    accent: "rgb(0, 0, 238)",
    accentGreen: "rgb(22, 191, 94)",
    border: "rgba(0, 0, 0, 0.08)",
    avatarGlow: "rgba(0, 0, 238, 0.2)",
    orbColor: "rgba(0, 0, 238, 0.5)",
    overlay: "rgba(0, 0, 0, 0.3)",
  },
};

// ── Keyframe injection ────────────────────────────────────────────────────

const STYLE_ID = "ebere-llm-mobile-styles";

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes eberePulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(158,158,255,0.2); }
      50%       { box-shadow: 0 0 0 3px rgba(158,158,255,0.4); }
    }
    @keyframes eberePulseLight {
      0%, 100% { box-shadow: 0 0 0 3px rgba(0,0,238,0.1); }
      50%       { box-shadow: 0 0 0 3px rgba(0,0,238,0.25); }
    }
    @keyframes ebereFloat {
      0%   { transform: translate(0px, 0px); }
      25%  { transform: translate(6px, -8px); }
      50%  { transform: translate(-4px, -14px); }
      75%  { transform: translate(-8px, -6px); }
      100% { transform: translate(0px, 0px); }
    }
    @keyframes ebereFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ebere-msg-m { animation: ebereFadeIn 0.25s ease forwards; }
    .ebere-followup-m { transition: color 0.2s ease; cursor: pointer; }
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
  const [hoveredFollowup, setHoveredFollowup] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportWidth = useViewportWidth();

  // Clamp panel width between 390 and 810; full-width on mobile
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
    const lineHeight = 20;
    const maxHeight = lineHeight * 5;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
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

      const data = await res.json();
      const reply = data.text ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, Enter adds newline; use send button to submit
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

  // ── Panel: full-screen bottom sheet on mobile ───────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: t.overlay,
    zIndex: 9998,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: isOpen
      ? `translateX(-50%) translateY(0)`
      : `translateX(-50%) translateY(100%)`,
    width: panelWidth,
    // Leave a small gap at the top on wider phones/tablets (810px)
    height: isMobileNarrow && panelWidth <= 430 ? "100dvh" : "92dvh",
    maxHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: '"Open Runde", sans-serif',
    background: t.bgPanel,
    borderRadius: panelWidth <= 430 ? "0" : "20px 20px 0 0",
    borderTop: panelWidth <= 430 ? "none" : `1px solid ${t.border}`,
    boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
    transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
    zIndex: 9999,
    overflow: "hidden",
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
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    animation:
      colorScheme === "dark"
        ? "eberePulse 3s ease-in-out infinite"
        : "eberePulseLight 3s ease-in-out infinite",
  };

  const iconBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: t.textHint,
    fontSize: 22,
    cursor: "pointer",
    padding: 8,
    lineHeight: 1,
    fontFamily: "inherit",
    // Larger touch target
    minWidth: 44,
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

  // ── Chat area ──────────────────────────────────────────────────────────

  const chatAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "20px 20px 8px",
    background: t.bgPage,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative",
    // Smooth scroll on iOS
    WebkitOverflowScrolling: "touch",
  };

  // ── Input bar ──────────────────────────────────────────────────────────

  const inputBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 16px",
    paddingBottom: "max(12px, env(safe-area-inset-bottom))",
    background: t.bgPanel,
    borderTop: `1px solid ${t.border}`,
    flexShrink: 0,
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    background: t.bgElevated,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    outline: "none",
    resize: "none",
    fontFamily: '"Geist Mono", monospace',
    fontSize: 15,
    color: t.textPrimary,
    lineHeight: "20px",
    caretColor: t.accent,
    padding: "10px 14px",
    minHeight: 44,
    maxHeight: 100,
    overflowY: "auto",
    // Prevent iOS zoom on focus (font-size >= 16 avoids zoom)
    WebkitTextSizeAdjust: "100%",
  };

  const sendBtnStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: t.accent,
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: loading || !input.trim() ? 0.4 : 1,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div style={overlayStyle} onClick={onClose} />

      <div style={panelStyle}>
        {/* Drag handle pill (tablet only) */}
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
                fontSize: 12,
                letterSpacing: "0.08em",
                color: t.textSecondary,
                textTransform: "uppercase",
              }}
            >
              {config.panelTitle}
            </span>
            {/* Online dot */}
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.accentGreen,
                display: "inline-block",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button style={iconBtnStyle} title="Reset" onClick={reset}>
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
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: t.orbColor,
              filter: "blur(16px)",
              pointerEvents: "none",
              animation: "ebereFloat 8s ease-in-out infinite",
            }}
          />

          {/* Empty state */}
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
                  fontWeight: 500,
                  letterSpacing: "-0.5px",
                  color: t.textPrimary,
                  margin: "0 0 20px 0",
                }}
              >
                {config.greeting}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {config.suggestedQuestions.map((q) => (
                  <span
                    key={q}
                    className="ebere-followup-m"
                    style={{
                      fontSize: 15,
                      color: hoveredFollowup === q ? t.textPrimary : t.textSecondary,
                      fontFamily: '"Open Runde", sans-serif',
                      // Larger touch target
                      padding: "4px 0",
                      display: "block",
                    }}
                    onMouseEnter={() => setHoveredFollowup(q)}
                    onMouseLeave={() => setHoveredFollowup(null)}
                    onTouchStart={() => setHoveredFollowup(q)}
                    onTouchEnd={() => setHoveredFollowup(null)}
                    onClick={() => sendMessage(q)}
                  >
                    <span style={{ color: t.textHint }}>{config.followUpPrefix}</span>
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className="ebere-msg-m" style={{ marginBottom: 20 }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      background: t.bgCard,
                      borderRadius: 16,
                      padding: "10px 16px",
                      color: t.textPrimary,
                      fontFamily: '"Open Runde", sans-serif',
                      fontSize: 15,
                      maxWidth: "82%",
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      color: t.textSecondary,
                      fontFamily: '"Open Runde", sans-serif',
                      fontSize: 16,
                      lineHeight: 1.65,
                      margin: "0 0 12px 0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </p>
                  {i === messages.length - 1 && !loading && (
                    <>
                      <div
                        style={{
                          height: 1,
                          background: t.border,
                          margin: "16px 0",
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                            }}
                            onMouseEnter={() => setHoveredFollowup(q)}
                            onMouseLeave={() => setHoveredFollowup(null)}
                            onTouchStart={() => setHoveredFollowup(q)}
                            onTouchEnd={() => setHoveredFollowup(null)}
                            onClick={() => sendMessage(q)}
                          >
                            <span style={{ color: t.textHint }}>{config.followUpPrefix}</span>
                            {q}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="ebere-msg-m" style={{ marginBottom: 20 }}>
              <p
                style={{
                  color: t.textHint,
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: 13,
                  margin: 0,
                }}
              >
                thinking...
              </p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={inputBarStyle}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={config.inputPlaceholder}
            style={textareaStyle}
          />
          <button
            style={sendBtnStyle}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            title="Send"
          >
            ↑
          </button>
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
