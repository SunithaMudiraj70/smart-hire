import re
import os
from typing import Dict, List, Any

# Common high-value tech skills for extraction
TECH_SKILLS_CORPUS = [
    "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Express",
    "FastAPI", "Flask", "Django", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "NLP", "LLM",
    "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "Pandas", "NumPy", "OpenCV",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "GitHub", "Linux",
    "REST API", "GraphQL", "Microservices", "Data Science", "Computer Vision",
    "Transformers", "Hugging Face", "LangChain", "LlamaIndex", "Ollama", "RAG",
    "Streamlit", "Next.js", "Tailwind CSS", "HTML5", "CSS3", "C++", "Java", "Go"
]

def extract_text_from_pdf(file_path: str) -> str:
    """Extract clean text from PDF using pdfplumber with fallback to pypdfium2 or fitz."""
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        print(f"pdfplumber failed: {e}")

    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(file_path)
        for page in pdf:
            textpage = page.get_textpage()
            text += textpage.get_text_range() + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        print(f"pdfium failed: {e}")

    try:
        import fitz
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"fitz failed: {e}")

    return text.strip()

def parse_resume_content(raw_text: str, filename: str = "resume.pdf") -> Dict[str, Any]:
    """Parse resume text into structured candidate profile."""
    # Email extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    email = email_match.group(0) if email_match else "contact@candidate.io"

    # Phone extraction
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91\s?\d{10}', raw_text)
    phone = phone_match.group(0) if phone_match else "+1 (555) 019-2834"

    # LinkedIn extraction
    linkedin_match = re.search(r'linkedin\.com/in/[\w\-]+', raw_text)
    linkedin = "https://" + linkedin_match.group(0) if linkedin_match else "https://linkedin.com"

    # Candidate Name heuristic (first 1-3 lines usually has name in uppercase or Titlecase)
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    candidate_name = "Candidate"
    for line in lines[:4]:
        # Filter out email, phone, urls
        if "@" in line or "http" in line or "linkedin" in line or len(line) > 50:
            continue
        cleaned = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        if len(cleaned.split()) in [2, 3] and not any(kw in cleaned.lower() for kw in ["resume", "curriculum", "vitae", "summary", "profile"]):
            candidate_name = cleaned.title()
            break

    # If filename has name, use that as alternative fallback
    if candidate_name == "Candidate" and "resume" not in filename.lower():
        base = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
        candidate_name = re.sub(r'[^a-zA-Z\s]', '', base).strip().title()

    # Skill extraction
    found_skills = set()
    text_lower = raw_text.lower()
    for skill in TECH_SKILLS_CORPUS:
        # Regex word boundary check
        pattern = r'(?i)\b' + re.escape(skill) + r'\b'
        if re.search(pattern, raw_text):
            found_skills.add(skill)

    # Years of experience heuristic
    exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience', text_lower)
    if exp_matches:
        years_exp = max([int(m) for m in exp_matches if int(m) < 40], default=3)
    else:
        # Count year ranges like 2021-2024
        year_ranges = re.findall(r'(20\d\d)\s*[-–]\s*(20\d\d|present)', text_lower)
        years_exp = len(year_ranges) * 2 if year_ranges else 3

    # Education heuristics
    education = []
    if "bachelor" in text_lower or "b.tech" in text_lower or "b.e" in text_lower or "b.s." in text_lower:
        education.append("Bachelor of Technology / Science")
    if "master" in text_lower or "m.tech" in text_lower or "m.s." in text_lower:
        education.append("Master of Science / Technology")
    if not education:
        education.append("Higher Technical Degree")

    # Target role inference based on skills
    target_roles = []
    if any(s in found_skills for s in ["Machine Learning", "Deep Learning", "PyTorch", "NLP", "LLM"]):
        target_roles.append("AI / Machine Learning Engineer")
    if any(s in found_skills for s in ["React", "TypeScript", "Node.js", "Express", "FastAPI"]):
        target_roles.append("Full Stack Developer")
    if any(s in found_skills for s in ["Pandas", "NumPy", "SQL", "Scikit-Learn"]):
        target_roles.append("Data Scientist / ML Analyst")
    if not target_roles:
        target_roles.append("Senior Software Engineer")

    return {
        "candidate_id": f"CAN-{abs(hash(candidate_name)) % 90000 + 10000}",
        "name": candidate_name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "location": "Hyderabad, India" if "hyderabad" in text_lower else "Remote / Global",
        "years_experience": years_exp,
        "education": education,
        "skills": sorted(list(found_skills)),
        "target_roles": target_roles,
        "raw_text_length": len(raw_text),
        "summary": lines[1:5] if len(lines) > 5 else ["Skilled engineering professional with hands-on technical proficiency."]
    }

def get_default_candidate() -> Dict[str, Any]:
    """Default profile for guest/demo experience using Alex Thomas."""
    return {
        "candidate_id": "CAN-89201",
        "name": "Alex Thomas",
        "email": "alex@gmail.com",
        "phone": "+91 98765 43210",
        "linkedin": "https://www.linkedin.com/in/alexthomas",
        "location": "Bengaluru, Karnataka, India",
        "years_experience": 2,
        "education": ["Bachelor of Technology in Computer Science"],
        "skills": [
            "Python", "FastAPI", "React", "SQL", "PostgreSQL",
            "Docker", "Git", "REST API", "Machine Learning"
        ],
        "target_roles": ["Software Engineer", "Backend Developer", "Full Stack Engineer"],
        "filename": "Alex_Thomas_Resume.pdf",
        "summary": [
            "Software Engineer specializing in Python, scalable web services, and modern cloud stacks.",
            "Experienced in building high-throughput REST APIs, data workflows, and responsive web applications."
        ]
    }
