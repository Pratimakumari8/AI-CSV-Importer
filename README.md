# 🤖 AI CSV Importer

An AI-powered CSV importer that accepts CSV files in **any column layout** (Facebook Lead Ads, Google Ads, real estate CRM exports, manually created spreadsheets, etc.) and converts them into **GrowEasy CRM** records.

Instead of requiring fixed column names, an AI model intelligently maps arbitrary CSV columns to the GrowEasy CRM schema while applying all assignment validation rules.

---

# 🔗 Live Demo

- **Frontend (Vercel):** https://ai-csv-importer-flame.vercel.app
- **Backend API (Back4app, Dockerized):** https://groweasycsvbackend-uu1s13m3.b4a.run
- **Backend health check:** https://groweasycsvbackend-uu1s13m3.b4a.run/api/health

---

# ✅ Testing

The app was validated against a self-built suite of 20 test CSVs covering every edge case called out in the assignment, including:

- Standard CRM/Facebook/Google Ads exports
- Multiple emails and multiple phone numbers in a single row
- Rows with no email and no phone (correctly skipped)
- Messy/shuffled/extra columns, weird headers
- Blank rows, duplicate rows, missing values
- Mixed and ambiguous date formats
- International names and unicode characters
- Empty files (rejected client-side before reaching the AI)
- A full production-scale dataset (500+ rows) to validate batching, retries, and streaming progress at scale

All 20 test cases pass, including correct skip-rule enforcement (email/mobile required), correct multi-email/phone handling (first value kept, rest appended to `crm_note`), and graceful recovery when the AI misjudges a row (verified against the raw CSV row rather than trusted blindly — see **Architecture Highlights** below).

Backend unit tests (batching, JSON-recovery parsing, field sanitization, contact-info validation) also pass:

```bash
cd backend
npm test
```

---

# Features

- 📂 Upload CSV files in any format
- 👀 Client-side preview before importing
- 🤖 AI-powered field mapping (Gemini / OpenAI / Anthropic / Mock)
- ✅ Server-side validation — AI output is never trusted blindly
- 📊 Live import progress using streaming (NDJSON)
- ⚠️ Detailed skipped record reasons
- 📥 Export cleaned imported records as CSV
- 🔁 Automatic retry with exponential backoff on AI batch failures
- 🩹 Automatic recovery of rows the AI incorrectly skips or drops
- 🐳 Dockerized backend, deployed as a container
- 🌗 Dark mode, virtualized tables for large files, drag & drop upload

---

# Import Flow

### 1. Upload
Drag & drop or select a `.csv` file.

### 2. Preview
The CSV is parsed entirely in the browser and displayed as a preview table.
No data is sent to the server during this step.

### 3. Confirm
After reviewing the preview, confirm the import.

### 4. AI Extraction
The backend:

- Splits rows into batches
- Sends each batch to the configured AI provider
- Maps arbitrary columns to the GrowEasy CRM schema
- Applies assignment rules including:
  - Allowed CRM status values
  - Allowed data sources
  - Multiple phone/email handling
  - Required email/mobile validation
  - Date normalization
  - Skip rules

### 5. Results

After processing, users receive:

- Imported records
- Skipped records
- Skip reasons
- CSV download of imported records

---

# Project Structure

```text
AI-CSV-Importer/
│
├── frontend/          # Next.js application
│   ├── Upload UI
│   ├── CSV Preview
│   ├── Progress UI
│   └── Results Page
│
├── backend/           # Express API
│   ├── CSV Parsing
│   ├── AI Extraction
│   ├── Validation
│   ├── Streaming Responses
│   └── Dockerfile      # Containerized deployment
│
├── test-data/          # 20 hand-built CSV test cases covering edge cases
│
└── README.md
```

---

# Prerequisites

- Node.js 18+
- npm
- An API key for your chosen AI provider. **Gemini is free, no credit card required** — get one at https://aistudio.google.com. Anthropic and OpenAI both require billing to be set up.

Alternatively, use the built-in **Mock Provider** to test the complete pipeline without any API key.

---

# Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

Configure `.env`

