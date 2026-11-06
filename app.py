import streamlit as st
import os
import sys
import json
import time

# Ensure workspace root in path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.resume_service import get_default_candidate, parse_resume_content, extract_text_from_pdf
from backend.search_engine import search_multi_source_jobs
from backend.matching_engine import match_candidate_to_jobs
from backend.application_engine import simulate_automated_application, generate_tailored_cover_letter

st.set_page_config(page_title="TalentFlow B2B AI", layout="wide", page_icon="⚡")

# Custom Styling
st.markdown("""
<style>
    .main { background-color: #0b0f19; color: #f3f4f6; }
    .stButton>button { width: 100%; border-radius: 8px; font-weight: 600; }
    .kpi-metric { background: #111827; border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 10px; text-align: center; }
    .portal-banner { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 14px 20px; border-radius: 10px; color: white; margin-bottom: 20px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
</style>
""", unsafe_allow_html=True)

# Top Banner
st.markdown("""
<div class="portal-banner">
    <div>⚡ TalentFlow Enterprise B2B Engine Active</div>
    <div><a href="http://localhost:8000" target="_blank" style="color: #fde047; text-decoration: underline;">Launch Dedicated B2B Web App (Port 8000) ↗</a></div>
</div>
""", unsafe_allow_html=True)

st.title("⚡ TalentFlow B2B: Autonomous Job Acquisition Suite")

# Initialize Session State
if "candidate" not in st.session_state:
    st.session_state.candidate = get_default_candidate()
if "jobs" not in st.session_state:
    st.session_state.jobs = []
if "applied" not in st.session_state:
    st.session_state.applied = []

# Sidebar: Candidate Profile & Resume Dropzone
with st.sidebar:
    st.header("🏢 B2B Candidate Cohort")
    uploaded_file = st.file_uploader("Drop Candidate Resume (PDF)", type=["pdf", "txt"])
    if uploaded_file is not None:
        save_path = os.path.join(BASE_DIR, "data", uploaded_file.name)
        with open(save_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        raw_text = extract_text_from_pdf(save_path) if uploaded_file.name.endswith(".pdf") else uploaded_file.getvalue().decode()
        st.session_state.candidate = parse_resume_content(raw_text, uploaded_file.name)
        st.success(f"Loaded: {st.session_state.candidate['name']}")

    cand = st.session_state.candidate
    st.subheader(cand.get("name", "Candidate"))
    st.caption(f"📧 {cand.get('email')} | 📍 {cand.get('location')}")
    st.caption(f"🎯 Target: {', '.join(cand.get('target_roles', []))}")
    st.write("**Extracted Skills:**")
    st.write(", ".join(cand.get("skills", [])[:10]))

# Search Parameters
col1, col2, col3 = st.columns([3, 1, 1])
with col1:
    query = st.text_input('Boolean Search Expression', '("Machine Learning" OR "AI") AND "Python"')
with col2:
    location = st.text_input('Location', 'Remote')
with col3:
    min_score = st.slider('Min Fit %', 40, 95, 50)

if st.button("🚀 Execute Boolean Job Search & Match", type="primary"):
    with st.spinner("Scraping multi-source job feeds (RemoteOK, DuckDuckGo, Curated B2B)..."):
        discovered = search_multi_source_jobs(query=query, location=location, sources=["curated", "remoteok", "ddgs"])
        matched = match_candidate_to_jobs(st.session_state.candidate, discovered)
        st.session_state.jobs = [j for j in matched if j.get("match", {}).get("score", 0) >= min_score]
        st.success(f"Discovered {len(discovered)} jobs. {len(st.session_state.jobs)} passed the {min_score}% match threshold!")

# Results
if st.session_state.jobs:
    st.subheader(f"Discovered Qualified Positions ({len(st.session_state.jobs)})")
    for job in st.session_state.jobs:
        score = job.get("match", {}).get("score", 80)
        with st.container():
            c1, c2 = st.columns([4, 1])
            with c1:
                st.markdown(f"### {job['title']} — `{job['company']}`")
                st.caption(f"📍 {job.get('location')} | 🏷️ {job.get('source')} | 💰 {job.get('salary')}")
                st.write(job.get("description", "")[:250] + "...")
                st.info(f"**AI Fit Rationale:** {job.get('match', {}).get('rationale')}")
            with c2:
                st.metric("Fit Score", f"{score}%")
                if st.button(f"🤖 Auto-Apply", key=f"apply_{job['id']}"):
                    rec = simulate_automated_application(st.session_state.candidate, job)
                    st.session_state.applied.append(rec)
                    st.success("Applied! Receipt logged.")
            st.divider()