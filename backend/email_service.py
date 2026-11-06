"""
smart-hire Email Service
Sends transactional notifications and daily job digests using the Resend HTTP API.
Falls back to dry-run logging when RESEND_API_KEY is not configured (e.g. in development or testing).
Zero SMTP dependencies.
"""

import os
import logging
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger("smart_hire.email")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
RESEND_FROM = os.environ.get("RESEND_FROM", "smart-hire <notifications@smart-hire.app>").strip()
RESEND_ENDPOINT = "https://api.resend.com/emails"

def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an email using the Resend HTTP API.
    If RESEND_API_KEY is missing or empty, logs the message in dry-run mode.
    """
    api_key = os.environ.get("RESEND_API_KEY", "").strip() or RESEND_API_KEY
    sender = os.environ.get("RESEND_FROM", "").strip() or RESEND_FROM

    if not api_key:
        snippet = html_content[:150].replace("\n", " ")
        logger.info(
            f"[RESEND DRY-RUN] Would send email to: {to_email} | "
            f"Subject: '{subject}' | Snippet: {snippet}..."
        )
        return {
            "status": "dry_run",
            "message": "Email logged in dry-run mode (RESEND_API_KEY is not configured)",
            "to": to_email,
            "subject": subject
        }

    payload: Dict[str, Any] = {
        "from": sender,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }
    if text_content:
        payload["text"] = text_content

    try:
        response = httpx.post(
            RESEND_ENDPOINT,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        if response.status_code in (200, 201):
            data = response.json()
            email_id = data.get("id", "ok")
            logger.info(f"[RESEND SUCCESS] Sent email to {to_email} (ID: {email_id})")
            return {"status": "sent", "id": email_id, "to": to_email}
        else:
            logger.error(
                f"[RESEND ERROR] Failed to send email to {to_email} ({response.status_code}): {response.text}"
            )
            return {
                "status": "error",
                "code": response.status_code,
                "error": response.text,
                "to": to_email
            }
    except Exception as e:
        logger.error(f"[RESEND EXCEPTION] Exception sending email to {to_email}: {e}", exc_info=True)
        return {"status": "error", "error": str(e), "to": to_email}

def send_candidate_job_digest(
    user_email: str,
    user_name: str,
    top_jobs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Constructs and sends a curated job digest email to a candidate.
    """
    greeting = f"Hi {user_name or 'there'},"
    job_items_html = ""
    for j in top_jobs[:5]:
        title = j.get("title", "Position")
        company = j.get("company", "Company")
        location = j.get("location", "India")
        apply_url = j.get("apply_url") or j.get("link") or "#"
        score = j.get("match", {}).get("score", 0) if isinstance(j.get("match"), dict) else 0

        job_items_html += f"""
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #1e293b;">{title}</h3>
            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">{company} &bull; {location} {f'&bull; <strong>{score}% match</strong>' if score else ''}</p>
            <a href="{apply_url}" target="_blank" style="display: inline-block; padding: 6px 12px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">View Position &rarr;</a>
        </div>
        """

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4f46e5; margin-top: 0;">smart-hire Daily Job Intelligence</h2>
        <p style="color: #334155; font-size: 15px;">{greeting}</p>
        <p style="color: #475569; font-size: 14px;">Here are today's top curated opportunities aligned with your verified profile skills:</p>
        <div style="margin: 20px 0;">
            {job_items_html}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            You received this because you enabled Daily Email Digest in your smart-hire account settings.
        </p>
    </div>
    """

    subject = f"⚡ Your smart-hire Daily Job Matches ({len(top_jobs[:5])} new opportunities)"
    return send_email(to_email=user_email, subject=subject, html_content=html)
