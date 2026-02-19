<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-blue?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.x-black?logo=flask" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" />
</p>

# GG Nexus — AI-Powered Gaming Platform

**GG Nexus** is a full-stack agentic AI platform that serves as an intelligent gaming companion. It uses the **ReAct** (Reason + Act) agent pattern, **dynamic RAG** (Retrieval-Augmented Generation), and **live tool use** to deliver personalized, data-driven gaming advice.

> Demonstrates production-grade agentic AI architecture: prompt engineering, tool-augmented generation, multi-source data fetching, and MongoDB-backed caching.

---

## Architecture

```
User (React Frontend)
     │
     ▼
Flask API (JWT Auth + Rate Limiting)
     │
     ▼
ReAct Agent Loop
     ├── THOUGHT:      Reasons about what data is needed
     ├── ACTION:       Calls the appropriate tool
     ├── OBSERVATION:  Processes tool results
     └── FINAL ANSWER: Responds with grounded data
          │
          ├── search_game_info   → Live meta, tips, builds
          ├── recommend_games    → Personalized recommendations
          ├── get_player_profile → User preferences & history
          └── compare_games     → Side-by-side game comparison
               │
               ▼
          Data Sources (fallback chain)
          ├── MongoDB Cache (24h TTL)
          ├── Riot Games API (LoL, Valorant)
          ├── Gemini AI Search (any game)
          └── Static Knowledge Base
```

---

## Key Features

### Agentic AI
- **ReAct Pattern** — Step-by-step reasoning loop (Thought → Action → Observation → Answer) producing grounded responses instead of raw completions.
- **Dynamic Tool Use** — Four tools the agent selects autonomously based on user intent. No hardcoded routing.
- **Reasoning Trace** — Every response includes a debug trace of the agent's thought process, tool calls, and observations.

### Dynamic RAG
- **Cache-First Architecture** — MongoDB caches API and AI-generated data with a 24-hour TTL.
- **Multi-Source Data Chain** — Official APIs → Gemini AI search → static knowledge base with graceful degradation.
- **Universal Game Coverage** — Gemini fallback enables answers about any game, including new releases.

### Full-Stack Platform
- **JWT + bcrypt Authentication** — Secure signup/login with hashed passwords and token-based sessions.
- **Conversation Memory** — Chat history persisted in MongoDB with episodic session summaries.
- **Animated Bot Avatar** — 12-mood reactive character that responds to conversation sentiment.
- **Multi-Step Onboarding** — Collects user preferences for personalized recommendations.
- **Cyberpunk Gaming UI** — Dark Noxus-inspired theme with neon accents and smooth animations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS v4, React Router, Axios |
| Backend | Flask, Flask-CORS |
| AI / LLM | Google Gemini 2.0 Flash (`google-genai` SDK) |
| Database | MongoDB 7 (Docker) |
| Auth | JWT (PyJWT) + bcrypt |
| APIs | Riot Games API, Valorant API |
| Infra | Docker Compose |

---

## Project Structure

```
gg-nexus/
├── backend/
│   ├── agents/
│   │   └── react_agent.py        # ReAct loop, fallback logic
│   ├── models/
│   │   ├── user.py               # User model, bcrypt hashing
│   │   ├── conversation.py       # Chat persistence, episodic memory
│   │   └── cache.py              # MongoDB TTL cache layer
│   ├── routes/
│   │   └── auth.py               # JWT auth endpoints
│   ├── tools/
│   │   ├── game_tools.py         # Tool definitions + execution
│   │   └── data_fetcher.py       # Multi-source data retrieval
│   ├── knowledge/
│   │   ├── games.json            # Static game database (fallback)
│   │   └── recommendations.json  # Recommendation mappings
│   ├── app.py                    # Flask entry point
│   ├── config.py                 # Environment configuration
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/           # Sidebar, BotMascot, NoxusLogo
│       ├── pages/                # Chat, Dashboard, Landing, Signup
│       └── services/             # API client
├── docker-compose.yml
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker Desktop

### 1. Clone & Configure

```bash
git clone https://github.com/ItaiFWeinberg/gg-nexus.git
cd gg-nexus
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/gg_nexus
RIOT_API_KEY=your_riot_key    # Optional — Gemini fallback works without it
```

### 2. Start MongoDB

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — Vite proxies API calls to Flask on port 5000.

---

## AI Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| Prompt Engineering | System prompt with persona, rules, emotional awareness, structured output |
| ReAct Agent | Multi-step reasoning loop with tool selection and observation parsing |
| RAG | Dynamic retrieval from APIs + AI search, cached in MongoDB |
| Tool Use | 4 tools selected autonomously by the LLM based on query intent |
| Agent Memory | Short-term (context window), long-term (MongoDB), episodic (session summaries) |
| Cache Invalidation | TTL-based MongoDB cache with manual refresh endpoint |
| Fallback Chains | API → Gemini → static KB → graceful error |
| Zero-Shot Classification | LLM classifies intent to select tools without explicit routing |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user info |
| POST | `/api/chat` | JWT | Send message to agent |
| GET | `/api/chat/sessions` | JWT | List chat sessions |
| GET | `/api/chat/history/:id` | JWT | Get session messages |
| GET | `/api/admin/cache` | JWT | View cache entries |
| POST | `/api/admin/cache/refresh` | JWT | Force cache refresh |
| GET | `/api/health` | — | Health check |

---

## License

MIT