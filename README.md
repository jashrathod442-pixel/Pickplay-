# PickPlay v4 — Complete Ready-to-Deploy Package

## You only need to do 3 things. That's it.

---

## STEP 1 — Set up the database (10 minutes)

1. Open this website: **https://supabase.com**
2. Click "Start your project" → Sign up with Google
3. Click "New project" → Name it `pickplay` → Choose region: **Southeast Asia (Singapore)** → Set a password → Click "Create new project" → Wait 2 minutes
4. Click **SQL Editor** in the left menu
5. Open the file `backend/database_setup.sql` from this package → Copy ALL the text inside it → Paste into Supabase SQL Editor → Click **Run**
6. You will see "Success". Your database is ready.
7. Click **Settings** (gear icon, bottom left) → Click **API**
8. Copy and save these two things somewhere safe:
   - **Project URL** (looks like: `https://abcxyz.supabase.co`)
   - **service_role** key (the long text starting with `eyJ...`)

---

## STEP 2 — Deploy the backend (5 minutes)

1. Open this website: **https://railway.app**
2. Click "Start a New Project" → Sign up with GitHub
3. Click "Deploy from GitHub repo"
   - If you haven't uploaded to GitHub yet: go to https://github.com → New repository → name it `pickplay-backend` → upload all files from the `backend/` folder
4. Select your `pickplay-backend` repository
5. Wait for it to deploy (1-2 minutes)
6. Click the **Variables** tab → Add these 3 variables one by one:

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | Your Project URL from Step 1 |
   | `SUPABASE_SERVICE_KEY` | Your service_role key from Step 1 |
   | `JWT_SECRET` | `PickPlay_Secret_2026` |

7. Railway will restart. After it finishes, click **Settings** tab → Under **Domains** → click **Generate Domain**
8. Copy your Railway URL — it looks like: `https://pickplay-backend-production.up.railway.app`
9. Test it: paste your Railway URL + `/health` in Chrome browser. You should see: `{"status":"PickPlay API is running ✅"}`

---

## STEP 3 — Deploy the frontend (2 minutes)

1. Open the file `frontend/index.html` in any text editor (Notepad is fine)
2. Press Ctrl+F → search for: `pickplay-api.up.railway.app`
3. Replace it with your actual Railway URL from Step 2
4. Save the file
5. Open this website: **https://netlify.com**
6. Sign up → On the dashboard, drag and drop the entire `frontend/` folder into the browser window
7. Netlify gives you a URL like: `https://amazing-pickle-abc123.netlify.app`

**That's your live app URL. Share it with anyone.**

---

## What you get

- ✅ Real user accounts (sign up, log in, profile)
- ✅ Court booking with slot locking (no double bookings)
- ✅ Tournament creation and registration
- ✅ Friend system (add friends, accept requests)
- ✅ Notifications (booking confirmations, friend requests)
- ✅ Owner dashboard (revenue, bookings, analytics)
- ✅ Multi-sport (Pickleball, Cricket, Badminton, Tennis)
- ✅ Dark/Light/System theme
- ✅ 10 demo courts pre-loaded across India
- ✅ Works as PWA (installable on phones from Chrome)

---

## Files in this package

```
pickplay_final/
├── frontend/
│   ├── index.html          ← Your complete app (open this in any browser)
│   └── netlify.toml        ← Tells Netlify how to serve it
└── backend/
    ├── server.js           ← The complete API (19 routes)
    ├── package.json        ← Lists all dependencies
    ├── .env.example        ← Template for your secret keys
    └── database_setup.sql  ← Run this once in Supabase
```

---

## Cost

| Service | Free tier |
|---------|-----------|
| Supabase | 500MB database, unlimited API calls |
| Railway | $5 credit/month (enough for low traffic) |
| Netlify | Unlimited sites, 100GB bandwidth/month |
| **Total** | **₹0** |

---

## Owner credentials (demo — change after launch)

- Email: `owner@pickplay.in`
- Password: `owner1234`

---

## Support

If Railway asks for a credit card for verification, use Render.com instead (same steps, also free).
