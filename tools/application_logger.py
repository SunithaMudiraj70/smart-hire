def log_application(job):

    title = job.get("title", "Unknown Title")
    company = job.get("company", "Unknown Company")
    link = job.get("link", "No Link")

    with open("applied_jobs.txt", "a", encoding="utf-8") as f:

        f.write(f"{title} | {company} | {link}\n")

    print("Application logged.")