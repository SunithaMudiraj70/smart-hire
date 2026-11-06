# Deploying smart-hire on Render (Step-by-Step Guide)

This guide walks you through deploying **smart-hire** on [Render](https://render.com) using the included Infrastructure-as-Code Blueprint specification (`render.yaml`).

---

## Architecture Overview

The Render Blueprint provisions a production-ready, highly available architecture designed to run **100% within Render's Free Tier**:

```
                       +-------------------------------+
                       |                               |
                       |   smart-hire-web (Static)     |
                       |   React + Vite SPA on CDN     |
                       |   (Free, Unlimited Bandwidth) |
                       +---------------+---------------+
                                       |
                                       | API Requests (HTTPS)
                                       v
                       +-------------------------------+
                       |                               |
                       |   smart-hire-api (Web)        |
                       |   FastAPI + Uvicorn (Python)  |
                       |   Healthcheck at /api/health  |
                       +---------------+---------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+-------------------------------+       +-------------------------------+
|                               |       |                               |
|   smart-hire-postgres (DB)    |       |   Job Ingestion Runner        |
|   PostgreSQL 16 Managed DB    |       |   APScheduler (In-Process)    |
|   (Render Free Tier)          |       |   RUN_SCHEDULER_IN_API=true   |
+-------------------------------+       +-------------------------------+
```

---

## Prerequisites

1. A [Render account](https://render.com) (free to sign up).
2. Your repository pushed to GitHub or GitLab.

---

## Method 1: Deploy with Render Blueprint (Recommended)

1. **Log in to Render Dashboard:**
   - Go to [dashboard.render.com](https://dashboard.render.com/).

2. **Create New Blueprint Instance:**
   - Click **New +** in the top right corner.
   - Select **Blueprint**.

3. **Connect Your Git Repository:**
   - Choose your repository containing `smart-hire` (e.g., `github.com/your-username/smart-hire`).
   - Branch: `master` or `main`.

4. **Review Resources:**
   Render will parse `render.yaml` and display the resources it will create:
   - **smart-hire-postgres**: Managed PostgreSQL Database (Free tier).
   - **smart-hire-api**: Python 3.11 Web Service (FastAPI).
   - **smart-hire-web**: Static Site (React + Vite).

5. **Click "Apply":**
   - Render automatically provisions the database, wires up the `DATABASE_URL` and `VITE_API_URL` environment variables, generates a cryptographically secure `JWT_SECRET_KEY`, runs `npm run build`, and starts the services.

---

## Method 2: Deploying via Docker Containers

If you prefer deploying with Docker containers:
1. In the Render Dashboard, create a Blueprint and set the Blueprint path to:
   ```
   render-docker.yaml
   ```
2. Render will build `Dockerfile.api` and `Dockerfile.web` automatically.

---

## Optional Environment Variables (Add via Render Dashboard)

Go to **smart-hire-api** -> **Environment** to add optional external integration keys:

| Variable | Description |
|---|---|
| `RAPID_API_KEY` | RapidAPI key for real-time JSearch / LinkedIn / Indeed job feeds |
| `RAPIDAPI_HOST` | `jsearch.p.rapidapi.com` |
| `ADZUNA_APP_ID` | Adzuna India API App ID |
| `ADZUNA_APP_KEY` | Adzuna India API App Key |
| `REDIS_URL` | Optional Redis URL for distributed caching (e.g., Upstash or Redis Cloud) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g. `https://smart-hire-web.onrender.com`) |

---

## Verifying the Deployment

1. **Backend Health Check:**
   Visit your API URL:
   ```
   https://smart-hire-api.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "app": "smart-hire",
     "tagline": "Find the right job without scrolling every portal.",
     "users_registered": 0,
     "active_jobs_indexed": 150,
     "timestamp": "2026-11-06T12:00:00"
   }
   ```

2. **Frontend Web UI:**
   Visit your static site URL:
   ```
   https://smart-hire-web.onrender.com
   ```
   - The landing page, candidate search, filters, and tracker will load instantly.
   - Register a candidate account and test saving/applying to jobs.

---

## Important Render Free Tier Tips

1. **Zero Cold-Start on Static Site:**
   - The frontend is served via Render's global CDN and never goes to sleep.
2. **Web Service Spin-Down:**
   - On the Free plan, Render's backend web service spins down after 15 minutes of inactivity. The first request after sleep takes ~30-50 seconds to warm up. For instant 24/7 responsiveness, you can upgrade the Web Service to the **Starter Plan** ($7/month).
3. **Free Database Lifecycle:**
   - Render free PostgreSQL databases expire after 90 days. For long-term production, upgrade the DB to Starter ($7/month) or point `DATABASE_URL` to a free persistent [Supabase](https://supabase.com) PostgreSQL instance.

