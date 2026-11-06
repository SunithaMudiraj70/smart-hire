import ollama


def generate_interview_questions(job_description):

    prompt = f"""
Generate 10 interview questions based on this job.

{job_description}
"""

    response = ollama.chat(
        model="llama3",
        messages=[{"role":"user","content":prompt}]
    )

    return response["message"]["content"]