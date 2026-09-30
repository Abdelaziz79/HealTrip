# HealTrip AI Patient Decision Assistant — Backend

A production-ready backend for an AI-powered medical triage system that helps patients understand their symptoms, determines urgency, and recommends appropriate medical professionals from a typed medical dataset.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React / Next.js)                 │
│                    REST + SSE Streaming                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Express API (TypeScript)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐    │
│  │  Helmet  │  │  CORS    │  │ Rate Limit│  │  Validation  │    │
│  └──────────┘  └──────────┘  └───────────┘  │  (Zod)       │    │
│                                             └──────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    AI Agent Service                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │   │
│  │  │ Gemini Pool  │  │ Tool Router  │  │ System Prompt │   │   │
│  │  │ (Multi-key   │  │              │  │ (Bilingual)   │   │   │
│  │  │  Multi-model │  │ search_docs  │  └───────────────┘   │   │
│  │  │  Failover)   │  │ search_hosp  │                      │   │
│  │  └──────────────┘  │ get_specs    │                      │   │
│  │                    │ assess_urg   │                      │   │
│  │                    └──────┬───────┘                      │   │
│  └───────────────────────────┼──────────────────────────────┘   │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │       In-Memory Typed Data Store (TypeScript Datasets)   │   │
│  │  doctors.data │ hospitals.data │ specialties.data        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           In-Memory Session Store (TTL-based)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Decisions

### 1. Pure TypeScript Data Store (Zero-Dependency & Cloud-Ready)
Instead of relying on SQLite or native C++ binaries (`better-sqlite3`), the data layer is powered by strongly-typed TypeScript datasets:
- **Zero native build dependencies** — no `node-gyp`, Python, or OS-dependent compilation issues.
- **100% uploadable and cloud-ready** — effortlessly deployable to Vercel, Render, Railway, AWS Lambda, or Docker containers.
- **Type-safe data access** — in-memory indexing and filtering with TypeScript validation.
- **Instant startup** — zero disk I/O bottlenecks or database locking.

### 2. AI Grounding via Function Calling
The AI agent uses Gemini's native **function calling** (tool use) instead of free-text generation for data retrieval. This means:
- The AI **cannot fabricate** doctors or hospitals — it can only surface what exists in the database.
- Every recommendation is traceable to an actual data query.
- The system prompt strictly forbids hallucination.

### 3. Multi-Key, Multi-Model Failover (with Gemini 3.1 Pro)
```
GEMINI_API_KEYS=key1,key2,key3
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-pro,gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-pro,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.0-flash-lite
```
- **Round-robin** across API keys for load distribution.
- On failure (429/500/503), the key enters an **exponential cooldown**.
- If all keys fail for a model → **cascade to the next model in priority order** (including **Gemini 3.1 Pro** for advanced clinical reasoning).
- Health tracking with monitoring endpoint at `/api/v1/chat/ai-health`.

### 4. Urgency Classification
A rule-based heuristic classifies patient symptoms into:
- **Emergency**: Life-threatening (chest pain + severity, stroke signs) → Advise ER
- **Urgent**: Needs attention in 24-48h (high fever, fractures, severe pain)
- **Routine**: Schedulable appointment (chronic conditions, check-ups)
- **Self-care**: Manageable at home (mild cold, minor bruise)

### 5. Bilingual Support (Arabic/English)
- The AI auto-detects the user's language from the request.
- All records include Arabic translations (`name_ar`, `bio_ar`, `specialty_name_ar`).
- System prompt adapts response language accordingly.

### 6. Session Management
- Each conversation gets a UUID-based session.
- Multi-turn context preserved for the AI agent.
- Sessions auto-expire after 1 hour of inactivity.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| TypeScript + Express | API framework |
| Google Gemini AI (Flash & Pro 3.1) | LLM with function calling |
| Pure TypeScript Data Store | In-memory typed datasets (no SQLite binaries) |
| Zod | Request validation |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy the env example and add your Gemini API key(s):

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Single key
GEMINI_API_KEYS=your_api_key

# Or multiple keys for failover
GEMINI_API_KEYS=key1,key2,key3

