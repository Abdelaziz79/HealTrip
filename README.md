# HealTrip — AI Patient Decision Assistant (Technical Prototype)

A full-stack, clinical-grade technical prototype for **HealTrip**, engineered to demonstrate an intelligent **AI Patient Decision Assistant** that triages patient symptoms, evaluates clinical urgency, asks targeted clarifying questions, and connects patients with accredited medical specialists and hospitals with **zero hallucinations**.

An intelligent medical triage and clinical decision support system designed to guide patients through symptoms, evaluate urgency, and connect them with verified healthcare specialists.

---

## 📋 Core Capabilities & Requirements

| Capability / Requirement | Implementation in HealTrip | Location in Codebase |
| :--- | :--- | :--- |
| **1. Chat UI (React / Next.js)** | Next.js 16 (App Router), React 19, Tailwind CSS v4, word-by-word ChatGPT-style streaming, full responsive design | `frontend/src/` |
| **2. Backend (Node.js / Express)** | Express.js with TypeScript, modular router/controller/service architecture, Helmet, CORS, Rate Limiting | `backend/src/` |
| **3. AI Agent (Triage & Reasoning)** | ReAct agent loop, intent comprehension, clarifying questions, heuristic urgency assessment (`assess_urgency`) | `backend/src/services/ai/agent.ts` |
| **4. Tool / Function Calling** | Native Gemini Tool Calling (`search_doctors`, `search_hospitals`, `get_specialties`, `assess_urgency`) | `backend/src/services/ai/tools.ts` |
| **5. Mock Database (Doctors & Hospitals)** | Strongly-typed pure TypeScript data store: **62 doctors**, **20 hospitals**, **15 specialties** (deep focus on Saudi Arabia) | `backend/src/data/` |
| **6. Clear Architecture & Data Flow** | Documented end-to-end data lifecycle, ASCII diagrams, typed database schemas, and API contracts | Root `README.md` & `backend/README.md` |
| **7. Bilingual Arabic / English** | Native RTL/LTR bidirectional toggle, Google Fonts (`Cairo` for Arabic, `Inter` for Latin), bilingual medical records | `frontend/src/lib/translations.ts` |
| **8. Anti-Hallucination Grounding** | Strict tool enforcement; AI cannot recommend any provider not returned by database queries | `backend/src/services/ai/tool-executor.ts` |
| **9. Security & Error Handling** | Zod input validation, rate limiting, multi-key failover pool (12 models including **Gemini 3.1 Pro**), safe error envelopes | `backend/src/config/` & `middlewares/` |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 16 + React 19)                          │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │   Header (Brand Identity · Live Health Badge · Language Toggle: EN / عربي)     │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                              ChatView Component                                │   │
│   │   • Word-by-Word Streaming Typewriter (42ms adaptive pacing + blinking cursor) │   │
│   │   • Interactive Stop Generating Button (Square icon)                           │   │
│   │   • Hydration-Safe Markdown Renderer (react-markdown + remark-gfm)             │   │
│   │   • Embedded Rich Cards: DoctorCard & HospitalCard (Auto-fade upon completion) │   │
│   │   • Transparent ToolCallsInspector (Auditable function calls & payloads)       │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST / JSON (Fetch Client)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js + Express + TypeScript)                  │
│                                                                                        │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌───────────────────┐   │
│   │ Helmet (CSP) │   │ CORS Guards  │   │ Rate Limiters    │   │ Zod Validation    │   │
│   └──────────────┘   └──────────────┘   └──────────────────┘   └───────────────────┘   │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                                AI Agent Service                                │   │
│   │   • Language Detection (Unicode Arabic Regex & Explicit Preferences)           │   │
│   │   • Multi-Turn Session Memory (UUID-based with TTL)                            │   │
│   │   • System Prompt Injector (Bilingual Clinical Guidance & Strict Safety Guard) │   │
│   │   • Thought & Reasoning Sanitizer (Prevents internal chain-of-thought leaks)   │   │
│   │   • Gemini Pool (Multi-Key Rotation + 12-Model Failover including 3.1 Pro)     │   │
│   └───────────────────────────────────────┬────────────────────────────────────────┘   │
│                                           │                                            │
│                 ┌─────────────────────────┴─────────────────────────┐                  │
│                 │ Native Tool Calling Loop (Max 5 Iterations)       │                  │
│                 │                                                   │                  │
│                 │   [assess_urgency]   [search_doctors]             │                  │
│                 │   [get_specialties]  [search_hospitals]           │                  │
│                 └─────────────────────────┬─────────────────────────┘                  │
│                                           │                                            │
│   ┌───────────────────────────────────────▼────────────────────────────────────────┐   │
│   │                      Pure TypeScript In-Memory Data Store                      │   │
│   │   • locationMap.ts: Normalization for Riyadh, Jeddah, Khobar, Dammam, etc.     │   │
│   │   • doctors.data.ts: 62 verified specialist profiles across 15 specialties     │   │
│   │   • hospitals.data.ts: 20 accredited hospitals (14 in Saudi Arabia)            │   │
│   │   • specialties.data.ts: 15 bilingual medical specialties                      │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Agent Design & Engineering Mindset

