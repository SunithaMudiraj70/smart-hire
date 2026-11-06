# ⚡ smart-hire — Job Search Intelligence
"https://smart-hire-web-5eax.onrender.com/"

> **Find the right job without scrolling every portal.**
> Real-time job search intelligence web application for freshers, early-career and working professionals across India.
> explore now!

---

## 🧭 Overview & Core Architecture

**smart-hire** replaces manual portal hopping with automated aggregation from verified Applicant Tracking Systems (ATS) and company career pages (Greenhouse, Lever, Ashby, Workable, SmartRecruiters, RemoteOK, and JSearch RapidAPI).

### Key Features
- **One Deduped Feed**: Cross-source deduplication with direct ATS apply links.
- **Fresher-First Filters**: 1-click filter for 0-1 years of experience, internships, and early-career postings.
- **Skill-Gap Matching**: Deterministic skill alignment score (>=70% green, 40-69% amber, <40% red) with "learn next" suggestions.
- **1-Click Cover Letter**: Copies a tailored 3-paragraph letter formatted for instant paste.
- **Market Pulse Strip**: Real-time ticker showing new jobs today, your high matches, and top in-demand skills.
- **Application Tracker**: Track positions through stages (`Saved`, `Applied`, `Interview`, `Offer`, `Rejected`).
- **JWT Authentication**: 15-minute access token, 7-day refresh token, bcrypt hashing, and rate limiting.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite (with PostgreSQL/Supabase readiness), Pydantic v2, PyJWT, bcrypt, pytest.
- **Frontend**: Vite + React 18 + TypeScript, React Router, TanStack Query, Axios with 401 auto-refresh interceptor, Tailwind CSS, Lucide icons.
- **Compliance Rules**: No scraping of LinkedIn, Indeed, Naukri, Internshala or Unstop; no Selenium auto-apply. Deep-links only. No misleading "auto-submit" copy.

---

## 🚀 Quick Start

### 1. Environment Configuration
Copy the template environment file:
```powershell
Copy-Item .env.example .env
```


---

### 2. Run the Servers

#### A. Start the FastAPI Backend (Port 8000)
**Windows (PowerShell):**
```powershell
.\env\Scripts\python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```
**Linux / macOS (Bash):**
```bash
./env/bin/python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```

#### B. Start the React TypeScript Frontend (Port 3000)
```powershell
npm --prefix web run dev -- --port 3000 --host 0.0.0.0
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **Note**: Visiting `http://localhost:3000` presents **only the landing page** first. The dashboard is protected behind login/signup authentication.

---



---

## 🔍 Verification Checklist

1. **Landing Page First**: Navigate to `http://localhost:3000/`. You will see the public landing page with wordmark **smart-hire**, hero CTAs, and feature cards. The candidate dashboard is not visible.
2. **Signup**: Click **"Sign up free"** (`/signup`). Register a new user with a password of at least 8 characters. You are redirected to `/app/search` with a welcome notification.
3. **Market Pulse Strip**: Review the top live ticker showing today's new jobs, your high matches, and top skill in demand.
4. **Find Jobs & Skill Match**: Search for jobs (e.g., "Python", "React", or toggle "Fresher / Junior First"). Inspect match breakdown chips.
5. **Copy Cover Letter**: Click **"Copy cover letter"** to copy your formatted 3-paragraph letter and click **"Apply on <Source> ↗"** to open the genuine ATS portal.
6. **Application Tracker**: View your tracked applications under `/app/applied` and update status to `Interview` or `Offer`.
7. **Saved Jobs**: Bookmark jobs using the ribbon icon and inspect them under `/app/saved`.
8. **Settings & Themes**: Navigate to `/app/settings` to toggle between Light, Dark, or System mode, manage job match alert toggles, or upload a resume to update extracted skills.