# Models in priority order (includes Gemini 3.1 Pro)
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-pro,gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-pro,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.0-flash-lite
```

### Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Chat (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat` | Send message to AI agent |
| `POST` | `/api/v1/chat/stream` | Send message with SSE streaming |
| `GET` | `/api/v1/chat/ai-health` | AI pool health status |
| `GET` | `/api/v1/chat/sessions/:id` | Get session history |
| `DELETE` | `/api/v1/chat/sessions/:id` | Delete session |

### Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/doctors` | Search doctors |
| `GET` | `/api/v1/doctors/:id` | Get doctor by ID |
| `GET` | `/api/v1/hospitals` | Search hospitals |
| `GET` | `/api/v1/hospitals/:id` | Get hospital by ID |
| `GET` | `/api/v1/specialties` | List all specialties |

### Query Parameters (Doctors)
- `specialty` — Filter by specialty name
- `city` — Filter by city
- `country` — Filter by country
- `language` — Filter by doctor's language
- `minRating` — Minimum rating (0-5)
- `maxFee` — Maximum consultation fee
- `limit` — Max results

### Chat Request Body
```json
{
  "message": "I have chest pain and I'm not sure what to do",
  "sessionId": "optional-uuid",
  "language": "en"
}
```

### Chat Response
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "message": "AI response with recommendations...",
    "toolsUsed": [
      {
        "toolName": "assess_urgency",
        "args": { "symptoms": "chest pain" },
        "result": { "level": "urgent", "reasoning": "..." }
      },
      {
        "toolName": "search_doctors",
        "args": { "specialty": "Cardiology" },
        "result": { "found": 3, "doctors": [...] }
      }
    ],
    "urgencyLevel": "urgent"
  }
}
```

## Project Structure

```
src/
├── config/
│   └── env.ts                 # Environment variables
├── controllers/
│   ├── chat.controller.ts     # AI chat endpoints
│   ├── doctor.controller.ts   # Doctor REST endpoints
│   ├── hospital.controller.ts # Hospital REST endpoints
│   ├── session.controller.ts  # Session management
│   └── health.controller.ts   # Health check
├── services/
│   ├── ai/
│   │   ├── gemini-pool.ts     # Multi-key/model failover client (with 3.1 Pro)
│   │   ├── agent.ts           # AI agent orchestrator
│   │   ├── tools.ts           # Gemini function declarations
│   │   ├── tool-executor.ts   # Tool execution bridge
│   │   └── system-prompt.ts   # Bilingual system prompt
│   ├── doctor.service.ts      # Doctor data access (TypeScript in-memory)
│   ├── hospital.service.ts    # Hospital data access (TypeScript in-memory)
│   └── session.service.ts     # In-memory session store
├── middlewares/
│   ├── errorHandler.ts        # Global error handler
│   └── rateLimiter.ts         # API + chat rate limiters
├── routes/                    # Route definitions
├── types/index.ts             # Shared TypeScript types
├── utils/
│   ├── logger.ts              # Structured colored logger
│   └── apiResponse.ts         # Standardized API responses
├── data/                      # Pure TypeScript datasets
│   ├── doctors.data.ts        # 16 doctors
│   ├── hospitals.data.ts      # 6 hospitals
│   ├── specialties.data.ts    # 15 specialties
│   └── index.ts               # Dataset exports
├── app.ts                     # Express app setup
└── server.ts                  # Server entry with graceful shutdown
```

## Dataset Overview

- **15 specialties** (Cardiology, Neurology, Oncology, Orthopedics, etc.)
- **6 hospitals** across Turkey, Saudi Arabia, UAE, and Thailand
- **16 doctors** with full bilingual profiles, ratings, availability, and fees

## Security Measures

- **Helmet** — Security HTTP headers
- **CORS** — Origin-restricted
- **Rate Limiting** — 30 req/min general, 10 req/min for AI chat
- **Input Validation** — Zod schemas on all endpoints
- **AI Grounding** — Function calling prevents hallucination
- **Graceful Shutdown** — Clean session cleanup on SIGTERM/SIGINT
