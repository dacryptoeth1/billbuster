# BillBuster

**Find the errors hiding in your medical bill.** Upload a bill or EOB, and BillBuster flags likely billing errors, explains every charge in plain English, and drafts a dispute letter for you.

Built at TigerHacks 2026 (health track).

![Results page](docs/screenshots/results.png)

## The problem

Medical billing errors are common, and most patients have no practical way to catch them. Bills are full of codes and jargon, and disputing a charge means knowing what to ask for. Many people simply pay, or let the bill go to collections.

BillBuster gives anyone a second pair of eyes: in under a minute, you know which charges look wrong, roughly how much is at stake, and you have a letter ready to send.

## Features

- **Upload any bill**: drag and drop a PDF or photo, with a live preview.
- **AI extraction**: Gemini reads the bill into structured JSON (provider, line items, totals), validated with zod and retried once on bad output.
- **Deterministic error checks**: flagging is plain TypeScript, not the LLM, so the same bill always gets the same result. It checks for:
  - duplicate codes on the same date of service
  - unusual quantities (for example, 10 ER visits in one day)
  - prices far above an estimated typical range for about 30 common CPT codes
  - math errors (line items that don't add up to the total, or an amount owed that doesn't match)
- **Plain-English explanations**: one sentence per charge, at an 8th-grade reading level.
- **Dispute letter**: a polite, firm letter citing each flagged item, with an optional financial-assistance request. You can edit, copy, or download it as `.txt`.
- **Demo-proof samples**: three fictional bills. If the AI call fails, the samples fall back to known-good data so a live demo never dead-ends.
- **Private by design**: uploads are processed in memory and never stored. The current bill lives only in your browser tab's `sessionStorage`.

## How it works

```
Upload (PDF/image)
   │
   ▼
/api/extract ── Gemini (structured JSON) ── zod validation, 1 retry
   │
   ▼
lib/flags (pure TypeScript rules) ──► questionable total
   │
   ├──► /api/explain ── Gemini: 1 sentence per line item
   └──► /api/letter  ── re-runs the rules server-side, then Gemini drafts the letter
                        (falls back to a template letter if Gemini is unavailable)
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Google Gemini API via `@google/genai` (default model `gemini-3.8-flash`)
- zod for schema validation, Vitest for unit tests

## Project structure

```
app/
  page.tsx                upload page
  results/page.tsx        results page
  api/extract|explain|letter/route.ts
components/
  upload/                 Dropzone, FilePreview, SamplePicker, UploadFlow
  results/                SummaryCard, LineItemTable, FlagReasons, LetterPanel, ...
lib/
  flags/                  one file per rule + index.ts (analyzeBill)
  schema.ts               zod schemas and shared types
  gemini.ts               Gemini client with JSON validation and retry
  letter.ts               letter prompt + template fallback
  samples.ts              the three fictional sample bills
data/typical-prices.json  estimated price ranges (rough estimates, not a source of truth)
scripts/render-samples.ts renders sample bills to PNG
tests/flags.test.ts       rules engine tests
```

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local     # then add your GEMINI_API_KEY
npm run dev                    # http://localhost:3000
```

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey). To use a different model, set `GEMINI_MODEL` in `.env.local`.

### Other commands

| Command           | What it does                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm test`        | Run the flagging engine unit tests                                                                                 |
| `npm run lint`    | ESLint                                                                                                             |
| `npm run format`  | Prettier                                                                                                           |
| `npm run build`   | Production build                                                                                                   |
| `npm run samples` | Re-render `public/samples/*.png` from `lib/samples.ts` (needs Chrome or Edge; set `CHROME_PATH` if it isn't found) |

## Sample bills

All sample data is fictional. Each bill demonstrates one rule:

| Sample   | Error                              | Questionable |
| -------- | ---------------------------------- | ------------ |
| ER visit | IV push (96374) billed twice       | $295         |
| Lab work | Lipid panel at $385 vs. ~$30–$120  | $265         |
| Imaging  | Total is $300 more than line items | $300         |

## Screenshots

| Home                                    | Results (mobile)                                       |
| --------------------------------------- | ------------------------------------------------------ |
| ![Home page](docs/screenshots/home.png) | ![Mobile results](docs/screenshots/results-mobile.png) |

<!-- TODO: add a screenshot of a generated dispute letter -->

## Limitations

- Typical price ranges are rough estimates for demonstration. Real prices vary widely by region, facility, and insurer.
- A flag means "worth asking about", not "definitely wrong". Some repeated codes are legitimate.
- Extraction quality depends on the photo or scan.

## Disclaimer

Not legal, medical, or financial advice. Verify with your provider or insurer.
