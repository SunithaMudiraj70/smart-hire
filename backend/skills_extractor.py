"""
Clean, canonical skill extraction and normalization for smart-hire.
Ensures junk tokens ('Other', 'Ai', 'dev', etc.) never appear as skills,
and guarantees canonical casing (AI, SQL, Python, JavaScript, React, Node.js, AWS, Docker).
"""

import re
from typing import Iterable, List, Optional, Set

CANONICAL_SKILLS = {
    # Languages
    "python": "Python",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    ".net": ".NET",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",

    # Web & Frameworks
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express",
    "express.js": "Express",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring",
    "spring boot": "Spring Boot",
    "vue": "Vue",
    "vue.js": "Vue",
    "angular": "Angular",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "tailwind": "Tailwind",
    "tailwind css": "Tailwind",
    "tailwindcss": "Tailwind",
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "graphql": "GraphQL",
    "rest api": "REST API",
    "rest apis": "REST API",
    "rest": "REST API",

    # Databases & Storage
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "cassandra": "Cassandra",
    "sqlite": "SQLite",
    "elasticsearch": "Elasticsearch",

    # Cloud & DevOps
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "ci/cd": "CI/CD",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "terraform": "Terraform",
    "linux": "Linux",
    "kafka": "Kafka",
    "rabbitmq": "RabbitMQ",

    # AI, ML, Data
    "ai": "AI",
    "artificial intelligence": "AI",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "llm": "LLM",
    "llms": "LLM",
    "genai": "Generative AI",
    "generative ai": "Generative AI",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "data science": "Data Science",
    "rag": "RAG",
    "langchain": "LangChain",
}

# Junk or noisy tokens that must never be treated as valid skills
JUNK_SKILLS: Set[str] = {
    "other", "others", "dev", "ops", "tech", "software", "engineer", "engineering",
    "developer", "senior", "junior", "intern", "lead", "remote", "fulltime", "full-time",
    "parttime", "part-time", "contract", "jobs", "hiring", "team", "growth",
    "product", "design", "sales", "marketing", "non-tech", "hr", "finance", "admin",
    "sys admin", "system admin", "management", "recruiter", "talent", "worldwide",
    "india", "bangalore", "delhi", "mumbai", "hyderabad", "pune", "chennai", "kolkata",
    "gurgaon", "noida", "any", "all", "nan", "none", "null", "undefined", "true", "false",
    "general", "misc", "miscellaneous", "various", "test", "testing"
}

def clean_skills(skills: Optional[Iterable[str]]) -> List[str]:
    """
    Given a list or iterable of raw skill strings, filter out junk tokens,
    normalize canonical casing, and deduplicate preserving order.
    """
    if not skills:
        return []

    cleaned: List[str] = []
    seen: Set[str] = set()

    for raw in skills:
        if not raw or not isinstance(raw, str):
            continue
        token = raw.strip()
        lower = token.lower()

        # Reject pure numbers, single characters (except R or C), or junk words
        if lower in JUNK_SKILLS or len(token) < 2 and lower not in {"r", "c"}:
            continue
        if lower.isdigit():
            continue

        # Look up canonical casing
        if lower in CANONICAL_SKILLS:
            canonical = CANONICAL_SKILLS[lower]
        else:
            # If not in canonical list, reject if it looks like junk or casing artifact (e.g. 'Ai')
            if lower == "ai":
                canonical = "AI"
            elif lower == "sql":
                canonical = "SQL"
            elif lower in {"dev", "ops", "other"}:
                continue
            elif len(token) <= 4 and token.isupper():
                canonical = token
            else:
                canonical = token.title()

        if canonical.lower() not in seen and canonical.lower() not in JUNK_SKILLS:
            seen.add(canonical.lower())
            cleaned.append(canonical)

    return cleaned

def extract_skills_from_text(text: str) -> List[str]:
    """
    Scans freeform text (job description, title, resume) for known technical skills.
    Uses regex word boundaries to avoid false positives.
    """
    if not text or not isinstance(text, str):
        return []

    found = []
    seen = set()
    text_lower = text.lower()

    # Prioritize multi-word matches first (e.g. "machine learning", "spring boot")
    sorted_skills = sorted(CANONICAL_SKILLS.keys(), key=lambda k: -len(k))

    for skill_key in sorted_skills:
        # Check if skill key is banned as standalone junk
        if skill_key in JUNK_SKILLS:
            continue

        # Build regex boundary pattern
        if skill_key in {"c++", "c#"}:
            pattern = re.escape(skill_key) + r"(?!\w)"
        elif skill_key == ".net":
            pattern = r"(?<!\w)\.net(?!\w)"
        else:
            pattern = r"\b" + re.escape(skill_key) + r"\b"

        if re.search(pattern, text_lower):
            canonical = CANONICAL_SKILLS[skill_key]
            if canonical.lower() not in seen and canonical.lower() not in JUNK_SKILLS:
                seen.add(canonical.lower())
                found.append(canonical)

    return found[:10]

