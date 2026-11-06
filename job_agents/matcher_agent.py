import ollama
from config import OLLAMA_MODEL


def match_jobs(resume,jobs):

    matched=[]

    for job in jobs:

        prompt=f"""
        Resume:
        {resume}

        Job Title:
        {job['title']}

        Is this job relevant?

        Answer YES or NO
        """

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role":"user","content":prompt}]
        )

        ans=response["message"]["content"]

        if "YES" in ans.upper():

            matched.append(job)

    print("Matched Jobs:",len(matched))

    return matched