# Deducia — Waitlist Landing Page

A standalone static landing page for collecting waitlist signups. Designed for deployment on **GitHub Pages**.

> **This project is completely separate from the Deducia application/MVP.**  
> Its only purpose is to display the brand landing page and collect visitor email addresses.

---

## Project Structure

```
deducia-waitlist/
├── index.html          — Landing page
├── styles.css          — All styles (no build step)
├── main.js             — Form logic, validation, mobile menu
├── README.md           — This file
├── assets/
│   ├── logo.webp       — Deducia logo
│   └── logo.svg        — Logo vector source
└── fonts/
    ├── BubbledotICG-FinePos.woff2
    ├── BubbledotICG-FinePos.woff
    └── BubbledotICG-FinePos.ttf
```

## Test Locally

No build tools required. Serve the folder with any static server:

```bash
# Using Python (built-in)
cd deducia-waitlist
python -m http.server 5500

# Then open http://localhost:5500
```

Or use VS Code's Live Server extension, or any other static file server.

## Deploy to GitHub Pages

```bash
# 1. Initialize git (skip if already done)
cd deducia-waitlist
git init
git branch -M main

# 2. Stage all files
git add .

# 3. Commit
git commit -m "Deducia waitlist landing page"

# 4. Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/deducia-waitlist.git

# 5. Push
git push -u origin main
```

Then enable GitHub Pages:

1. Go to your repository on GitHub.
2. **Settings → Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Choose **`main`** branch and **`/ (root)`** folder.
5. Click **Save**.

Your site will be live at `https://YOUR_USERNAME.github.io/deducia-waitlist/`.

Optionally connect a custom domain in the same Pages settings panel.

---

## Waitlist Backend Setup

The landing page sends email signups to a configurable backend endpoint. **No API keys or secrets are stored in frontend code.**

### Step 1 — Create the Supabase table

```sql
CREATE TABLE waitlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Step 2 — Create a Supabase Edge Function

Create a Supabase Edge Function (e.g. `waitlist-signup`) that:

1. Accepts a `POST` request with `{ "email": "user@example.com" }`.
2. Inserts the email into the `waitlist` table.
3. Returns `200` on success, `409` if the email already exists.
4. Validates the email server-side.

### Step 3 — Connect the frontend

Open `main.js` and set the endpoint:

```js
const WAITLIST_ENDPOINT = "https://YOUR_PROJECT.supabase.co/functions/v1/waitlist-signup";
```

That's it. The frontend handles validation, loading states, success/error UI, and duplicate detection automatically.

### What the frontend sends

```
POST <WAITLIST_ENDPOINT>
Content-Type: application/json

{ "email": "user@example.com" }
```

- Email is trimmed and lowercased before sending.
- The form validates format client-side before any network request.
- Duplicate clicks are blocked while a request is in-flight.

### What the frontend expects back

| Status | Meaning                                   |
|--------|-------------------------------------------|
| `2xx`  | Success — email was saved                 |
| `409`  | Duplicate — email already on the waitlist |
| Other  | Error — shown as a retry-able message     |

---

## What Still Needs Configuration

Before emails can actually be stored, you need to:

1. **Create a Supabase project** (or equivalent serverless backend).
2. **Create the `waitlist` table** with the schema above.
3. **Deploy a Supabase Edge Function** that handles the POST request.
4. **Set `WAITLIST_ENDPOINT`** in `main.js` to the deployed function URL.

Until the endpoint is configured, the form will show: *"The waitlist backend isn't connected yet. Please try again later."*

---

## Security Checklist

- [x] No API keys, secrets, or service-role keys in frontend code
- [x] No database credentials exposed
- [x] Client-side email validation (format + required)
- [x] Server should validate and sanitize email independently
- [x] All asset paths are relative (GitHub Pages compatible)
- [x] No server-side dependencies (pure static site)

---

## External Dependencies

| Resource | Source | Purpose |
|----------|--------|---------|
| Inter font | Google Fonts CDN | Body typography |
| Font Awesome 6.5 | cdnjs CDN | Trust row icons |
| Background video | CloudFront CDN | Hero background |

No npm packages. No build step. No frameworks.
