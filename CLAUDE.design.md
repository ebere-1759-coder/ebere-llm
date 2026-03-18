# Design Tokens — ebere.design

## Color tokens

### Dark mode
```
bg-page:        #121212
bg-panel:       #171717
bg-elevated:    #1e1e1e
bg-card:        #2b2b2b
text-primary:   #ffffff
text-secondary: #9e9e9e
text-hint:      #525252
accent:         rgb(158, 158, 255)   /* lavender-purple */
accent-green:   rgb(25, 230, 114)    /* online dot */
border:         rgba(255, 255, 255, 0.08)
```

### Light mode
```
bg-page:        #f7f7f7
bg-panel:       #ffffff
bg-elevated:    #f0f0f0
bg-card:        #e8e8e8
text-primary:   #000000
text-secondary: #6e6e6e
text-hint:      #9e9e9e
accent:         rgb(0, 0, 238)       /* true blue */
accent-green:   rgb(22, 191, 94)
border:         rgba(0, 0, 0, 0.08)
```

Apply via a token object switched on the `colorScheme` prop — never hardcode hex values
in component logic.

## Typography
```
Heading:   "Open Runde", weight 500, letter-spacing -1px
Body:      "Open Runde", weight 400, 16px, line-height 1.4
UI label:  "Open Runde", weight 400, 12px
Mono:      "Geist Mono", weight 400, 14px, line-height 1.2
```

## Component patterns (from the live site)
```
Border radius:    12px on all cards, buttons, bubbles, inputs
Nav link:         bg bg-panel, color accent, border-radius 12px, padding 8px 12px, font 12px
Primary button:   bg text-primary, color accent, border-radius 12px, padding 8px 16px
Card border:      1px solid border-token
Hover transition: color 0.2s ease
Panel transition: transform 0.3s ease, opacity 0.2s ease
```

## Panel anatomy (top → bottom, width 380px, fixed right)

**Header** — height 48px, padding 0 16px, bg bg-panel, border-bottom 1px solid border-token
- Left: circular avatar 32px + "EBERE LLM" in Geist Mono 12px uppercase, color text-secondary
- Right: ⓘ reset (↺) close (×) icons, color text-hint, 20px, gap 12px

**Chat area** — flex 1, overflow-y scroll, padding 24px, bg bg-page
- User bubble: bg bg-card, border-radius 12px, padding 10px 14px, text-primary, Open Runde 14px, align right
- AI response: no bubble, text-secondary, Open Runde 16px, line-height 1.6
- Divider: 1px solid border-token, margin 16px 0, before follow-up suggestions

**Follow-up suggestions** — below each AI response
- Prefix: "↳ " color text-hint, font-size 14px, Open Runde
- Hover: color text-primary, cursor pointer
- Clicking sends the question as the next user message

**Ambient orb** — position absolute, pointer-events none
- 40px circle, bg accent at 50% opacity, filter blur(14px)
- CSS keyframe floating animation, 8s loop, subtle path

**Input bar** — height 56px, padding 12px 16px, bg bg-panel, border-top 1px solid border-token
- Textarea: bg transparent, placeholder "Ask about Ebere..." Geist Mono 14px text-hint
- Send button: 28×28px, bg accent, color #fff, border-radius 8px, ↑ arrow icon

## Initial (empty) state
```
Heading: config.greeting
Font: Open Runde 24px weight 500 text-primary letter-spacing -1px
Below: config.suggestedQuestions mapped as ↳ items
```

## Avatar
- 32px circle in header, src = config.avatarUrl
- box-shadow: 0 0 0 3px rgba(158,158,255,0.25)
- Keyframe pulse: glow opacity 0.2 → 0.4 → 0.2 over 3s ease-in-out
- In light mode use rgba(0,0,238,0.2) for glow
