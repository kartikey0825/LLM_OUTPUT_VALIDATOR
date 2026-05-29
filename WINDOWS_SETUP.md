# Windows Setup Guide

Use this guide if you are running the project from VS Code on Windows.

## Why pnpm?

During local testing, npm may crash on some Windows systems with:

```txt
npm error Exit handler never called!
```

That is an npm CLI issue, not a project-code issue. This project is therefore configured for pnpm.

## 1. Enable pnpm

If `pnpm -v` is not available, open VS Code as Administrator once and run:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

If `corepack enable` fails with `EPERM`, VS Code was not started as Administrator.

## 2. Install dependencies

From the project root:

```powershell
pnpm install
cd backend
pnpm install
cd ../frontend
pnpm install
```

If pnpm asks which packages can run build scripts, approve:

```txt
@prisma/client
@prisma/engines
prisma
esbuild
```

## 3. Setup Prisma

```powershell
cd ../backend
copy .env.example .env
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm run seed
```

Do not accept `npx prisma@7.x` prompts. The backend intentionally uses Prisma 5.x.

## 4. Start the app

Backend terminal:

```powershell
cd backend
pnpm run dev
```

Frontend terminal:

```powershell
cd frontend
pnpm run dev
```

Open:

```txt
http://localhost:5173
```

Backend health check:

```txt
http://localhost:4000/health
```
