# Register

This repository contains two applications:

- `backend/` — Laravel API and backend services
- `frontend/` — Next.js web application

## Requirements

- PHP 8.2 or newer with the extensions required by Laravel and the project
- Composer
- Node.js and npm

## Install dependencies

From the repository root, install each application's dependencies:

```bash
cd backend
composer install
npm install

# Create local environment configuration if it does not exist yet.
test -f .env || cp .env.example .env
php artisan key:generate
php artisan migrate

cd ../frontend
npm ci
```

If the backend `.env` already exists, keep it and do not replace it with `.env.example`.

## Run both development servers

Open two terminals from the repository root.

**Terminal 1 — backend:**

```bash
cd backend
composer run dev
```

This starts Laravel, the queue worker, Laravel logs, and the backend Vite development server.

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Open the frontend at [http://localhost:3000](http://localhost:3000). The Laravel server is available at [http://localhost:8000](http://localhost:8000).

Stop either development server with `Ctrl+C` in its terminal.

## Useful commands

Run these commands from the corresponding application directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend/` | `php artisan test` | Run backend tests |
| `backend/` | `npm run build` | Build backend Vite assets |
| `frontend/` | `npm run lint` | Lint the frontend |
| `frontend/` | `npm run build` | Build the frontend for production |