### 1. The ReAct Agent Loop
When a patient sends a message (e.g., *"I have acute chest pain and I don't know whether to visit an emergency room or a cardiologist"*), the agent executes the following cycle:
1. **Language Detection & Context Ingestion**: Detects if the prompt contains Arabic script (`/[\u0600-\u06FF]/`), assigns language context, and pulls conversation history from the session cache.
2. **Clinical Safety & Intent Assessment**: Injects a specialized bilingual system prompt instructing the agent to act as a **clinical decision aid** (not a final diagnostic authority).
3. **Tool Invocation**: If symptoms are critical, the agent invokes `assess_urgency`. If a medical specialty, city, or doctor is required, it invokes `search_doctors` or `search_hospitals`.
4. **Tool Result Feedback**: The tool output is appended as a `functionResponse` part in the conversation thread and re-submitted to Gemini.
5. **Synthesis & Grounding**: The LLM synthesizes a compassionate, clear response referencing the grounded records returned by the tools.
6. **Thought Sanitization**: Any internal chain-of-thought leaked by reasoning models is stripped via regex before sending to the client, ensuring clean, human-ready clinical communication.

### 2. Heuristic Urgency Classification (`assess_urgency`)
The agent incorporates heuristic clinical urgency rules:
- **Emergency (`emergency`)**: Life-threatening symptoms (acute crushing chest pain radiating to arm/jaw, sudden slurred speech, acute breathlessness, high-trauma injury). The assistant triggers immediate **Red Emergency Guidance**, highlights emergency dispatch numbers (997 in Saudi Arabia, 911/112 globally), and filters for hospitals with **24/7 Emergency Units**.
- **Urgent (`urgent`)**: Severe pain, high fever (>39°C), suspected fractures requiring clinical evaluation within 24–48 hours.
- **Routine (`routine`)**: Chronic check-ups, non-urgent specialist consultations (e.g. dermatological review, elective joint replacement consultation).
- **Self-Care (`self_care`)**: Minor, self-limiting symptoms (mild cold, minor muscular stiffness).

---

## 🛡️ Anti-Hallucination Architecture (How Data Grounding is Guaranteed)

In healthcare technology, LLM hallucinations (inventing fictitious doctors, nonexistent clinics, or wrong fees) are hazardous. HealTrip solves this through **Deterministic Data Grounding**:

1. **Strict Negative Constraints**: The system prompt explicitly commands:
   > *"DO NOT invent, fabricate, or hallucinate doctors, hospitals, contact details, or fees. You may ONLY mention doctors and hospitals that were explicitly returned by search_doctors or search_hospitals."*
2. **Schema-Constrained Function Calling**: The model is provided with strict JSON schemas for tools (`search_doctors`, `search_hospitals`, `get_specialties`, `assess_urgency`). The model cannot output free-form assumptions when searching for care.
3. **Bilingual Location & Specialty Normalization (`backend/src/utils/locationMap.ts`)**:
   - Arabic user queries like `"ابحث عن طبيب مسالك بالرياض"` produce tool calls with `city: "الرياض"` and `specialty: "مسالك"`.
   - The normalization engine maps Arabic city names to standardized database keys (`الرياض` ➔ `riyadh`, `جدة` ➔ `jeddah`, `الخبر` ➔ `al khobar`, `الدمام` ➔ `dammam`).
   - Word boundary and alias matching distinguish close terms (e.g. preventing `Urology` from matching `Neurology`).
