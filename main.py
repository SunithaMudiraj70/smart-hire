from tools.resume_parser import parse_resume
from job_agents.job_search_agent import search_jobs
from job_agents.matcher_agent import match_jobs
from job_agents.apply_agent import apply_to_jobs
from job_agents.monitor_agent import monitor_jobs
from job_agents.hr_reply_agent import reply_to_hr
from job_agents.cover_agent import improve_resume
import config
from job_agents.interview_agent import generate_interview_questions

print("AI JOB HUNTER AGENT")

import os
resume_path = "data/Alex_Thomas_Resume.pdf"
resume = parse_resume(resume_path) if os.path.exists(resume_path) else {"skills": ["Python", "SQL", "React"]}

print("Improving Resume...")

resume = improve_resume(resume)

skill = config.JOB_SEARCH_KEYWORD

print("Searching jobs posted within last 24 hours...")

jobs = search_jobs(skill)

matched_jobs = match_jobs(jobs, resume)

apply_to_jobs(matched_jobs, resume)

reply_to_hr()

monitor_jobs(skill, resume)
if jobs:

    questions = generate_interview_questions(jobs[0]["description"])

    print("Interview Questions")

    print(questions)

monitor_jobs(skill, resume)