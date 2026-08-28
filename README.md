# Task Reminder

A Next.js (Pages Router) app with OTP authentication, email/SMS/push task reminders, and a subscription (paywall) system verified via an admin panel.

## Features
- **OTP auth** — 6-digit code via email (Gmail SMTP or Resend) or SMS (Sparrow or Twilio); JWT session cookie.
- **Task reminders** — due-date tasks with per-task email / push / SMS toggles.
- **Web Push** — VAPID-based push notifications with a service worker.
- **Paywall** — eSewa & Khalti subscription requests, manually approved by an admin.
- **Nepali date** — Bikram Sambat date display via `nepali-date-converter`.

## Tech
Next.js 14 · React 18 · Mongoose (MongoDB) · bcryptjs · jsonwebtoken · web-push · nodemailer · framer-motion · libphonenumber-js

## Local development
```bash
npm install
# copy .env.example -> .env.local and fill in your values
npm run dev
```

## Deploying to Vercel
This project deploys as a standard Next.js app. **No `vercel.json` is required** — Vercel auto-detects Next.js.

1. Push this repo to GitHub and import it in Vercel.
2. Add the **environment variables** (see `.env.example`) under **Vercel → Settings → Environment Variables**:
   - `MONGODB_URI`, `JWT_SECRET`, `ADMIN_SECRET`, `CRON_SECRET`, `ADMIN_EMAIL`
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
   - `SPARROW_SMS_TOKEN` / Twilio keys (optional, for SMS) · `RESEND_API_KEY` (optional)
3. Redeploy.

**Note:** `MONGODB_URI` passwords containing `@` must use `%40`, e.g. `...:elysium%402004@cluster0...`.

### Scheduling reminders
The cron endpoint is `POST /api/cron/send-reminders` (guarded by `CRON_SECRET` via the `x-cron-secret` header or `?secret=`). It also accepts Vercel Cron's `x-vercel-cron` header when you enable a Cron Job in the Vercel dashboard (paid plans). On Hobby (free) plans, call it from an external scheduler such as cron-job.org with the `x-cron-secret` header.