4. **Transparent Audit Inspector (`frontend/src/components/ToolCallsInspector.tsx`)**:
   - In the frontend chat UI, every assistant message includes an expandable **"Tool Execution Audit"** accordion.
   - Evaluators can inspect the exact tool invoked, the arguments passed by the AI, and the verified database records returned.

---

## 🔄 End-to-End Data Flow

```
[Patient Prompt]
       │
       ▼
1. Next.js Client: Dispatches POST /api/v1/chat with message, sessionId, language
       │
       ▼
2. Express Middleware: Helmet headers applied -> CORS verified -> Rate limiter checked -> Zod schema validated
       │
       ▼
3. Session Layer: In-memory session store loads conversation history
       │
       ▼
4. Gemini AI Pool: Selects available API key & model (rotates through pool with cooldown on failure)
       │
       ▼
5. Tool Execution Engine: Gemini invokes search_doctors(specialty, city)
       │
       ▼
6. In-Memory Store: Searches typed doctor array with location & specialty normalizer
       │
       ▼
7. Tool Output: Returns verified doctor JSON array back to Gemini
       │
       ▼
8. Response Sanitization: AI formats response, strips thought leaks, attaches toolsUsed
       │
       ▼
9. Frontend Streaming Engine: ChatView receives payload -> streams text word-by-word (42ms)
       │
       ▼
10. UI Card Rendering: DoctorCard & HospitalCard smoothly fade in below the message
```

---

## 💾 Database Architecture & Data Store

### Why Pure TypeScript Datasets instead of SQLite C++ Binaries?
During initial analysis, the project migrated from SQLite (`better-sqlite3`) to strongly-typed **in-memory TypeScript datasets**:
- **Zero Native Build Dependencies**: Eliminates `node-gyp`, Python, and OS-dependent C++ compilation failures across Windows, macOS, and Linux.
- **100% Cloud-Ready & Portable**: Effortlessly deploys to serverless or container platforms (Vercel, Render, Railway, AWS Lambda, Docker) without native binary mismatches.
- **Type-Safe In-Memory Indexing**: Guaranteed compile-time validation across all fields.
- **Instant Cold Starts**: Zero disk I/O bottlenecks or database locking.

### Schemas

#### 1. Doctors Schema (`Doctor`)
```typescript
interface Doctor {
  id: number;
  name: string;               // e.g. "Dr. Saad Al-Shehri"
  name_ar: string;            // e.g. "د. سعد الشهري"
  specialty_id: number;       // Foreign key -> Specialty
  hospital_id: number;        // Foreign key -> Hospital
  experience_years: number;   // e.g. 19
  rating: number;             // e.g. 4.9
  languages: string[];        // e.g. ["Arabic", "English"]
  availability: {
    days: string[];           // e.g. ["Sun", "Mon", "Tue", "Wed", "Thu"]
    hours: string;            // e.g. "09:00-16:00"
  };
  consultation_fee: number;   // e.g. 300 (USD / SAR)
  bio: string;                // Clinical credentials & focus
  bio_ar: string;             // Arabic clinical bio
}
```

#### 2. Hospitals Schema (`HospitalRecord`)
```typescript
interface HospitalRecord {
  id: number;
  name: string;               // e.g. "Dr. Sulaiman Al-Habib Hospital - Olaya"
  name_ar: string;            // e.g. "مستشفى الدكتور سليمان الحبيب - العليا"
  city: string;               // e.g. "Riyadh"
  country: string;            // e.g. "Saudi Arabia"
  address: string;            // Physical street address
  rating: number;             // e.g. 4.9
  phone: string;              // Direct phone contact
  emergency_available: number;// 1 (24/7 ER) or 0
  website: string;            // Official URL
  description: string;        // Accreditation & specialized departments
  description_ar: string;     // Arabic facility overview
  specialtyIds: number[];     // Supported specialty IDs
}
```

#### 3. Specialties Schema (`Specialty`)
Includes 15 foundational medical specialties:
Cardiology (1), Orthopedics (2), Neurology (3), Dermatology (4), Ophthalmology (5), Gastroenterology (6), Pulmonology (7), Endocrinology (8), Urology (9), General Surgery (10), Psychiatry (11), Emergency Medicine (12), Oncology (13), Pediatrics (14), ENT (15).

