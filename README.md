# ECGBC Registration — Monorepo

A clean pnpm monorepo containing all ECGBC registration system apps.

## Apps

| App | Path | Port | Description |
|-----|------|------|-------------|
| `@ecgbc/backend` | `apps/backend` | 5000 | Express + Prisma REST API |
| `@ecgbc/admin-portal` | `apps/admin-portal` | 3000 | Next.js Admin Enterprise Portal |
| `@ecgbc/church-portal` | `apps/church-portal` | 3001 | Next.js Member Church Portal |

## Prerequisites

- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)
- MySQL database

## Getting Started

```bash
# Install all dependencies from the root
pnpm install

# Run all apps in parallel
pnpm dev

# Run individual apps
pnpm dev:backend
pnpm dev:admin
pnpm dev:church
```

## Workspace Commands

```bash
# Run a command in a specific workspace
pnpm --filter @ecgbc/backend run prisma:generate
pnpm --filter @ecgbc/admin-portal run build

# Add a dependency to a specific app
pnpm --filter @ecgbc/church-portal add axios
```

## Environment Setup

Each app has its own `.env` file. Copy the example and fill in your values:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/admin-portal/.env.example apps/admin-portal/.env.local
cp apps/church-portal/.env.example apps/church-portal/.env.local
```
