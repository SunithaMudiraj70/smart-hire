import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, JobPosting

logger = logging.getLogger("smart_hire.digest")

def send_daily_email_digest():
    """
    Constructs and sends a daily digest of top new jobs to users with email_digest enabled.
    Falls back to dry-run structured logging if SMTP is not configured.
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()
        include_demo = os.environ.get("SEED_DEMO", "false").lower() == "true"
        job_q = db.query(JobPosting).filter(
            JobPosting.is_active == True,
            JobPosting.link_status != "broken",
            JobPosting.report_count < 3
        )
        if not include_demo:
            job_q = job_q.filter(JobPosting.is_demo == False)

        recent_jobs = job_q.order_by(JobPosting.first_seen_at.desc()).limit(10).all()
        if not recent_jobs:
            return

        smtp_host = os.environ.get("SMTP_HOST")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ.get("SMTP_USER")
        smtp_pass = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", "notifications@smart-hire.app")

        for user in users:
            settings = user.settings
            if settings and not settings.email_digest:
                continue

            user_skills = set(s.lower() for s in (user.profile.skills if user.profile else []))
            matched_items = []
            for j in recent_jobs:
                overlap = user_skills.intersection(set(s.lower() for s in (j.skills or [])))
                matched_items.append((j, len(overlap)))

            matched_items.sort(key=lambda x: x[1], reverse=True)
            top_picks = [item[0] for item in matched_items[:5]]

            body_lines = [
                f"Hello {user.name},",
                "",
                "Here is your smart-hire daily job digest of newly posted verified positions:",
                ""
            ]

            for job in top_picks:
                body_lines.append(f"• {job.title} at {job.company} ({job.location})")
                body_lines.append(f"  Salary: {job.salary} | Source: {job.source}")
                body_lines.append(f"  Apply: {job.apply_url}")
                body_lines.append("")

            body_lines.append("To manage your email preferences or unsubscribe, visit http://localhost:3000/app/settings")
            email_text = "\n".join(body_lines)

            if smtp_host and smtp_user and smtp_pass:
                try:
                    msg = MIMEMultipart()
                    msg["Subject"] = f"smart-hire Daily Digest: {len(top_picks)} New Matches"
                    msg["From"] = smtp_from
                    msg["To"] = user.email
                    msg.attach(MIMEText(email_text, "plain"))

                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_pass)
                        server.send_message(msg)
                    logger.info(f"Daily digest sent to {user.email}")
                except Exception as e:
                    logger.warning(f"Failed to send email to {user.email}: {e}")
            else:
                # Dry-run logging
                logger.info(f"[Dry-Run Email Digest] To: {user.email} | Top jobs: {[j.title for j in top_picks]}")

    finally:
        db.close()

