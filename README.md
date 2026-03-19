# Portfolio LLM

An AI side panel chatbot for your portfolio site. Visitors ask questions about you and get answers via the Anthropic API.

Built with React + TypeScript, deployed on Vercel, and embedded in Framer.

---

## How it works

```
Visitor asks a question in Framer
  → Component sends it to your Vercel API
  → Vercel forwards it to Anthropic (using your secret API key)
  → Response is displayed in the panel
```

Your API key never touches the browser.

---

## Setup (5 steps)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Edit your content
Open **`ebereLLMConfig.ts`** and update:
- `panelTitle` — your name/brand
- `avatarUrl` — link to your avatar image
- `greeting` — opening message
- `suggestedQuestions` — starter questions about you
- `systemPrompt` — your knowledge base (who you are, your work, your projects)

> This is the only file you need to edit for content. No coding required.

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel deploy --prod
```

In the Vercel dashboard → your project → **Settings → Environment Variables**, add:
- Key: `ANTHROPIC_API_KEY`
- Value: your key from console.anthropic.com

Then redeploy:
```bash
vercel deploy --prod
```

### 4. Update your API URL
In `ebereLLMConfig.ts`, set `apiUrl` to your Vercel deployment URL:
```ts
apiUrl: "https://your-project.vercel.app/api/chat",
```

Do the same in `EbereLLMPanel.framer.tsx`.

### 5. Add to Framer
- In Framer → **Assets → Code → +** → **New File**
- Name it `EbereLLMPanel`
- Paste the full contents of `EbereLLMPanel.framer.tsx`
- Drag the component onto your canvas
- Bind `colorScheme` to your site's theme variable

---

## File structure

```
/
├── ebereLLMConfig.ts        ← edit this for all your content
├── EbereLLMPanel.tsx        ← component for local dev
├── EbereLLMPanel.framer.tsx ← self-contained file to upload to Framer
├── api/
│   └── chat.js              ← Vercel serverless proxy (no edits needed)
└── knowledge.md             ← reference copy of your knowledge base
```

---

## Coaching the LLM

Edit the `systemPrompt` in `ebereLLMConfig.ts`. Add sections using `##` headings:

```
## Availability
Currently open to senior design leadership roles and consulting.

## Tools
Figma, Framer, Notion, Linear, GitHub.

## Contact
Reach me at hello@yoursite.com
```

The more detail you add, the better the answers.

---

## Stack
- **Component:** React + TypeScript (Framer Code Component)
- **API proxy:** Vercel Serverless Function
- **AI model:** `claude-sonnet-4-5` via Anthropic API
- **Fonts:** Open Runde + Geist Mono
