import ollama


def improve_resume(resume):

    prompt = f"""
Improve this resume for ATS systems.

Resume:
{resume}

Make it optimized for tech jobs.
"""

    response = ollama.chat(
        model="llama3",
        messages=[{"role":"user","content":prompt}]
    )

    return response["message"]["content"]