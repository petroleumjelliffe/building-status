# Building Status - Setup Guide

## Keeping Emails & Phone Numbers Private

This project uses Val Town to serve sensitive configuration data (emails, phone numbers) without exposing them in the public GitHub repository.

## Setup Steps

### 1. Set Up Val Town Config Server

1. Go to [Val Town](https://val.town) and sign in/create account
2. Click "New Val" → Choose "HTTP Val"
3. Name it something like `buildingStatusConfig`
4. Copy the contents of `valtown-config-server.js` into the Val editor
5. Update the `CONFIG` object with your actual:
   - Contact phone numbers
   - Email addresses
   - Building information
   - Links and schedules
6. Set the Val visibility to **"Unlisted"** or **"Private"**
7. Click "Save" - Val Town will give you a URL like:
   ```
   https://yourusername-buildingstatusconfig.web.val.run
   ```

### 2. Update Your Site

1. Open `index.html`
2. Find line ~747: `const CONFIG_URL = '...'`
3. Replace with your Val Town URL:
   ```javascript
   const CONFIG_URL = 'https://yourusername-buildingstatusconfig.web.val.run';
   ```
4. Commit and push to GitHub

### 3. Keep Local Config (Optional)

If you want to test locally without hitting Val Town:

1. Copy `config.example.json` to `config.json`:
   ```bash
   cp config.example.json config.json
   ```
2. Edit `config.json` with your data
3. The site has a fallback that tries `config.json` if Val Town fails

**Note:** `config.json` is gitignored, so it won't be committed to GitHub.

## How It Works

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ Fetch config
       ↓
┌─────────────────┐
│ Val Town Server │  (Private - not in GitHub)
│   CONFIG data   │
└─────────────────┘
```

- Your GitHub repo contains **only** the frontend code
- Val Town hosts the sensitive config data privately
- The site fetches config at runtime via CORS

## Updating Config

To change contact info, links, etc.:

1. Go to Val Town
2. Edit your config Val
3. Update the `CONFIG` object
4. Save - changes are live immediately (cached for 5 minutes)

## Security Notes

- Val Town URL is public, but unlisted (not searchable)
- Still visible to anyone who views page source
- Good enough to keep scrapers away and out of git history
- For higher security, add authentication token to Val Town endpoint

## Files

- `config.example.json` - Template (committed to GitHub)
- `config.json` - Your local copy (gitignored)
- `valtown-config-server.js` - Val Town code (gitignored)
- `.gitignore` - Protects sensitive files

## Troubleshooting

**Config not loading:**
- Check browser console for errors
- Verify Val Town URL is correct in `index.html`
- Check Val Town logs for errors
- Try the fallback: create local `config.json`

**CORS errors:**
- Val Town should handle CORS automatically
- Check the CORS headers in `valtown-config-server.js`
- You can restrict to your domain: `"Access-Control-Allow-Origin": "https://petroleumjelliffe.github.io"`