```env
AI_PROVIDER=gemini

GEMINI_API_KEY=your_api_key

GEMINI_MODEL=gemini-flash-lite-latest
```

Also supported: `AI_PROVIDER=anthropic` (with `ANTHROPIC_API_KEY`) or `AI_PROVIDER=openai` (with `OPENAI_API_KEY`).

To use the mock provider (no API key needed):

```env
AI_PROVIDER=mock
```

Run the backend:

```bash
npm run dev
```

Runs on:

```
http://localhost:5000
```

Run tests:

```bash
npm test
```

---

# 🐳 Docker

The backend is fully containerized and is exactly what's running in production on Back4app.

Build the image:

```bash
cd backend
docker build -t groweasy-backend .
```

Run it locally:

```bash
docker run -p 5000:5000 --env-file .env groweasy-backend
```

Verify:

```bash
curl http://localhost:5000/api/health
```

---

# Frontend Setup

```bash
cd frontend

npm install

cp .env.local.example .env.local
```

Configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

Runs on:

```
http://localhost:3000
```

---

# API Endpoints

## Upload CSV

**POST**

```
/api/csv/upload
```

Uploads and parses a CSV without AI processing.

Example:

```bash
curl -X POST http://localhost:5000/api/csv/upload \
-F "file=@leads.csv"
```

---

## Import CSV

**POST**

```
/api/csv/import
```

Request:

```json
{
  "rows": [...],
  "fileName": "leads.csv"
}
```

Returns streamed NDJSON:

```json
{"type":"progress","processed":25,"total":100}

{"type":"progress","processed":50,"total":100}

{"type":"complete","result":{
    "imported":[...],
    "skipped":[...],
    "totalImported":48,
    "totalSkipped":2
}}
```

---

## Health Check

**GET**

```
/api/health
```

Returns server status and active AI provider.

---

# Architecture Highlights

### AI Provider Abstraction

Supports multiple AI providers through a common interface:

- Gemini (recommended — free tier, no card required)
- Anthropic
- OpenAI
- Mock Provider

Switching providers only requires changing:

```env
AI_PROVIDER=
```

No application code changes are required.

---

### Stable Row Identification

Every uploaded row receives a unique internal `_id`.

Even if the AI reorders records, responses are correctly matched back to the original rows.

---

### Server-side Validation — AI Is Never Trusted Blindly

Every mapped record is validated again for:

- Valid CRM Status (against the fixed allowed list — hallucinated values are rejected)
- Valid Data Source (same — unrecognized values are dropped, not guessed)
- Required Email or Mobile
- Date format (must survive `new Date(x)` or it's cleared)
- Assignment rules

Crucially, the AI's own **skip decisions** are also re-verified: if the AI claims a row has no email/phone but the raw row actually contains one, the row is automatically recovered (contact info extracted directly via regex) and imported instead of being lost — with a note flagging it for manual review. Invalid records that genuinely have no contact info are skipped with a clear reason.

---

### Retry with Exponential Backoff

Each AI batch is retried automatically if an API request fails.

Features:

- Configurable retry count
- Exponential backoff with jitter
- Graceful failure handling

If retries are exhausted, only that batch is skipped instead of stopping the entire import.

---

### Truncation-Safe JSON Parsing

Large batches occasionally get cut off mid-response if a model hits its output token limit. Rather than losing the entire batch, the parser recovers every complete record that was written before the cutoff and only drops the incomplete tail.

---

### Streaming Progress

Import progress is streamed using **NDJSON**.

This enables:

- Live progress bar
- Better user experience
- No long blocking requests
- Immediate feedback during large imports

---

# Tech Stack

## Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Papa Parse
- TanStack React Virtual
- Deployed on Vercel

## Backend

- Node.js
- Express.js
- Multer
- csv-parse
- Gemini API / OpenAI SDK / Anthropic SDK
- Docker
- Deployed on Back4app (Containers)

---

# Future Improvements

- Drag-and-drop multiple CSV files
- Import history
- Authentication
- Background job queue
- AI confidence scores
- Manual field correction before import
- Database persistence
- Expanded integration test coverage

---

# License

This project was developed as part of the **GrowEasy AI CSV Importer Assignment**.
