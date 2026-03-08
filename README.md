# booking-app2

Fresh start for a booking calendar app focused on fast specialist discovery.

## Vision

The app is designed around one core UX idea:

- Optional filters at the top (city and service)
- Specialist cards below with near-term availability shown immediately
- Horizontal day browsing so users can quickly compare many specialists

This avoids the classic flow where users must pick a specialist first and then repeat search loops.

## Tech

- Next.js (App Router) + TypeScript
- Mock domain data for MVP iteration
- Local availability engine for slot generation and conflict blocking

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment file:

```bash
cp .env.example .env
```

3. Initialize local database:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Start dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Current MVP scope

- Top filters (city, service)
- Specialist grid
- Per-specialist day columns with available times
- Global previous/next controls for horizontal day window
- "First available" helper per specialist
- Slot selection and booking form
- API endpoint to create booking with conflict protection
- Local persistence with Prisma + SQLite

## Next steps

- Booking form and reservation persistence
- Admin view (daily/weekly calendar)
- Notification pipeline (email/SMS)
- Authentication and role separation