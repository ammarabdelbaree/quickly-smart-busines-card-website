# Quickly — NFC Digital Business Card Platform

A full-stack NFC tag management system. Users scan an NFC tag, claim it with a printed verification code, and set up a digital profile page.

---

## Architecture

- **Backend**: Node.js + Express, hosted on any Node-compatible platform (Railway, Render, Fly.io, etc.)
- **Frontend**: React (Create React App), hosted on Vercel, Netlify, or similar
- **Database & Auth**: Supabase (Postgres + Auth)
- **Storage**: Supabase Storage (profile pics, cover photos)

---

## Setup

### 1. Clone & install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

**Backend** — copy `.env` and fill in real values:

```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=replace-with-a-long-random-string   # openssl rand -base64 48
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend** — copy `.env` and fill in real values:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_BASE_URL=https://your-backend-domain.com
```

> ⚠️ Never commit `.env` files to version control. The `.gitignore` already excludes them.

### 3. Supabase database schema

```sql
create table tags (
  id text primary key,
  is_active boolean not null default true,
  is_setup boolean not null default false,
  owner_id uuid references auth.users(id),
  verification_code text,        -- bcrypt hash; nulled after claiming
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  page_data jsonb not null default '{}'
);
```

> **Migration note**: If you previously had a `temp_code` column (plain-text code stored in DB), run:
> ```sql
> alter table tags drop column if exists temp_code;
> ```
> Verification codes are now stored **only as bcrypt hashes** and distributed out-of-band (printed on the physical NFC card).

### 4. Supabase Storage buckets

Create two public buckets in the Supabase dashboard:
- `profile-pics`
- `cover-photos`

### 5. Run locally

```bash
# Backend (http://localhost:5000)
cd backend && npm run dev

# Frontend (http://localhost:3000)
cd frontend && npm start
```

---

## How verification codes work

1. Admin creates a tag via the Admin Panel → backend generates a random 6-character code, stores only its **bcrypt hash**, and returns the plain-text code **once** in the API response.
2. Admin prints or writes that code on the physical NFC card.
3. When a user scans the card for the first time they are prompted to enter the code manually. The backend verifies it against the stored hash.
4. On successful claim, the hash is deleted from the database (`verification_code` set to `null`).

---

## Deployment checklist

- [ ] Rotate all credentials (Supabase service role key, admin secret) — treat any previously committed values as compromised
- [ ] Set `FRONTEND_URL` in backend `.env` to your real domain
- [ ] Set `REACT_APP_API_BASE_URL` in frontend `.env` to your real backend URL
- [ ] Ensure HTTPS is enforced at your hosting/CDN layer
- [ ] Run `npm run build` in `/frontend` for the production build
- [ ] (Optional) Add error monitoring (Sentry, etc.) to the backend

---

## Admin panel

Navigate to `/admin` on the frontend. Authenticate with the `ADMIN_SECRET` value.

From there you can:
- Create tags (generates and displays the one-time verification code)
- View all tags and their status
- Deactivate / reactivate / delete tags
