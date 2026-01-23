# Database Setup Guide

## Local Development Setup (PostgreSQL)

### Option 1: Using Homebrew (macOS)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb building_status

# Set environment variable
echo "DATABASE_URL=postgresql://$(whoami)@localhost:5432/building_status" > .env.local
```

### Option 2: Using Docker

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name building-status-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=building_status \
  -p 5432:5432 \
  postgres:16-alpine

# Set environment variable
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/building_status" > .env.local
```

### Option 3: Using Postgres.app (macOS)

1. Download from https://postgresapp.com/
2. Install and start Postgres.app
3. Click "Initialize" for PostgreSQL 16
4. Create database:
   ```bash
   createdb building_status
   ```
5. Set environment variable:
   ```bash
   echo "DATABASE_URL=postgresql://$(whoami)@localhost:5432/building_status" > .env.local
   ```

## Generate Password Hash

Generate a bcrypt hash for your editor password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log);"
```

Add to `.env.local`:
```bash
EDITOR_PASSWORD_HASH=<your-generated-hash>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Run migrations
npm run db:migrate
```

## Seed Database

**IMPORTANT:** Create your local `config.json` from `config.example.json` first. This file contains your building-specific data and contact information (PII). It should NEVER be committed to git (it's in `.gitignore`).

```bash
# Copy example and edit with your data
cp config.example.json config.json
# Edit config.json with your building information, contacts, links, etc.

# Seed with data from config.json (one-time setup)
npm run db:seed
```

After seeding, all data lives in the database. You can edit contacts, links, and other configuration through the admin interface or database directly. The `config.json` file is only used for initial setup.

## Verify Database

```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Check system status
SELECT * FROM system_status;

# Check config
SELECT key FROM config;

# Exit
\q
```

## Render Production Setup

See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for production deployment with Render blueprints.

## Database Schema

### Tables

**system_status**
- Current status of building systems (heat, water, laundry)
- Tracks status, count, notes, and update timestamp

**issues**
- Reported building issues
- Tracks category, location, status, and resolution

**maintenance**
- Scheduled maintenance events
- Human-readable dates and descriptions

**announcements**
- Pinned notifications with optional expiration
- Types: warning, info, alert

**config**
- JSONB storage for static configuration
- Keys: contacts, helpfulLinks, garbageSchedule, buildings, systems, reportEmail

### Migrations

Migrations are stored in `drizzle/migrations/` and are version controlled.

To create a new migration after schema changes:
```bash
npm run db:generate
```

## Troubleshooting

### Connection refused
- Ensure PostgreSQL is running: `brew services list` or `docker ps`
- Check port 5432 is not in use: `lsof -i :5432`
- Verify DATABASE_URL in .env.local

### Permission denied
- Check database user has permissions
- For local dev, your user should own the database

### Migration errors
- Reset database: `dropdb building_status && createdb building_status`
- Re-run migrations: `npm run db:migrate`
- Check migration files in `drizzle/migrations/`

### Data not appearing
- Verify seed ran successfully: `npm run db:seed`
- Check data in psql: `psql $DATABASE_URL`
- Look for errors in console output
