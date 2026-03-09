# Eldorya

Real-time web-based TTRPG platform — campaign world-building, map editing, NPC management, character creation, inventory management, and live session orchestration.

## Tech Stack

- **Frontend:** Next.js 16 (SPA mode) + Tailwind CSS 4 + shadcn/ui + react-konva
- **Backend:** NestJS 11 + CQRS/ES (nestjs-cqrx)
- **Databases:** PostgreSQL 18 (read models) + KurrentDB 26 (event store)
- **Auth:** Clerk
- **Real-time:** Socket.io (WebSocket Gateway)
- **CI/CD:** GitHub Actions (PR quality gates) + Railway (auto-deploy)

## Prerequisites

- Node.js 22+
- Docker & Docker Compose

## Getting Started

### 1. Start infrastructure services

```bash
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- KurrentDB on port 2113 (admin UI: http://localhost:2113)

### 2. Start backend

```bash
cd backend
cp .env.example .env  # Edit with your Clerk keys
npm install
npx prisma migrate dev
npm run start:dev
```

Backend runs on http://localhost:3001

### 3. Start frontend

```bash
cd frontend
cp .env.example .env.local  # Edit with your Clerk keys
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Code Quality

Run checks locally before opening a PR:

```bash
# Frontend
cd frontend && npm run lint && npm run typecheck && npm test

# Backend
cd backend && npm run lint && npm run typecheck && npm test
```

On every pull request to `main`, GitHub Actions runs lint, typecheck, and tests for both apps in parallel.

## Branch Protection

The `main` branch requires the `frontend` and `backend` CI checks to pass before merging.

## Project Structure

```
eldorya/
├── .github/workflows/ # CI pipeline (GitHub Actions)
├── frontend/          # Next.js 16 SPA
├── backend/           # NestJS 11 + WebSocket Gateway
├── docker-compose.yml # PostgreSQL + KurrentDB (local dev)
└── docs/              # Project documentation
```
