# NexaBank · Nova

**A conversational banking assistant with an in-house NLU, dialogue manager and NLG engine** — built as an ILP mini project in the banking domain.

Customers talk to *Nova* in plain English (“send 2k to Rohan”, “how much did I spend on Swiggy last month?”, “EMI for 20 lakh for 15 years”). Nova classifies the intent, extracts entities, runs a slot-filling dialogue with bank rules (confirmation, OTP above ₹25,000, daily limits), acts on a mock core-banking ledger, and replies with generated text plus rich visual cards.

> NexaBank is fictional. No real money, accounts or personal data are involved.

---

## Highlights

| Area | What's inside |
|---|---|
| **NLU** | From-scratch TF-IDF + softmax intent classifier (25 intents, word + character n-grams, int8-quantised) and a regex/gazetteer/fuzzy entity extractor (amounts in lakh/crore, payees & aliases, dates, merchants, cities, tenures). **94.3 % accuracy** on a hand-written hold-out set. |
| **Dialogue** | Frame-based slot filling, multi-turn context carry-over, digressions, confirmations, OTP step-up, business-rule checks, explainable per-turn trace. |
| **NLG** | Dialogue-act templates with variation, Indian number formatting (₹3,65,528 · ₹28.7 lakh), personalisation, confidence hedging, 16 kinds of rich cards, optional text-to-speech. |
| **Web app** | Next.js 15 + React 19 + Tailwind v4 + **GSAP + Lenis** (landing) + Framer Motion (app micro-states): count-up curtain preloader, masked word reveals, scroll-scrubbed manifesto, pinned horizontal pipeline, magnetic buttons, follower cursor, route curtains; dark-premium login; dashboard with chat, voice input and an *Under the hood* NLU inspector. |
| **Security** | scrypt password hashes, signed JWT in httpOnly cookie, middleware route guard, login lock-out, server-side dialogue state. |

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for diagrams and design decisions.

---

## Run it

Requires **Node.js 18.18+** (20 or 22 recommended).

```bash
npm install
npm run dev          # trains the NLU model first (≈5 s), then starts Next.js
```

Open http://localhost:3000 → **Sign in with a demo account**.

| Customer | Login | Password |
|---|---|---|
| Aarav Sharma (home loan, Privé) | `aarav@nexabank.demo` or `NB1001` | `Nova@123` |
| Priya Menon (no loans, KYC due) | `priya@nexabank.demo` or `NB1002` | `Nova@123` |

Optional: copy `.env.example` to `.env.local` and set `AUTH_SECRET` to a long random string.

### Other scripts

```bash
npm run train        # regenerate corpus, retrain, write nlu/model/{model,metrics}.json
npm run eval         # hold-out accuracy + every misclassified phrase
npm run simulate     # scripted 30-turn conversation through the full engine (no browser)
npm run build && npm start   # production build
```

---

## Things to try in the chat

- `What's my balance?` → `Show last 10 transactions` → `What about last week?`
- `How much did I spend on swiggy last month` → `what about this month?` *(context carry-over)*
- `Send money to Rohan` → `3000` → `Confirm`
- `Transfer 40k to mom` → `Confirm` → enter the demo OTP *(step-up auth)*
- `Send 500 to Karan` *(unknown payee is refused)*
- `EMI for 20 lakh home loan` → `15 years` → `what about 20 years?`
- `Am I eligible for a personal loan`
- `I lost my credit card` → `Yes, block it`
- `ATM in Chennai`, `FD rates`, `KYC documents`, `Talk to a human`, `I think I was scammed`
- Turn on **Under the hood** (top right) to watch intent scores, entities and dialogue-manager decisions for each turn.

---

## Project structure

