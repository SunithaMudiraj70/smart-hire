import ollama
from tools.email_reader import read_emails
from tools.email_sender import send_email


def reply_to_hr():

    emails = read_emails()

    for mail in emails:

        sender = mail["sender"]
        subject = mail["subject"]

        prompt = f"""
Reply professionally to HR email.

Subject:
{subject}
"""

        response = ollama.chat(
            model="llama3",
            messages=[{"role":"user","content":prompt}]
        )

        reply = response["message"]["content"]

        send_email(sender, "Re: "+subject, reply)