# 🤖 iBots: Automated Workflow & Bot Task Orchestrator

A production-grade **MERN stack automation console** designed to configure, schedule, and orchestrate background bot routines (HTTP health probes, webpage scrapers, webhook dispatches, and automated database cleanup).

Engineered with a **Dual-Execution Engine**:
- **Local Development**: In-process background scheduler loop (`setInterval` daemon) + manual instant execution.
- **Production (Vercel)**: Fully serverless with **Vercel Cron Jobs** triggering `/api/cron/dispatch` and cached MongoDB Atlas connection pools.

---

## 🚀 Key Features

* **Visual Execution Timeline**: Interactive real-time log feed displaying duration latency, status badges, timestamps, and expandable raw JSON output inspection.
* **Instant Bot Toggling**: One-click active/paused switches directly tied to atomic MongoDB updates.
* **Multi-Collection Architecture**: Mongoose models for `Users`, `Workflows`, and `ExecutionLogs` with optimistic locking and MongoDB TTL indexes.
* **Dual Execution Modes**:
  * Persistent local daemon in development.
  * Serverless Vercel Cron invocation (`vercel.json`) with Bearer token authentication in production.
* **Auto Demo Seeding**: Comes pre-populated with ready-to-test bot routines and historical execution logs out-of-the-box.

---

## 📂 Project Structure

```text
ibots1/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Header, Stats, WorkflowList, Modal, Timeline
│   │   ├── services/api.js     # API & JWT Auth Handler
│   │   ├── App.jsx             # Main Console Container
│   │   ├── index.css           # Modern Dark-Mode Glassmorphic Design
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/db.js        # Serverless-Safe Mongoose Pool Singleton
│   │   ├── controllers/        # Auth, Workflows, Logs, and Cron Dispatchers
│   │   ├── models/             # User, Workflow, ExecutionLog (TTL & Compound Indexes)
│   │   ├── routes/             # Express API Endpoints
│   │   ├── services/           # Bot Task Runner & Scheduler Engine
│   │   ├── app.js              # Express Application Pipeline
│   │   ├── seed.js             # Demo Seeding Utility
│   │   └── index.js            # Local Server Entrypoint
│   └── package.json
│
├── api/                        # Vercel Serverless Function Bridge
│   └── index.js                # Exports Express App with DB Caching
│
├── vercel.json                 # Vercel Routing, Rewrites & Cron Config
├── .env.example                # Environment Variable Reference
└── package.json                # Root Workspace Scripts
```

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 2. Configure Environment (`.env`)
A default `.env` is already created at the root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ibots
JWT_SECRET=ibots_jwt_super_secret_dev_key_2026
CRON_SECRET=vercelsupersecretcronkey2026
CLIENT_URL=http://localhost:5173
```

*(If you have MongoDB Atlas, paste your `mongodb+srv://...` URI in `MONGODB_URI`)*.

### 3. Run the Backend & Frontend
In separate terminal tabs:

**Terminal 1 (Backend API & Local Scheduler):**
```bash
cd server
npm run dev
```

**Terminal 2 (React Vite Dashboard):**
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. Go to your [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Import the repository.
4. In the Vercel **Environment Variables** settings, add:
   * `MONGODB_URI`: Your MongoDB Atlas connection string.
   * `JWT_SECRET`: Any secure random secret string.
   * `CRON_SECRET`: A secret string used by Vercel Crons (e.g. `vercelsupersecretcronkey2026`).
   * `NODE_ENV`: `production`
5. Click **Deploy**.

Vercel automatically reads `vercel.json`, sets up the client static build (`client/dist`), points `/api/*` to the serverless Express function (`api/index.js`), and schedules `/api/cron/dispatch` to run periodically!

---

## 📡 Core API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/auth/demo` | Bootstraps demo session and returns JWT token |
| `GET` | `/api/workflows` | Retrieves user workflows |
| `POST` | `/api/workflows` | Creates a new bot task routine |
| `PATCH` | `/api/workflows/:id/toggle` | Toggles bot active / paused state |
| `POST` | `/api/workflows/:id/run` | Triggers immediate execution of a bot |
| `DELETE` | `/api/workflows/:id` | Deletes workflow & cascade cleans logs |
| `GET` | `/api/logs` | Fetches visual timeline execution history |
| `GET` | `/api/logs/stats` | Aggregated dashboard telemetry metrics |
| `POST` | `/api/cron/dispatch` | Vercel Cron worker batch execution trigger |

---

## 🗄️ Database Models & Relationships

* **`User` (1) ➔ (N) `Workflows`**: Enforces account limits, subscription tier, and ownership.
* **`Workflow` (1) ➔ (N) `ExecutionLogs`**: Defines schedule interval, task type (`HEALTH_PING`, `PAGE_SCRAPE`, `WEBHOOK_POST`, `DATA_CLEANUP`), and optimistic locking fields (`currentStatus`, `lockedAt`).
* **`ExecutionLog`**: Contains execution duration in milliseconds, HTTP status code, output payload, and error traces. Utilizes a **compound index** (`{ workflow: 1, executedAt: -1 }`) and a **TTL index** (`expireAfterSeconds: 2592000`) for automatic 30-day log rotation.