```
nlu/                      # Natural Language Understanding (framework-free, runs in Node)
  text.mjs                # normalisation, tokenisation, light stemming
  classifier.mjs          # features, TF-IDF, softmax training (AdaGrad), int8 quantisation
  entities.mjs            # amount / payee / date / category / city / tenure extraction
  index.mjs               # createNLU(model).parse(text, ctx)
  data/intents.mjs        # template grammar → training corpus
  data/test.mjs           # hand-written hold-out set
  train.mjs, evaluate.mjs
  model/                  # generated: model.json, metrics.json
src/
  app/                    # Next.js App Router pages + API routes
    page.tsx              # landing
    login/page.tsx
    dashboard/page.tsx
    api/auth/{login,logout}, api/chat, api/me
  components/
    landing/              # Hero, ParseDemo, Pipeline (scroll story), Sections
    dashboard/            # Dashboard shell, ChatPanel, RichCards, Inspector
  lib/
    bank/dialogue.ts      # dialogue manager
    bank/nlg.ts           # natural language generation
    bank/data.ts          # mock core banking system
    auth.ts, types.ts
  middleware.ts           # session guard
docs/diagrams/            # rendered architecture diagrams (PNG + Mermaid source)
scripts/simulate.ts
```

---

## Motion & design system

| Piece | File | Notes |
|---|---|---|
| Tokens | `src/app/globals.css` | void/abyss/surface backgrounds, ivory + mist type, marigold accent, peacock glow; Instrument Serif display, Geist body, Geist Mono data |
| Curves | `globals.css`, `src/lib/motion.ts` | `--ease-out-expo` (entrances), `--ease-in-out-quart` (curtains), `--ease-spring` (success), `--ease-press` (active); mirrored as GSAP eases |
| Preloader | `components/site/Preloader.tsx` | server-rendered cover, count-up tied to `document.fonts.ready` + `window.load`, split-curtain open; page is fully laid out underneath → zero CLS |
| Smooth scroll | `components/site/SmoothScroll.tsx` | Lenis on GSAP's ticker, feeds ScrollTrigger |
| Reveals | `components/site/Reveal.tsx` | `SplitText` (masked words), `ScrubText` (scroll-brightened words), `Reveal` (fade + `data-speed` parallax) |
| Interaction | `Cursor.tsx`, `Magnetic.tsx` | follower cursor (fine pointers only, `data-cursor="Label"`), magnetic pull with elastic return |
| Pinned story | `components/landing/Pipeline.tsx` | desktop pin + horizontal scrub via `gsap.matchMedia`; stacked on mobile |
| Route change | `src/app/template.tsx` | curtain lifts on every page except the landing page |

Everything animates `transform`/`opacity` only. `prefers-reduced-motion` is detected before first paint (inline script): Lenis, cursor, marquee, curtains and reveals switch off and all content renders in its final state.

## Showreel deck

`deck/Nova_Showreel.pptx` — 16-slide motion-graphic presentation. Open in **PowerPoint 2019 / Microsoft 365** and press F5: slides auto-advance with **Morph** transitions (the peacock-eye motif glides between slides, the entity highlights grow on slides 4→5) and staggered entrance animations; it loops like a reel. Click to advance faster; Esc to stop. Older PowerPoint and Google Slides fall back to fades.

Rebuild after changing the model or copy: `NODE_PATH=$(npm root -g) node deck/build_deck.js && python3 deck/postprocess.py deck/build/raw.pptx deck/build/anim.json deck/Nova_Showreel.pptx` (needs `pptxgenjs react react-dom react-icons sharp` installed globally).

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP 3 + ScrollTrigger · Lenis · Framer Motion · jose (JWT) · lucide-react · Node crypto (scrypt) · Web Speech API. The NLU/NLG has **zero runtime dependencies**.

## Limitations

- Data lives in memory and resets when the server restarts; serverless hosts with multiple instances won't share dialogue state (use Redis in production — see ARCHITECTURE §7).
- English only; the classifier is a linear model trained on synthetic data, so unusual phrasings can still be misread (every miss on the test set is listed by `npm run eval`).
- OTPs are displayed on screen because there is no SMS gateway.
