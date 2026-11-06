import imaplib
import email
from config import EMAIL_ADDRESS, EMAIL_PASSWORD


def read_emails():

    mail = imaplib.IMAP4_SSL("imap.gmail.com")

    mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

    mail.select("inbox")

    status, messages = mail.search(None, "UNSEEN")

    email_ids = messages[0].split()

    emails = []

    for eid in email_ids:

        _, msg_data = mail.fetch(eid, "(RFC822)")

        msg = email.message_from_bytes(msg_data[0][1])

        subject = msg["subject"]
        sender = msg["from"]

        emails.append({
            "subject": subject,
            "sender": sender
        })

    return emails