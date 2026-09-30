# HealTrip AI Patient Decision Assistant — Frontend

A modern, minimalist, and clinical-grade web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. 

The frontend serves as the interactive patient decision interface for **HealTrip**, connecting patients with an intelligent AI triage agent that asks clarifying questions, assesses clinical urgency, and surfaces accredited doctors and hospitals with zero hallucinations.

---

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router (Client)                       │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Header (Brand Identity · Live Health Badge · Language Toggle)│   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│   ┌────────────────────────────▼───────────────────────────────────┐   │
│   │                      ChatView Component                        │   │
│   │  ┌──────────────────────┐  ┌────────────────────────────────┐  │   │
│   │  │ Markdown Message Box │  │ ToolCallsInspector (Accordion) │  │   │
│   │  │ (Cairo / Inter Fonts)│  │ (search_doctors / hospitals)   │  │   │
│   │  └──────────────────────┘  └────────────────────────────────┘  │   │
│   │  ┌──────────────────────┐  ┌────────────────────────────────┐  │   │
│   │  │ DoctorCard / HospCard│  │ Quick Suggestion Prompts       │  │   │
│   │  └──────────────────────┘  └────────────────────────────────┘  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ REST / JSON (Fetch Client)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   HealTrip Express Backend API                         │
│                    (http://localhost:5001/api/v1)                      │
│                                                                        │
│   /chat · /health · /doctors · /hospitals · /chat/ai-health            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Bilingual & Bidirectional (Arabic & English RTL/LTR)
- **Native RTL/LTR Layouts**: Full bidirectional switching with a single toggle (`en` / `ar`).
- **Curated Typography**:
  - **Cairo (`--font-cairo`)**: Premium Arabic typography optimized for legibility and medical terminology.
  - **Inter (`--font-inter`)**: Modern, crisp Latin sans-serif font for English.
- **Brand Consistency**: Preserves the global brand identity ("HealTrip") consistently across both languages without improper machine translation.

### 2. Conversational Clinical Triage
- **Session Continuity**: Generates and preserves client-side UUID session tokens across multi-turn interactions.
- **Rich Markdown Support**: Formats doctor recommendations, bulleted advice, emergency steps, and schedules cleanly using `react-markdown` and `remark-gfm`.
- **Hydration Safe**: Specially structured AST component mappings preventing invalid HTML nesting (such as `<pre>` inside `<p>`).
- **Suggested Prompts**: Contextual prompt chips in English and Arabic for immediate clinical exploration (e.g. chest pain triage, urologists in Riyadh, joint injuries, hospital searches).

### 3. Transparent Tool Calling Inspector
- **AI Grounding Visualizer**: A collapsible inspector showing which backend functions the AI invoked (`search_doctors`, `search_hospitals`, `assess_urgency`, `get_specialties`).
- **Auditability**: Patients and clinicians can inspect exact search parameters and raw tool execution output.

### 4. Live Health Monitoring & Resilience
- **Status Indicator**: Continuously polls `/api/v1/health` every 15 seconds to display real-time backend and Gemini AI connection health.
- **Session Reset**: Dedicated "New Consultation" action to safely clear active sessions on both client and server.

### 5. Minimalist Light-Mode Aesthetic
- Professional, reassuring clinical light palette built with soft zinc/slate borders, high-contrast typography, and subtle micro-interactions.
- Prioritizes readability, accessibility, and reduces cognitive load for patients during stressful medical decisions.

---

## Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.3.x` | React Framework (App Router, Server & Client Components) |
| **React** | `19.2.x` | Modern UI Library |
| **TypeScript** | `5.x` | Full Type Safety across APIs, props, and schemas |
| **Tailwind CSS** | `4.x` | Utility-first styling engine with `@tailwindcss/postcss` |
| **Lucide React** | `1.49.x` | Minimalist iconography |
| **react-markdown** | `10.1.x` | Markdown rendering for AI responses |
| **remark-gfm** | `4.0.x` | GitHub Flavored Markdown (tables, tasklists, autolinks) |

---

## Directory Structure

```
frontend/
├── public/                    # Static assets & icons
├── src/
│   ├── app/
│   │   ├── globals.css        # Global CSS variables & Tailwind v4 setup
│   │   ├── layout.tsx         # Root layout with Inter & Cairo font injection
│   │   └── page.tsx           # Main application view with session & health state
│   ├── components/
│   │   ├── ChatView.tsx       # Core conversational UI & message stream
│   │   ├── Header.tsx         # Minimalist top bar with brand & language toggle
│   │   ├── ToolCallsInspector.tsx # Collapsible accordion showing AI function calls
│   │   ├── DoctorCard.tsx     # Structured card for doctor credentials & fee
│   │   ├── HospitalCard.tsx   # Structured card for hospital ratings & facilities
│   │   └── ui/                # Reusable UI primitives
│   ├── lib/
│   │   ├── api.ts             # Strongly-typed HTTP client for backend endpoints
│   │   ├── translations.ts    # Complete bilingual dictionary (EN / AR)
│   │   └── utils.ts           # Styling utilities (clsx & twMerge)
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces (Doctor, Hospital, Chat)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

The application works out-of-the-box with default settings. To customize the backend API URL, create an `.env.local` file in the `frontend/` directory:

```bash
# Backend API Base URL (defaults to http://localhost:5001/api/v1)
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+ (Node 20 or 22 recommended)
- **Backend Service running** on port `5001` (see `../backend/README.md`)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server on `http://localhost:3000` |
| `npm run build` | Compiles an optimized production build |
| `npm run start` | Launches the production server |
| `npm run lint` | Runs ESLint checks |
| `npx tsc --noEmit` | Runs the TypeScript compiler check for type errors |

---

## Design Decisions

1. **Light-Mode Only by Default**: Medical consultation tools must evoke cleanliness, calm, and clarity. A high-contrast light theme ensures maximum readability of dense medical information and prevents screen glare.
2. **Dedicated Cairo Font for Arabic**: Arabic system fonts often have irregular baselines and small line-heights. By loading Google Font `Cairo` through `next/font`, the Arabic text matches the visual weight of Latin text.
3. **Transparent AI Function Calls**: Rather than hiding the AI's internal actions, the `ToolCallsInspector` builds patient trust by demonstrating that doctor suggestions come from a verified healthcare dataset rather than LLM speculation.
4. **Strict Medical Disclaimer**: Prominent disclaimers remind users that HealTrip is a clinical guidance and triage assistant, not an official emergency dispatch or final diagnostic authority.
