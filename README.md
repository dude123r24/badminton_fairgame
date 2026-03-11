# vibe-application-template

Built with Claude Code.

## Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Google OAuth (NextAuth.js)
- **LLM:** Gemini API
- **Payments:** Stripe
- **Deployment:** Railway

## Getting Started

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables
Copy `.env.local` and fill in your keys. See `.env.local` for all required variables.

## Deployment
Deployed on Railway. Push to `main` to trigger a deployment.
