import pytest
from backend.skills_extractor import clean_skills, extract_skills_from_text, CANONICAL_SKILLS, JUNK_SKILLS

def test_clean_skills_rejects_junk_tokens():
    raw = ["Other", "dev", "Ai", "ops", "Python", "SQL", "tech", "Hiring"]
    cleaned = clean_skills(raw)
    assert "Other" not in cleaned
    assert "dev" not in cleaned
    assert "ops" not in cleaned
    assert "tech" not in cleaned
    assert "Hiring" not in cleaned
    assert "Python" in cleaned
    assert "SQL" in cleaned
    # "Ai" should be normalized to canonical "AI", not left as "Ai"
    assert "AI" in cleaned
    assert "Ai" not in cleaned

def test_canonical_casing_enforced():
    raw = ["python", "javascript", "react", "docker", "aws", "postgresql", "node.js"]
    cleaned = clean_skills(raw)
    assert "Python" in cleaned
    assert "JavaScript" in cleaned
    assert "React" in cleaned
    assert "Docker" in cleaned
    assert "AWS" in cleaned
    assert "PostgreSQL" in cleaned
    assert "Node.js" in cleaned

def test_extract_skills_from_text():
    text = "We are seeking a Backend Software Engineer with strong experience in Python, FastAPI, Docker, and PostgreSQL on AWS."
    extracted = extract_skills_from_text(text)
    assert "Python" in extracted
    assert "FastAPI" in extracted
    assert "Docker" in extracted
    assert "PostgreSQL" in extracted
    assert "AWS" in extracted
    # Junk should never be in extracted
    for junk in JUNK_SKILLS:
        assert junk not in [s.lower() for s in extracted]

def test_default_candidate_has_no_developer_name():
    from backend.resume_service import get_default_candidate
    candidate = get_default_candidate()
    assert candidate["name"] == "Alex Thomas"
    assert candidate["email"] == "alex@gmail.com"
    assert "Mudiraj" not in candidate["name"]
    assert "Sunitha" not in candidate["name"]
    assert "Sunitha" not in candidate["email"]