#### 4. Saudi Arabia Healthcare Dataset Overview
The dataset contains **62 specialist doctors** and **20 accredited hospitals**, featuring premier healthcare facilities in the Kingdom of Saudi Arabia:
- **Riyadh**: King Faisal Specialist Hospital (KFSHRC), King Abdulaziz Medical City (NGHA), King Fahad Medical City, Dr. Sulaiman Al-Habib Hospital (Olaya & Al-Rayyan), Dallah Hospital, Saudi German Hospital Riyadh.
- **Jeddah**: International Medical Center (IMC / Mayo Clinic network), Saudi German Hospital Jeddah, Magrabi Eye & Ear Hospital, Dr. Erfan & Bagedo General Hospital.
- **Eastern Province (Dammam, Khobar, Dhahran)**: Johns Hopkins Aramco Healthcare (JHAH), Mouwasat Hospital Dammam, Mouwasat Hospital Khobar, ProCare Riaya Hospital.

---

## 🔒 Security & Production Best Practices

- **Input Validation**: Strict Zod schema parsing on all endpoints (`chatSchema`), enforcing string length limits and allowed language enums.
- **HTTP Security Headers**: Configured with `Helmet` (Content Security Policy, XSS filter, clickjacking protection).
- **CORS Protection**: Restricted to authorized frontend origins.
- **Two-Tier Rate Limiting**:
  - Global API Limiter: 30 requests per minute per IP.
  - Chat Agent Limiter: 10 requests per minute per IP (prevents API quota exhaustion and denial-of-wallet).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` signals to flush connections and persist session cleanup.

---

## ⚡ Error Handling & Multi-Model Resilience

### Multi-Key & Multi-Model Failover Architecture
The backend is powered by a high-availability client pool (`gemini-pool.ts`):
```env
GEMINI_API_KEYS=key_1,key_2,key_3
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-pro,gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-pro,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.0-flash-lite
```
- **Round-Robin Rotation**: Distributes requests evenly across API keys.
- **Exponential Cooldown**: If a key encounters rate limits (`429`) or server errors (`500/503`), it enters cooldown (10s, doubling up to 5m).
- **Model Cascade**: If all keys fail for a model, the system automatically falls back to the next model in the cascade (including **Gemini 3.1 Pro** for advanced clinical reasoning).
- **Live Health Diagnostics**: The `/api/v1/chat/ai-health` endpoint provides real-time visibility into active keys, cooldown timers, and model availability.

---

## 🎨 Frontend UX & Modern Aesthetics

1. **ChatGPT-Style Word-by-Word Streaming**:
   - Progressive typewriter rendering with an adaptive delay (~42ms per word).
   - Natural punctuation pauses at sentence boundaries (`.`, `?`, `!`, `:`) for a calm, deliberate reading pace.
   - Animated blinking cursor (`▋`) rendered via CSS pseudo-element without DOM hydration mismatches.
   - Interactive **Stop Generating** square button to instantly complete output on demand.
2. **Medical Light Mode Aesthetics**:
   - Professional, minimalist, clean palette (white and slate-50 background, subtle borders, high contrast).
   - Designed to reduce patient anxiety and improve readability.
3. **Typography & Bidirectionality**:
   - English: Google Font **Inter** (`--font-inter`).
   - Arabic: Google Font **Cairo** (`--font-cairo`), optimized for medical text legibility.
   - Instant 1-click toggle between English (`LTR`) and Arabic (`RTL`).
4. **Mobile Responsiveness**:
   - Fully responsive on mobile, tablet, and desktop (down to 320px screens).
   - Dynamic viewport height (`100dvh`) preventing mobile Safari/Chrome address-bar overlap.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (Node 20+ recommended)
- **npm** (comes with Node)
- **Google Gemini API Key** ([Get free key here](https://aistudio.google.com/apikey))

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Edit `backend/.env` and paste your Gemini API key:
```env
GEMINI_API_KEYS=AIzaSy...your_actual_key_here
PORT=5001
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```
Backend will start on `http://localhost:5001`.

### 2. Frontend Setup

In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📡 API Reference & Verification

