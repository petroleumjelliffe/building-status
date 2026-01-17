# Render Deployment Guide

## Prerequisites

- GitHub account with building-status repository
- Render account (free tier is sufficient)
- Local database tested and working

## Deployment Steps

### 1. Push Code to GitHub

```bash
# Ensure all changes are committed
git add -A
git commit -m "Ready for Render deployment"

# Push to GitHub
git push origin next-ts-migration
```

### 2. Create New Blueprint on Render

**Option A: Deploy from Dashboard (Recommended)**

1. Go to https://dashboard.render.com/
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository: `petroleumjelliffe/building-status`
4. Select branch: `next-ts-migration`
5. Render will detect `render.yaml` and create:
   - Web Service: `building-status`
   - PostgreSQL Database: `building-status-db`
6. Click **"Apply"** to create resources

**Option B: Deploy via Render CLI**

```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy blueprint
render blueprint launch
```

### 3. Set Environment Variables

After deployment, set these in the Render dashboard:

1. Go to **Web Service** → **Environment**
2. Add environment variables:

```bash
# Generate password hash locally first:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10).then(console.log);"

# Then add to Render:
EDITOR_PASSWORD_HASH=<your-generated-hash>
NEXT_PUBLIC_SITE_URL=https://building-status.onrender.com

# DATABASE_URL is automatically set from database connection
```

3. Click **"Save Changes"**

### 4. Run Database Migrations

Render will automatically deploy your app, but you need to run migrations:

**Option A: Using Render Shell**

1. Go to **Web Service** → **Shell**
2. Run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

**Option B: Using Render SSH (if enabled)**

```bash
# Connect via SSH
render ssh building-status

# Run migrations
npm run db:setup

# Exit
exit
```

**Option C: Using psql Locally**

```bash
# Get database URL from Render dashboard
# Database → Internal Connection String

# Run migrations locally against production
DATABASE_URL="<render-internal-url>" npm run db:migrate
DATABASE_URL="<render-internal-url>" npm run db:seed
```

### 5. Verify Deployment

1. Visit your site: `https://building-status.onrender.com`
2. Check systems status loads correctly
3. Test edit mode:
   - Click "Edit" button
   - Enter your password
   - Tap a system status to cycle it

### 6. Configure Custom Domain (Optional)

1. Go to **Web Service** → **Settings**
2. Scroll to **Custom Domains**
3. Click **"Add Custom Domain"**
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_SITE_URL` to your domain

## Database Management

### Accessing Production Database

**Via Render Dashboard:**
- Go to **Database** → **Info**
- Use **PSQL Command** to get connection string
- Connect: `psql <external-connection-string>`

**Via Render Database Browser:**
- Go to **Database** → **Browser**
- View tables and data in web interface

### Backing Up Database

```bash
# Get external connection string from Render dashboard
# Database → Connections → External Connection String

# Backup
pg_dump <external-connection-string> > backup.sql

# Restore (if needed)
psql <external-connection-string> < backup.sql
```

### Running Migrations on Production

After schema changes:

```bash
# 1. Generate new migration locally
npm run db:generate

# 2. Commit and push
git add drizzle/migrations/
git commit -m "Add new migration"
git push

# 3. Render auto-deploys

# 4. Run migration via Render Shell
# Go to Web Service → Shell
npm run db:migrate
```

## Monitoring & Logs

### View Logs

1. Go to **Web Service** → **Logs**
2. Filter by:
   - **Deploy** - Build and deployment logs
   - **Service** - Runtime logs
   - **Events** - Service events

### Check Health

- Render automatically pings `/` endpoint
- View status in dashboard
- Set up alerts in **Settings** → **Alerts**

### Database Metrics

1. Go to **Database** → **Metrics**
2. Monitor:
   - Connections
   - Storage usage
   - Query performance

## Troubleshooting

### Build Fails

```bash
# Check logs in Deploy tab
# Common issues:
- Missing dependencies: Check package.json
- TypeScript errors: Run `npm run build` locally first
- Environment variables: Ensure all set
```

### Database Connection Errors

```bash
# Verify DATABASE_URL is set
# In Web Service → Environment

# Check database is running
# In Database → Info → Status should be "Available"

# Test connection from shell
# Web Service → Shell
psql $DATABASE_URL
```

### Migrations Fail

```bash
# Check migration files are committed
ls drizzle/migrations/

# Verify schema matches migrations
npm run db:generate

# Reset database (CAUTION: destroys data)
# In Database → Danger Zone → Delete Database
# Then recreate via Blueprint
```

### Site Not Loading

```bash
# Check service status
# Web Service → Status should be "Live"

# Check logs for errors
# Web Service → Logs

# Verify build succeeded
# Web Service → Events → Last deploy status

# Test locally first
npm run build && npm run start
```

## Cost Management

### Free Tier Limits

**Web Service (Free Plan):**
- 512 MB RAM
- Shared CPU
- Spins down after 15 minutes of inactivity
- 750 hours/month (enough for 24/7)

**PostgreSQL (Free for 90 days):**
- After 90 days: $7/month
- 1 GB storage
- 10 concurrent connections

### Upgrade Options

To prevent spin-down:
1. **Starter Plan** ($7/month)
   - No spin-down
   - Same resources

To keep database free:
1. **Migrate to Neon** (free forever)
2. Export data: `pg_dump`
3. Import to Neon
4. Update `DATABASE_URL`

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Blueprint deployed on Render
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Database seeded with config
- [ ] Site loads successfully
- [ ] Edit mode works with password
- [ ] Status updates work
- [ ] Custom domain configured (if using)
- [ ] Monitoring/alerts set up

## Updating Production

```bash
# 1. Make changes locally
# 2. Test thoroughly
npm run build && npm run start

# 3. Commit and push
git add -A
git commit -m "Your changes"
git push

# 4. Render auto-deploys
# 5. Monitor deployment in dashboard
# 6. Verify changes live
```

## Rolling Back

If deployment breaks:

1. Go to **Web Service** → **Deploys**
2. Find last working deploy
3. Click **"Rollback to this version"**
4. Service reverts immediately

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com/
- Check service status: https://status.render.com/
