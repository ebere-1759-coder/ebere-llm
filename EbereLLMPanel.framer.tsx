import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, useEffect, useCallback } from "react"

// ─────────────────────────────────────────────────────────────────────────
// ✏️  EDIT THIS SECTION ONLY — everything below is hands-off
// ─────────────────────────────────────────────────────────────────────────

const config = {
  // Your Vercel deployment URL (from `vercel deploy`)
  apiUrl: "https://ebere-llm.vercel.app/api/chat",

  // Panel header
  panelTitle: "EBERE LLM",           // e.g. "JANE LLM"
  avatarUrl: "https://ebere.design/avatar.jpg", // URL to your avatar image

  // Empty state
  greeting: "What do you want to know?",
  suggestedQuestions: [
    "What kind of work does Ebere do?",
    "Tell me about the Banana Stand design system.",
    "What's Ebere's design philosophy?",
    "Is Ebere available for new opportunities?",
  ],

  inputPlaceholder: "Ask about Ebere...",
  followUpPrefix: "↳ ",

  // ── Knowledge base ──────────────────────────────────────────────────────
  // This is injected into every API call. Edit freely — no coding required.
  // Add sections using ## headings. Keep entries concise (2–4 sentences).
  systemPrompt: `You are a conversational AI on a portfolio site.
Your sole purpose is to answer visitor questions about the person described below.
Be direct, warm, and concise. Never fabricate details not in the knowledge base.
If asked something outside the knowledge base, say you don't have that information
and suggest they reach out directly.

--- KNOWLEDGE BASE ---

## Who I am
Ebere Ekeledo is a Calgary-based Product Design Lead with 12+ years of experience
shaping product strategy and building scalable solutions. Currently at Pixel One.

## What I do
- Lead product design for 0→1 initiatives
- Build and scale design systems
- Partner with cross-functional teams to align design with business goals
- Turn complex problems into products people actually want to use

## My approach
I see design and engineering as intertwined, not separate. Understanding technical
constraints helps create better solutions. Focus areas: clarity, systems thinking,
and disciplined execution.

## Projects
**Banana Stand** — A comprehensive design system built to scale across products.
**Loop** — An all-in-one links platform.

## Skills
Product strategy, UX research, rapid prototyping, design systems, cross-functional
team leadership, 0→1 product development, engineering-informed design.

## Background
12+ years in product design. Based in Calgary, Alberta, Canada.
Available for senior design leadership and consulting conversations.

--- END KNOWLEDGE BASE ---`,
}

// ─────────────────────────────────────────────────────────────────────────
// 🚫 DO NOT EDIT BELOW THIS LINE
// ─────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant"
  content: string
}

interface EbereLLMPanelProps {
  colorScheme: "dark" | "light"
  isOpen?: boolean
  onClose?: () => void
}

// ── Design tokens ─────────────────────────────────────────────────────────

const tokens = {
  dark: {
    bgPage: "#121212",
    bgPanel: "#171717",
    bgCard: "#2b2b2b",
    textPrimary: "#ffffff",
    textSecondary: "#9e9e9e",
    textHint: "#525252",
    accent: "rgb(158, 158, 255)",
    accentGreen: "rgb(25, 230, 114)",
    border: "rgba(255, 255, 255, 0.08)",
    orbColor: "rgba(158, 158, 255, 0.5)",
  },
  light: {
    bgPage: "#f7f7f7",
    bgPanel: "#ffffff",
    bgCard: "#e8e8e8",
    textPrimary: "#000000",
    textSecondary: "#6e6e6e",
    textHint: "#9e9e9e",
    accent: "rgb(0, 0, 238)",
    accentGreen: "rgb(22, 191, 94)",
    border: "rgba(0, 0, 0, 0.08)",
    orbColor: "rgba(0, 0, 238, 0.5)",
  },
}

// ── Keyframe injection ────────────────────────────────────────────────────

const STYLE_ID = "ebere-llm-styles"

