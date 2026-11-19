# Routiva Pulse: n8n Production Orchestration Pipelines

Routiva Pulse uses **n8n** as an agentic automation backend, orchestrating data ingestion, deterministic mathematical scoring, LLM reasoning with strict fact-checking, and bidirectional Meta WhatsApp Cloud API communication.

---

## 1. Pipeline Overview

```
                      [ WhatsApp Inbound / UI Trigger ]
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │   Webhook Router (Path Decision)         │
                └────────────────────┬─────────────────────┘
                                     │
          ┌──────────────────────────┴──────────────────────────┐
          ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────────┐
│ Path A: 29-Node AI Scan       │             │ Path B: 1-Tap Coach Decision      │
│ (/scan or UI Trigger)         │             │ (a|<customer>, s|<customer>)      │
├───────────────────────────────┤             ├───────────────────────────────────┤
│ 1. Fetch Biometric Check-ins  │             │ 1. Parse Callback Query           │
│ 2. Dedupe & Dice Bigram Clean │             │ 2. Upsert public.pulse_decisions  │
│ 3. Median & MAD Scoring       │             │ 3. Update public.pulse_watchlist  │
│ 4. 365d Seasonal Guard        │             │ 4. Dispatch WhatsApp to Member    │
│ 5. Gemini 2.5 Flash Draft Gen │             │ 5. Send Status Receipt to Coach   │
│ 6. Regex Fact Verification    │             └───────────────────────────────────┘
│ 7. Save via Supabase RPC      │
│ 8. Send WhatsApp Monday Brief │
│ 9. Gmail Digest Notification  │
└───────────────────────────────┘
```

---

## 2. Workflows Explained

### Workflow 1: `routiva-pulse-whatsapp` (29 Nodes)
* **Trigger Endpoint:** `POST /webhook/routiva-pulse-whatsapp`
* **Trigger Sources:**
  - Gym Owner WhatsApp chat commands (`/scan`)
  - Retention Desk UI button ("Run AI Scan Now")
  - UI 1-tap member approval ("Approve & Send via n8n")
  - Interactive WhatsApp Quick-Reply buttons (`a|<id>`, `s|<id>`, `m|<id>`)

#### Step-by-Step Node Execution:
1. **Webhook Listener:** Ingests JSON payload from WhatsApp Webhooks or UI `fetch`.
2. **Signature & Owner Gate:** Verifies payload integrity and matches sender against `pulse_rules.owner_chat_id`.
3. **Route Decision (Switch):** Splits execution between `/scan` AI batch runs and action callbacks.
4. **Attendance Query:** Fetches recent raw check-ins from `public.pulse_attendance_logs`.
5. **Data Cleaning & Deduplication:** Removes turnstile double-swipes (<120 min gap) and refunded entries.
6. **Dice Bigram Matcher:** Groups subtle name variations while strictly preserving 10-digit phone number isolation.
7. **Rhythm Math Calculator (JavaScript Node):**
   - Calculates consecutive gap intervals per member.
   - Computes **Median Interval** (`usual_gap`).
   - Computes **Median Absolute Deviation** (`MAD steadiness`).
   - Evaluates:
     $$\text{lateness\_ratio} = \frac{\text{days\_silent}}{\text{usual\_gap} \times (1 + 0.5 \times \min(\text{steadiness}, 1))}$$
8. **365-Day Seasonal Guard:** Cross-references last year's calendar window to suppress churn alerts for members on predictable annual exam/festival breaks.
9. **30-Day Snooze Guard:** Filters members snoozed within `pulse_rules.snooze_days`.
10. **LLM Prompt Synthesizer:** Compiles cohort metrics and tone guidelines from `pulse_tone`.
11. **OpenRouter AI Agent (`gemini-2.5-flash`):** Generates concise, empathetic Hinglish check-in messages ($\le 280$ characters) tailored to each member's training history.
12. **Regex Fact Guard (Zero-Hallucination Node):**
    - Scans every digit/number in the LLM output.
    - Matches them against verified database fields (`days_silent`, `usual_gap`, `at_risk_rs`).
    - If an unverified number is discovered, strips the LLM draft and replaces it with a deterministic template fallback.
13. **Supabase RPC Dispatcher:** Persists updated members and scan log via `public.save_pulse_run_results(payload)`.
14. **Monday Brief Generator:** Assembles 5-line executive retention summary.
15. **Meta WhatsApp Cloud API Sender:** Delivers interactive WhatsApp message with inline approval buttons to gym owner.
16. **Gmail SMTP Node:** Sends secondary retention audit digest to management email.

---

### Workflow 2: `routiva-pulse-dashboard` (4 Nodes)
* **Trigger Endpoint:** `POST /webhook/routiva-pulse-dashboard`
* **Purpose:** Lightweight proxy bridge between third-party dashboard extensions and the Supabase database.
1. **Webhook Trigger:** Receives status check query.
2. **API Key Guard:** Validates request header against authorized studio tokens.
3. **Supabase RPC Call:** Executes `public.get_pulse_desk_data()` to collect watchlist, metrics, rules, and logs.
4. **Respond to Webhook:** Returns compressed JSON payload with `200 OK`.

---

## 3. Environment Variables & Credentials Required in n8n

| Variable / Credential | Placeholder | Purpose |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://oqttljgjwyzoqsxqwoap.supabase.co` | Supabase project API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `YOUR_SUPABASE_SERVICE_ROLE_KEY` | Database access for RPCs |
| `OPENROUTER_API_KEY` | `YOUR_OPENROUTER_API_KEY` | Model access for `gemini-2.5-flash` |
| `WHATSAPP_CLOUD_API_TOKEN` | `YOUR_WHATSAPP_TOKEN` | Meta WhatsApp Cloud API Bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | `YOUR_WHATSAPP_PHONE_ID` | Meta Business Phone ID |
| `GMAIL_SMTP_CREDENTIALS` | `YOUR_GMAIL_APP_PASSWORD` | Fallback notification delivery |

---

## 4. How to Import into Your n8n Instance

1. In your n8n workspace, navigate to **Workflows** > **Add Workflow**.
2. Click the three dots `...` in the top right corner and choose **Import from File / URL**.
3. Configure credentials:
   - Create a **Header Auth** or **Supabase** credential using your Service Role key.
   - Create an **OpenRouter** / OpenAI credential using your OpenRouter key.
   - Create a **WhatsApp Cloud API** credential with your Meta Developer access token.
4. Set Webhook path to `routiva-pulse-whatsapp` and activate the workflow.
