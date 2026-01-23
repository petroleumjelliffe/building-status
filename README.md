# Building Status

A real-time status page for apartment building facilities with server-side rendering, live editing capabilities, and social sharing.

## Features

- **Real-time System Status** - View status of Heat, Water, and Laundry across all buildings
- **Issue Tracking** - Report and track building issues with live updates
- **Maintenance Schedule** - View upcoming scheduled maintenance
- **Announcements** - Display important building announcements
- **Manager Dashboard** - Secure admin interface for live editing
- **Social Sharing** - Generate shareable images with current status
- **Static Generation with ISR** - Fast page loads with 60-second revalidation
- **Open Graph Meta Tags** - Rich social media previews with database-driven content

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Session-based with bcrypt
- **Deployment:** Render.com
- **Styling:** CSS Modules

## Quick Start

### Prerequisites

- Node.js 18.18.0 or higher
- PostgreSQL database

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/petroleumjelliffe/building-status.git
   cd building-status
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env.local`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/building_status"
   EDITOR_PASSWORD_HASH="your-bcrypt-hash-here"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

   Generate password hash:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
   ```

4. **Configure building data**

   Create `config.json` from the example template (contains your contact info and building-specific data):
   ```bash
   cp config.example.json config.json
   # Edit config.json with your building information
   ```

   **Note:** `config.json` is gitignored to protect PII. It's only used for initial database seeding. After setup, all data lives in the database.

5. **Set up the database**
   ```bash
   npm run db:setup
   ```

   This runs:
   - `db:generate` - Generates migrations from schema
   - `db:migrate` - Applies migrations to database
   - `db:seed` - Seeds initial data from config.json (one-time)

6. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
npm run db:generate  # Generate new migrations after schema changes
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:seed      # Seed database with initial data
npm run db:setup     # Full setup (generate + migrate + seed)
```

## Deployment

### Render.com Setup

1. **Create PostgreSQL Database**
   - Database Name: `building-status-prod`
   - Plan: Free
   - PostgreSQL Version: 18

2. **Create Web Service**
   - Build Command: `npm install && npm run db:setup && npm run build`
   - Start Command: `npm run start`

3. **Environment Variables**
   ```
   DATABASE_URL=<from-database>
   EDITOR_PASSWORD_HASH=<your-bcrypt-hash>
   NEXT_PUBLIC_SITE_URL=https://your-site.onrender.com
   ```

4. **Deploy**
   - Push to GitHub
   - Render auto-deploys from `main` branch

See [render.yaml](render.yaml) for complete configuration.

## Architecture

### Static Generation with ISR

The app uses Next.js static site generation with Incremental Static Regeneration:

- **Home Page (`/`)**: Statically generated at build time with 60-second revalidation
- **API Routes**: Dynamic with `force-dynamic` for request-based operations
- **Database Access**: Build-time queries for Open Graph meta tags

See [docs/adr/003-static-generation-with-isr.md](docs/adr/003-static-generation-with-isr.md)

### Authentication

- Session-based authentication with bcrypt password hashing
- Session tokens stored in-memory (development: file-based persistence)
- Production recommendation: Migrate to Redis for session storage

See [docs/adr/004-session-management.md](docs/adr/004-session-management.md)

### Database Schema

- **systems** - Building system statuses (Heat, Water, Laundry)
- **issues** - Reported issues with tracking
- **maintenance** - Scheduled maintenance items
- **announcements** - Building-wide announcements
- **config** - Site configuration

See [src/lib/db/schema.ts](src/lib/db/schema.ts)

## Project Structure

```
building-status/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (force-dynamic)
│   │   └── page.tsx           # Home page (static with ISR)
│   ├── components/            # React components
│   ├── lib/
│   │   ├── db/               # Database schema and connection
│   │   ├── auth.ts           # Authentication logic
│   │   ├── queries.ts        # Database queries
│   │   └── seed.ts           # Database seed script
│   └── types/                # TypeScript type definitions
├── docs/
│   └── adr/                  # Architecture Decision Records
├── drizzle/                  # Database migrations
├── public/                   # Static assets
└── package.json
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Path aliases: `@/*` → `src/*`

### Adding New Features

1. Update database schema in `src/lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Run migration: `npm run db:migrate`
4. Add queries to `src/lib/queries.ts`
5. Create API routes in `src/app/api/`
6. Update UI components

### Testing Locally

```bash
# Build production version
npm run build

# Test production build
npm start
```

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `EDITOR_PASSWORD_HASH` - Bcrypt hash of admin password
- `NEXT_PUBLIC_SITE_URL` - Full URL of deployed site (for OG images)

### Development Only

Create `.env.local` for local development. This file is gitignored.

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Test locally with `npm run build`
4. Open PR with description of changes
5. Ensure CI passes

## License

Private project for building management.

## Acknowledgments

Built with Next.js, TypeScript, and Drizzle ORM.
