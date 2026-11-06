import ollama
from config import OLLAMA_MODEL


def generate_cover_letter(resume,job):

    prompt=f"""
    Write a professional cover letter.

    Resume:
    {resume}

    Job Title:
    {job['title']}

    Company:
    {job['company']}
    """

    response=ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response["message"]["content"]