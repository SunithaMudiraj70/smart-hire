import re
from typing import Dict, List, Any

def calculate_rule_based_match(candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    """Fast, deterministic matching score based on skill overlap and role alignment."""
    candidate_skills = set(s.lower() for s in candidate.get("skills", []))
    
    job_text = f"{job.get('title', '')} {job.get('description', '')} {' '.join(job.get('skills', []))}".lower()
    
    # Identify required skills from job
    matched_skills = []
    missing_skills = []
    
    # Check candidate skills in job
    for skill in candidate.get("skills", []):
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', job_text):
            matched_skills.append(skill)
            
    # Check job declared skills that candidate might miss
    for skill in job.get("skills", []):
        if skill.lower() not in candidate_skills:
            missing_skills.append(skill)
            
    # Title alignment bonus
    title_score = 0
    candidate_roles = [r.lower() for r in candidate.get("target_roles", [])]
    job_title = job.get("title", "").lower()
    for role in candidate_roles:
        # Check token overlaps
        role_tokens = set(role.split())
        title_tokens = set(job_title.split())
        common = role_tokens.intersection(title_tokens)
        if len(common) >= 1:
            title_score = max(title_score, 25)
        if len(common) >= 2:
            title_score = max(title_score, 40)
            
    # Base calculation
    total_relevant = len(matched_skills) + len(missing_skills)
    skill_ratio = (len(matched_skills) / max(total_relevant, 1)) if total_relevant > 0 else 0.5
    
    # Combined score
    score = int(skill_ratio * 60 + title_score)
    # Guarantee reasonable bounds
    score = max(min(score, 98), 45 if len(matched_skills) > 0 else 25)
    
    fit_level = "Exceptional Fit" if score >= 85 else ("Strong Fit" if score >= 70 else ("Moderate Fit" if score >= 50 else "Growth Opportunity"))
    
    rationale = f"Candidate possesses {len(matched_skills)} core target skills ({', '.join(matched_skills[:3]) or 'foundational tech'}) aligning directly with {job.get('company')} requirements."
    
    return {
        "score": score,
        "fit_level": fit_level,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills[:4],
        "rationale": rationale
    }

def analyze_match_with_ollama(candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    """Optional deep LLM analysis using local Ollama llama3."""
    base = calculate_rule_based_match(candidate, job)
    try:
        import ollama
        prompt = f"""
        Analyze candidate fit for the following job:
        Candidate: {candidate.get('name')}, Skills: {', '.join(candidate.get('skills', []))}, Experience: {candidate.get('years_experience')} years
        Job: {job.get('title')} at {job.get('company')}
        Description: {job.get('description', '')[:400]}

        In 2 sentences, explain the candidate's exact fit and highlight their strongest asset for this role.
        """
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3}
        )
        llm_rationale = response["message"]["content"].strip()
        if llm_rationale:
            base["rationale"] = llm_rationale
    except Exception as e:
        print(f"Ollama matching skipped/fallback: {e}")
        
    return base

def match_candidate_to_jobs(candidate: Dict[str, Any], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Score and attach match metadata to each job."""
    scored_jobs = []
    for job in jobs:
        match_info = calculate_rule_based_match(candidate, job)
        enriched = dict(job)
        enriched["match"] = match_info
        scored_jobs.append(enriched)
        
    # Sort descending by match score
    scored_jobs.sort(key=lambda j: j["match"]["score"], reverse=True)
    return scored_jobs
