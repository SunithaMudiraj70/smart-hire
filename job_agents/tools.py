from ddgs import DDGS

def web_search(query, max_results=5):

    results = []

    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            results.append({
                "title": r["title"],
                "body": r["body"],
                "link": r["href"]
            })

    return results