function injectStyles() {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
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
    .ebere-msg { animation: ebereFadeIn 0.25s ease forwards; }
    .ebere-followup { transition: color 0.2s ease; cursor: pointer; }
  `
  document.head.appendChild(style)
}

// ── Component ─────────────────────────────────────────────────────────────

export default function EbereLLMPanel({
  colorScheme = "dark",
  isOpen = true,
  onClose,
}: EbereLLMPanelProps) {
  const t = tokens[colorScheme]
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [hoveredFollowup, setHoveredFollowup] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const trimmedHistory = newMessages.slice(-6)

    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: config.systemPrompt, messages: trimmedHistory }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.text ?? "Sorry, I couldn't get a response." }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => { setMessages([]); setInput("") }
  const isEmpty = messages.length === 0

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 380, height: "100vh",
      display: "flex", flexDirection: "column",
      fontFamily: '"Open Runde", sans-serif',
      background: t.bgPanel, borderLeft: `1px solid ${t.border}`,
      transform: isOpen ? "translateX(0)" : "translateX(100%)",
      opacity: isOpen ? 1 : 0,
      transition: "transform 0.3s ease, opacity 0.2s ease",
      zIndex: 9999, overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        height: 48, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        background: t.bgPanel, borderBottom: `1px solid ${t.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={config.avatarUrl} alt="Ebere"
            style={{
              width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
              animation: colorScheme === "dark" ? "eberePulse 3s ease-in-out infinite" : "eberePulseLight 3s ease-in-out infinite",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
          <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12, letterSpacing: "0.08em", color: t.textSecondary, textTransform: "uppercase" }}>
            {config.panelTitle}
          </span>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.accentGreen, display: "inline-block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={reset} style={{ background: "none", border: "none", color: t.textHint, fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}>↺</button>
          {onClose && <button onClick={onClose} style={{ background: "none", border: "none", color: t.textHint, fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 24,
        background: t.bgPage, display: "flex", flexDirection: "column", position: "relative",
      }}>
        {/* Ambient orb */}
        <div style={{
          position: "absolute", top: 32, right: 32, width: 40, height: 40,
          borderRadius: "50%", background: t.orbColor, filter: "blur(14px)",
          pointerEvents: "none", animation: "ebereFloat 8s ease-in-out infinite",
        }} />

        {/* Empty state */}
        {isEmpty && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontFamily: '"Open Runde", sans-serif', fontSize: 24, fontWeight: 500, letterSpacing: "-1px", color: t.textPrimary, margin: "0 0 20px 0" }}>
              {config.greeting}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {config.suggestedQuestions.map((q) => (
                <span key={q} className="ebere-followup"
                  style={{ fontSize: 14, color: hoveredFollowup === q ? t.textPrimary : t.textSecondary, fontFamily: '"Open Runde", sans-serif' }}
                  onMouseEnter={() => setHoveredFollowup(q)}
                  onMouseLeave={() => setHoveredFollowup(null)}
                  onClick={() => sendMessage(q)}
                >
                  <span style={{ color: t.textHint }}>{config.followUpPrefix}</span>{q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className="ebere-msg" style={{ marginBottom: 20 }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: t.bgCard, borderRadius: 12, padding: "10px 14px", color: t.textPrimary, fontFamily: '"Open Runde", sans-serif', fontSize: 14, maxWidth: "80%", lineHeight: 1.4 }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: t.textSecondary, fontFamily: '"Open Runde", sans-serif', fontSize: 16, lineHeight: 1.6, margin: "0 0 12px 0", whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </p>
                {i === messages.length - 1 && !loading && (
                  <>
                    <div style={{ height: 1, background: t.border, margin: "16px 0" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {config.suggestedQuestions.slice(0, 2).map((q) => (
                        <span key={q} className="ebere-followup"
                          style={{ fontSize: 14, color: hoveredFollowup === q ? t.textPrimary : t.textSecondary, fontFamily: '"Open Runde", sans-serif' }}
                          onMouseEnter={() => setHoveredFollowup(q)}
                          onMouseLeave={() => setHoveredFollowup(null)}
                          onClick={() => sendMessage(q)}
                        >
                          <span style={{ color: t.textHint }}>{config.followUpPrefix}</span>{q}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="ebere-msg" style={{ marginBottom: 20 }}>
            <p style={{ color: t.textHint, fontFamily: '"Geist Mono", monospace', fontSize: 13, margin: 0 }}>thinking...</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: t.bgPanel, borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.inputPlaceholder}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: '"Geist Mono", monospace', fontSize: 14, color: t.textPrimary, lineHeight: 1.4, caretColor: t.accent }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading}
          style={{ width: 28, height: 28, borderRadius: 8, background: t.accent, border: "none", color: "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.5 : 1, flexShrink: 0 }}
        >↑</button>
      </div>
    </div>
  )
}

// ── Framer property controls ──────────────────────────────────────────────

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
})