### Test Health Endpoint
```bash
curl -s http://localhost:5001/api/v1/health
```

### Test AI Pool Health
```bash
curl -s http://localhost:5001/api/v1/chat/ai-health
```

### Test Doctor Search (e.g. Urology in Riyadh)
```bash
curl -s "http://localhost:5001/api/v1/doctors?city=Riyadh&specialty=Urology"
```

### Test Live AI Triage Chat
```bash
curl -s -X POST http://localhost:5001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have sudden severe lower back pain and urinary symptoms in Riyadh", "language": "en"}'
```

### Test Live Arabic Triage Chat
```bash
curl -s -X POST http://localhost:5001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "ابحث لي عن استشاري مسالك بولية في الرياض", "language": "ar"}'
```

---

## 📂 Project File Structure

```
HealTrip/
├── README.md                         # Main comprehensive documentation
│
├── backend/                          # Express + TypeScript API Service
│   ├── src/
│   │   ├── config/                   # Environment variables & model pool configs
│   │   ├── controllers/              # chat, doctor, hospital, session, health controllers
│   │   ├── data/                     # Pure TypeScript datasets (doctors, hospitals, specialties)
│   │   │   ├── doctors.data.ts       # 62 verified specialist doctors
│   │   │   ├── hospitals.data.ts     # 20 accredited hospitals
│   │   │   └── specialties.data.ts   # 15 medical specialties
│   │   ├── middlewares/              # errorHandler, rateLimiter, Zod validation
│   │   ├── routes/                   # REST routing definitions
│   │   ├── services/
│   │   │   ├── ai/                   # AI Agent, GeminiPool, tool definitions & executor
│   │   │   ├── doctor.service.ts     # Doctor queries & specialty filters
│   │   │   ├── hospital.service.ts   # Hospital queries & ER filters
│   │   │   └── session.service.ts    # In-memory TTL session store
│   │   ├── utils/                    # locationMap normalizer, logger, apiResponse
│   │   ├── types/index.ts            # Core TypeScript interfaces
│   │   ├── app.ts                    # Express application setup
│   │   └── server.ts                 # Server entry with graceful shutdown
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                         # Next.js 16 (App Router) + React 19
    ├── src/
    │   ├── app/
    │   │   ├── globals.css           # Tailwind v4 setup & streaming cursor animation
    │   │   ├── layout.tsx            # Root layout with Cairo & Inter fonts
    │   │   └── page.tsx              # Single-page chat shell with 100dvh responsiveness
    │   ├── components/
    │   │   ├── ChatView.tsx          # Word-by-word streaming chat & triage view
    │   │   ├── Header.tsx            # Responsive navigation & bilingual toggle
    │   │   ├── DoctorCard.tsx        # Doctor card with rating, fee & schedule
    │   │   ├── HospitalCard.tsx      # Hospital card with ER indicator & phone
    │   │   ├── ToolCallsInspector.tsx# Collapsible audit inspector for function calls
    │   │   └── ui/                   # Reusable UI primitives
    │   ├── lib/
    │   │   ├── api.ts                # Strongly-typed HTTP API client
    │   │   ├── translations.ts       # Complete bilingual dictionary (EN & AR)
    │   │   └── utils.ts              # Styling helpers
    │   └── types/index.ts            # Client-side TypeScript types
    ├── package.json
    └── tsconfig.json
```

---

## ⚖️ Assumptions, Limitations & Future Roadmap

1. **Clinical Decision Support Aid**: HealTrip is designed as an intelligent triage and discovery assistant. It provides educational guidance and provider recommendations, not an official diagnostic prescription or emergency dispatch replacement.
2. **In-Memory Session Store**: In this prototype, sessions are managed in an in-memory TTL map (1-hour auto-expiration). In enterprise production, this can be seamlessly swapped for a Redis cluster.
3. **Database Scalability**: The strongly-typed data store is structured with foreign keys (`specialty_id`, `hospital_id`), allowing 1:1 drop-in replacement with a PostgreSQL / Supabase database via Prisma or Drizzle ORM when scaling beyond millions of rows.
4. **Vector Search & RAG**: Future production phases can add pgvector / Pinecone embeddings for matching complex patient symptom narratives against clinical guidelines (e.g. NICE, Mayo Clinic triage protocols).
