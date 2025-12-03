# StudySync Daily — Student-Centric Academic Planner

StudySync Daily helps students plan, track, and optimize study time. Lightweight, privacy-focused, and built to turn scattered to-dos into a daily blueprint — routines, tasks, and weekly study targets all in one place.

## Features

- Daily Blueprint — at-a-glance plan for today with prioritized tasks.
- Adaptive Scheduling — schedule and reschedule tasks around fixed routines.
- Routine Management — recurring habits, classes, and breaks (weekly schedule).
- AI Study Helpers & Micro-Transactions — optional paid features (credits, premium plans) backed by the existing payment infra.

## Tech Stack

- Next.js (app router)
- NextAuth for authentication
- MongoDB with Mongoose for persistence
- Serverless API routes under /app/api
- Optional payment integrations (Stripe / Razorpay / mock)

## Getting Started

Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Environment variables (see below)

Install
```bash
npm install
```

Development
```bash
# dev server
npm run dev
# clear build cache (Windows PowerShell)
rd /s /q .next
```

Build / Production
```bash
npm run build
npm start
```


API endpoints (key)
- GET/PUT /api/user/academic-profile — fetch/update academicProfile
- GET/POST /api/tasks — list/create AcademicTask
- GET/POST /api/routines — list/create Routine
- POST /api/register — create new user (password rules enforced)
- NextAuth at /api/auth/[...nextauth] — credentials + OAuth

Models
- models/User.js — user + academicProfile
- models/AcademicTask.js — tasks/assignments
- models/Routine.js — recurring schedule items
- models/Payment.js — micro-transaction records

Notes
- Password policy: minimum 8 chars with upper/lowercase, digit, and special char.
- Keep .env* out of source control (use .gitignore).
- The app is intentionally modular: replace or extend payment gateways and AI helpers as needed.

Contributing
- Open issues and PRs welcome. Keep changes focused and add tests where applicable.

License
- MIT (or your preferred license) — add LICENSE file if needed.
