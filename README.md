# Catan Vision

Next.js scaffold for a protected Catan board image upload flow.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- shadcn/ui with Radix primitives
- Clerk for authentication
- Convex for database records and object storage

## Getting Started

Install dependencies and start the app:

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Credentials

Copy `.env.example` to `.env.local` and fill in the Clerk and Convex values when they are available.

```bash
cp .env.example .env.local
```

After configuring Convex, refresh generated Convex files:

```bash
npx convex dev
```

The home route is protected with Clerk. Until Clerk credentials are configured, signed-out requests will be intercepted by Clerk's protection layer.
