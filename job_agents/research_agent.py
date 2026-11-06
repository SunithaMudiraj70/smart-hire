from agent.llm import ask_llm
from agent.tools import web_search


def research(question):

    print("\n🔎 Searching internet...\n")

    search_results = web_search(question)

    context = ""

    for r in search_results:
        context += f"""
Title: {r['title']}
Summary: {r['body']}
Source: {r['link']}

"""

    prompt = f"""
You are an AI research assistant.

Use the following search results to answer the question.

Search Data:
{context}

Question:
{question}

Provide a well structured explanation with headings.
"""

    answer = ask_llm(prompt)

    return answer