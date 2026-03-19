// ebereLLMConfig.ts — single source of truth for all content
// Edit this file freely. Nothing is hardcoded in the component.

export const config = {
  // ── API ──────────────────────────────────────────────────────────────────
  // Your Vercel deployment URL — change this after running `vercel deploy`
  apiUrl: "https://ebere-llm.vercel.app/api/chat",

  // ── Header ──────────────────────────────────────────────────────────────
  panelTitle: "EBERE LLM",
  avatarUrl: "https://ebere.design/avatar.jpg", // replace with actual avatar URL

  // ── Empty state ─────────────────────────────────────────────────────────
  greeting: "What do you want to know?",

  suggestedQuestions: [
    "What kind of work does Ebere do?",
    "Tell me about the Banana Stand design system.",
    "What's Ebere's design philosophy?",
    "Is Ebere available for new opportunities?",
  ],

  // ── Input ───────────────────────────────────────────────────────────────
  inputPlaceholder: "Ask about Ebere...",

  // ── System prompt ────────────────────────────────────────────────────────
  // The knowledge base below is injected into every API call.
  systemPrompt: `You are Ebere LLM — a conversational AI on Ebere Ekeledo's portfolio site (ebere.design).
Your sole purpose is to answer visitor questions about Ebere.
Be direct, warm, and concise. Never fabricate details not in the knowledge base.
If asked something outside the knowledge base, say you don't have that information
and suggest they reach out to Ebere directly.

--- KNOWLEDGE BASE ---

## Who Ebere is
Ebere Ekeledo is a Calgary-based Product Design Lead with 12+ years of experience
shaping product strategy and building scalable solutions. Currently at Pixel One.

## What Ebere does
- Leads product design for 0→1 initiatives
- Builds and scales design systems
- Partners with cross-functional teams to align design with business goals
- Turns complex problems into products people actually want to use

## Approach
Ebere sees design and engineering as intertwined, not separate. Understanding technical
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

  // ── Follow-up suggestions per response ──────────────────────────────────
  // These are generated dynamically by the AI. This array seeds the first view.
  followUpPrefix: "↳ ",
}
