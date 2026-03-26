# Ebere LLM — Project Instructions

## What we're building
An AI side panel chatbot for ebere.design. Visitors ask questions about Ebere Ekeledo
and get answers via the Anthropic API. Three files total — see structure below.

## Stack
- `EbereLLMPanel.tsx` — Framer Code Component (React + TypeScript)
- `ebereLLMConfig.ts` — single source of truth for all content (no hardcoded strings in component)
- `api/chat.js` — Vercel serverless proxy (keeps API key off the client)
- Anthropic model: `claude-haiku-4-5` (cost-optimised)

## File structure
```
/
├── CLAUDE.md              ← you are here
├── CLAUDE.design.md       ← all design tokens, typography, component patterns
├── ebereLLMConfig.ts      ← all editable content: prompts, questions, avatar, knowledge
├── EbereLLMPanel.tsx      ← Framer component (import everything from config, nothing hardcoded)
├── api/
│   └── chat.js            ← Vercel proxy function
└── knowledge.md           ← Ebere's full bio/projects (injected into every API call)
```

## Non-negotiable rules
1. `EbereLLMPanel.tsx` imports ALL content from `ebereLLMConfig.ts` — no hardcoded strings
2. `colorScheme: 'dark' | 'light'` prop controls theming — do NOT use CSS media queries
3. Use inline styles only (no CSS modules, no Tailwind) for Framer compatibility
4. API key lives in Vercel env var `ANTHROPIC_API_KEY` — never in the component
5. Fonts "Open Runde" and "Geist Mono" are already loaded on the site — reference directly

## Component props
```typescript
interface EbereLLMPanelProps {
  colorScheme: 'dark' | 'light'  // bind to Framer's theme variable
  isOpen?: boolean
  onClose?: () => void
}
```

## Deployment
1. `vercel deploy` from project root
2. Set `ANTHROPIC_API_KEY` in Vercel environment variables
3. In Framer: Assets → Code → upload `EbereLLMPanel.tsx`
4. Bind `colorScheme` prop to the site's existing theme variable

For design tokens and component patterns → `CLAUDE.design.md`
For content, prompts, and knowledge → `ebereLLMConfig.ts` and `knowledge.md`
