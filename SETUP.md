# Building Status - Setup Guide

**Note:** This guide covers the current Next.js/TypeScript/PostgreSQL setup. The project has been migrated from the original static HTML version.

For quick start instructions, see [README.md](README.md#quick-start).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Deployment to Render](#deployment-to-render)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** 18.18.0 or higher
- **PostgreSQL:** 14+ (local) or 18 (Render)
- **Git:** For version control
- **npm:** Comes with Node.js

### Optional Tools

- **Drizzle Studio:** Database GUI (included in dev dependencies)
- **PostgreSQL GUI:** TablePlus, pgAdmin, or Postico
- **API Testing:** Postman, Insomnia, or curl

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/petroleumjelliffe/building-status.git
cd building-status
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- TypeScript
- Drizzle ORM
- PostgreSQL client
- bcryptjs for password hashing
- All dev dependencies

### 3. Create Local Database

#### Option A: PostgreSQL.app (macOS)
```bash
# Download from https://postgresapp.com/
# Start PostgreSQL.app
# Create database
psql postgres
CREATE DATABASE building_status;
\q
```

#### Option B: Homebrew (macOS)
```bash
brew install postgresql@16
brew services start postgresql@16
createdb building_status
```

#### Option C: Docker
```bash
docker run --name building-status-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=building_status \
  -p 5432:5432 \
  -d postgres:16
```

### 4. Configure Environment Variables

Create `.env.local` in project root:

```bash
# Database connection
DATABASE_URL="postgresql://localhost/building_status"

# Or with username/password:
# DATABASE_URL="postgresql://user:password@localhost:5432/building_status"

# Admin password hash (generate below)
EDITOR_PASSWORD_HASH="your-hash-here"

# Site URL for Open Graph images
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 5. Generate Password Hash

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
```

Copy the output and paste it as `EDITOR_PASSWORD_HASH` in `.env.local`.

### 6. Set Up Database

Run the full database setup:

```bash
npm run db:setup
```

This command:
1. Generates migrations from schema (`db:generate`)
2. Applies migrations to database (`db:migrate`)
3. Seeds initial data (`db:seed`)

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Configuration

### Schema Overview

The database includes these tables:

- **systems** - Building system statuses (Heat, Water, Laundry)
- **issues** - Reported issues with tracking fields
- **maintenance** - Scheduled maintenance items
- **announcements** - Building-wide announcements
- **config** - Site configuration (building name, contact info)

See [src/lib/db/schema.ts](src/lib/db/schema.ts) for full schema.

### Database Commands

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with initial data
npm run db:seed

# Full setup (generate + migrate + seed)
npm run db:setup
```

### Drizzle Studio

Launch the database GUI:

```bash
npm run db:studio
```

Opens at [https://local.drizzle.studio](https://local.drizzle.studio)

Features:
- Browse tables and data
- Run queries
- Edit records
- View schema

### Database Migrations

After changing schema in `src/lib/db/schema.ts`:

```bash
# 1. Generate migration
npm run db:generate

# Drizzle will create a new migration file in drizzle/

# 2. Review migration
cat drizzle/0001_migration_name.sql

# 3. Apply migration
npm run db:migrate
```

---

## Environment Variables

### Development (.env.local)

```bash
# Required
DATABASE_URL="postgresql://localhost/building_status"
EDITOR_PASSWORD_HASH="$2a$10$..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Production (Render)

```bash
# Required
DATABASE_URL=<automatically set from database>
EDITOR_PASSWORD_HASH="$2a$10$..."
NEXT_PUBLIC_SITE_URL="https://your-app.onrender.com"
```

**Security Notes:**
- Never commit `.env.local` to Git (it's gitignored)
- Use Render dashboard to set production environment variables
- Password hash should be generated with bcrypt (10 rounds)
- NEXT_PUBLIC_* variables are exposed to the browser

---

## Deployment to Render

### 1. Create PostgreSQL Database

In Render Dashboard:

1. Click "New +" → "PostgreSQL"
2. Settings:
   - **Name:** `building-status-prod`
   - **Database:** `building_status_prod`
   - **User:** `building_status_prod_user`
   - **Region:** Same as your web service
   - **Plan:** Free
   - **PostgreSQL Version:** 18

3. Click "Create Database"
4. Wait for provisioning (~2 minutes)
5. Copy the **Internal Database URL** for next step

### 2. Create Web Service

In Render Dashboard:

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Settings:
   - **Name:** `building-status`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run db:setup && npm run build`
   - **Start Command:** `npm run start`
   - **Plan:** Free

### 3. Configure Environment Variables

In web service settings → Environment:

| Key | Value | Source |
|-----|-------|--------|
| `DATABASE_URL` | (select from database) | building-status-prod |
| `EDITOR_PASSWORD_HASH` | Your bcrypt hash | Manual |
| `NEXT_PUBLIC_SITE_URL` | Your Render URL | Manual |

**Important:**
- DO NOT set `NODE_ENV=production` manually (Next.js sets this automatically)
- Use "Link Database" button to set DATABASE_URL from your Render database

### 4. Deploy

1. Click "Manual Deploy" → "Deploy latest commit"
2. Watch build logs
3. Wait for deployment (~3-5 minutes)
4. Visit your site URL

### 5. Verify Deployment

Checklist:
- [ ] Homepage loads successfully
- [ ] Systems status displays correctly
- [ ] Social sharing generates Open Graph image
- [ ] Login works with your password
- [ ] Status updates save to database
- [ ] Page revalidates after 60 seconds

---

## Troubleshooting

### Build Fails with "Module not found"

**Symptom:**
```
Module not found: Can't resolve '@/lib/auth'
```

**Solution:**
Ensure `NODE_ENV=production` is NOT set in Render environment variables. Next.js sets this automatically.

### Database Connection Fails

**Symptom:**
```
error: connection to server failed
```

**Solutions:**
1. Check DATABASE_URL format:
   ```
   postgresql://user:password@host:5432/database
   ```

2. For Render internal database:
   ```
   postgresql://user:password@hostname.render.com/database
   ```

3. Verify database is running (Render dashboard shows status)

### Migrations Not Running

**Symptom:**
```
relation "config" does not exist
```

**Solution:**
Build command must include `npm run db:setup`:
```bash
npm install && npm run db:setup && npm run build
```

### Password Hash Not Working

**Symptom:**
Login fails with correct password

**Solutions:**
1. Regenerate hash:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password', 10).then(console.log)"
   ```

2. Copy entire hash including `$2a$10$...`

3. Ensure no extra spaces in environment variable

4. Check bcrypt version matches (should be ~2.4.3)

### Static Generation Fails

**Symptom:**
```
Error occurred prerendering page "/"
```

**Solutions:**
1. Check database is accessible during build
2. Verify all database queries in page.tsx are working
3. Look for console errors in build logs
4. Test with `npm run build` locally

### Session Doesn't Persist

**Expected Behavior:**
File-based sessions don't persist across Render deployments. This is normal.

**Solution:**
For production, migrate to Redis (see [MVP-ROADMAP.md - Priority 4A](MVP-ROADMAP.md#priority-4a-session-storage-migration))

---

## Development Workflow

### Making Changes

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes to code

3. Test locally:
   ```bash
   npm run build
   npm start
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "Add feature"
   git push origin feature/your-feature
   ```

5. Open Pull Request on GitHub

6. After merge to `main`, Render auto-deploys

### Testing Production Build Locally

```bash
# Build production version
npm run build

# Run production server
npm start

# Open http://localhost:3000
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Render Deploy Guide](https://render.com/docs/deploy-nextjs-app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Migration from Old Version

If you're coming from the static HTML version:

**Old Stack:**
- Static HTML/CSS/JS
- Val Town config server
- GitHub Pages
- localStorage

**New Stack:**
- Next.js 14 TypeScript
- PostgreSQL database
- Render.com
- Session-based auth

**What Changed:**
- Configuration moved from Val Town to database
- Data persistence now in PostgreSQL
- Authentication upgraded from localStorage to sessions
- Deployment migrated from GitHub Pages to Render

**No Migration Path:**
Old data in localStorage doesn't transfer. You'll need to manually re-enter any existing issues/maintenance items.

---

Last Updated: 2026-01-16
