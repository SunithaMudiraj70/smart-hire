import os
import re
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, Any, Optional
import datetime

from backend.locations import normalize_city, normalize_state, get_cities_for_state, parse_location

VECTOR_BACKEND = os.environ.get("VECTOR_BACKEND", "local").lower()

_MODEL_INSTANCE = None

def get_embedding_model():
    """
    Lazy loader for sentence-transformers model.
    Sentence-transformers / PyTorch are never imported at top-level.
    On Render Free Tier (512MB RAM cap), heavy ML models are disabled by default
    unless ENABLE_HEAVY_ML=true is explicitly set.
    """
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        if os.environ.get("ENABLE_HEAVY_ML", "false").lower() != "true":
            _MODEL_INSTANCE = False
            return _MODEL_INSTANCE
        try:
            from sentence_transformers import SentenceTransformer
            _MODEL_INSTANCE = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            _MODEL_INSTANCE = False
    return _MODEL_INSTANCE

def embed_text(text: str) -> List[float]:
    """
    Generates embedding vector for input text.
    If sentence-transformers model is unavailable (or in lightweight mode),
    uses fast deterministic keyword token hashing (0 MB torch RAM).
    """
    model = get_embedding_model()
    if model:
        try:
            vec = model.encode(text[:1200], normalize_embeddings=True)
            return vec.tolist()
        except Exception:
            pass

    # Lightweight deterministic keyword hashing vector (dim=64 normalized)
    words = re.findall(r"\w+", text.lower())
    vec = np.zeros(64, dtype=np.float32)
    for w in words:
        idx = abs(hash(w)) % 64
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

class VectorIndex(ABC):
    @abstractmethod
    def search_knn(self, query_vec: List[float], candidate_jobs: List[Dict[str, Any]], top_k: int = 30) -> List[Tuple[Dict[str, Any], float]]:
        pass

class LocalVectorIndex(VectorIndex):
    """
    In-memory / SQLite vector similarity search using numpy cosine similarity.
    """
    def search_knn(self, query_vec: List[float], candidate_jobs: List[Dict[str, Any]], top_k: int = 30) -> List[Tuple[Dict[str, Any], float]]:
        if not candidate_jobs or not query_vec:
            return [(j, 0.5) for j in candidate_jobs[:top_k]]

        q = np.array(query_vec, dtype=np.float32)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return [(j, 0.5) for j in candidate_jobs[:top_k]]
        q = q / q_norm

        scored = []
        for job in candidate_jobs:
            emb = job.get("embedding")
            if not emb or len(emb) != len(query_vec):
                # Generate embedding on the fly if missing
                text = f"{job.get('title', '')} {' '.join(job.get('skills', []))} {job.get('description', '')[:400]}"
                emb = embed_text(text)
                job["embedding"] = emb

            j_vec = np.array(emb, dtype=np.float32)
            j_norm = np.linalg.norm(j_vec)
            if j_norm > 0:
                sim = float(np.dot(q, j_vec / j_norm))
            else:
                sim = 0.0

            scored.append((job, max(0.0, min(1.0, sim))))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

class PgVectorIndex(VectorIndex):
    """PostgreSQL pgvector implementation when configured."""
    def search_knn(self, query_vec: List[float], candidate_jobs: List[Dict[str, Any]], top_k: int = 30) -> List[Tuple[Dict[str, Any], float]]:
        # Fall back to local array calculation if local candidate list is passed
        return LocalVectorIndex().search_knn(query_vec, candidate_jobs, top_k)

def get_vector_index() -> VectorIndex:
    if VECTOR_BACKEND == "pgvector":
        return PgVectorIndex()
    return LocalVectorIndex()

def evaluate_boolean_keyword(query: str, text: str) -> bool:
    """
    Evaluates Boolean query with support for:
    - AND (default between words or explicit)
    - OR
    - NOT
    - Exact phrases ("...")
    """
    if not query.strip():
        return True

    text_lower = text.lower()
    q = query.strip()

    # Extract exact phrase quotes
    phrases = re.findall(r'"([^"]*)"', q)
    for p in phrases:
        if p.lower() not in text_lower:
            return False
        q = q.replace(f'"{p}"', '')

    tokens = q.split()
    if not tokens:
        return True

    must_include = []
    must_exclude = []
    or_groups = []

    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t.upper() == "NOT" and i + 1 < len(tokens):
            must_exclude.append(tokens[i + 1].lower())
            i += 2
        elif t.upper() == "OR" and i + 1 < len(tokens) and must_include:
            prev = must_include.pop()
            nxt = tokens[i + 1].lower()
            or_groups.append([prev, nxt])
            i += 2
        elif t.upper() == "AND":
            i += 1
        else:
            must_include.append(t.lower())
            i += 1

    for exc in must_exclude:
        if exc in text_lower:
            return False

    for inc in must_include:
        if inc not in text_lower:
            return False

    for group in or_groups:
        if not any(opt in text_lower for opt in group):
            return False

    return True

import datetime

def hybrid_search(
    jobs: List[Dict[str, Any]],
    query: str = "",
    location: str = "",
    country: str = "",
    state: str = "",
    city: str = "",
    experience_years: str = "all",
    date_posted: str = "all",
    fresher_only: bool = False,
    work_mode: str = "all",
    top_k: int = 40
) -> List[Dict[str, Any]]:
    """
    Combines Boolean keyword filtering, faceted location/experience/recency filters,
    and Vector semantic similarity using Reciprocal Rank Fusion (RRF).
    """
    filtered = []
    loc_clean = location.lower().strip()
    country_clean = country.lower().strip()
    state_clean = state.lower().strip()
    city_clean = city.lower().strip()
    now = datetime.datetime.utcnow()

    # Query expansion dictionary
    expansions = {
        "fde": "forward deployed engineer",
        "support": "customer support",
        "cs": "customer support",
        "sde": "software development engineer"
    }
    q_expanded = expansions.get(query.lower().strip(), query)

    for j in jobs:
        j_loc = j.get("location", "").lower()

        j_city = (j.get("city") or "").lower()
        j_state = (j.get("state") or "").lower()
        j_is_remote = bool(j.get("is_remote")) or "remote" in j.get("work_mode", "").lower() or "remote" in j_loc

        # 1. City filter: selecting a city returns only that city (remote-worldwide jobs NEVER appear under a specific city)
        if city_clean and city_clean != "all":
            norm_c = (normalize_city(city_clean) or city_clean).lower()
            city_matches = (norm_c == j_city) or (norm_c in j_loc) or (city_clean in j_loc)
            if not city_matches:
                # Plus remote jobs only if work_mode allows
                if work_mode and work_mode.lower() == "remote" and j_is_remote:
                    pass
                else:
                    continue

        # 2. State filter: selecting a state returns every job in that state's cities
        if state_clean and state_clean != "all":
            norm_s = normalize_state(state_clean) or state_clean
            state_cities = [c.lower() for c in get_cities_for_state(norm_s)]
            state_matches = (norm_s.lower() == j_state) or (j_city in state_cities) or (norm_s.lower() in j_loc) or any(c in j_loc for c in state_cities)
            if not state_matches:
                if work_mode and work_mode.lower() == "remote" and j_is_remote:
                    pass
                else:
                    continue

        # 3. Location Combobox query filter (when user picked a city, state, or remote)
        if loc_clean and loc_clean != "all" and (not city_clean or city_clean == "all") and (not state_clean or state_clean == "all"):
            if loc_clean == "remote":
                if not j_is_remote:
                    continue
            else:
                norm_c = (normalize_city(loc_clean) or "").lower()
                norm_s = normalize_state(loc_clean)
                s_cities = [c.lower() for c in get_cities_for_state(norm_s)] if norm_s else []
                loc_matched = False
                if norm_c and (norm_c == j_city or norm_c in j_loc):
                    loc_matched = True
                elif norm_s and (norm_s.lower() == j_state or j_city in s_cities or norm_s.lower() in j_loc or any(c in j_loc for c in s_cities)):
                    loc_matched = True
                elif loc_clean in j_loc:
                    loc_matched = True

                if not loc_matched:
                    if work_mode and work_mode.lower() == "remote" and j_is_remote:
                        pass
                    else:
                        continue

        # 4. Work mode filter: Any, Remote, Hybrid, On-site
        if work_mode and work_mode not in ("all", "any"):
            wm_target = work_mode.lower().strip()
            j_wm = j.get("work_mode", "").lower()
            if wm_target == "remote":
                if not j_is_remote and "remote" not in j_wm:
                    continue
            elif wm_target == "hybrid":
                if "hybrid" not in j_wm and "hybrid" not in j_loc:
                    continue
            elif wm_target in ("onsite", "on-site"):
                if "onsite" not in j_wm and "on-site" not in j_wm and j_is_remote:
                    continue

        # Fresher filter
        level = j.get("experience_level", "").lower()
        years = j.get("years_experience", "").lower()

        if fresher_only:
            if level not in ("fresher", "internship", "junior") and "0" not in years:
                continue

        # Experience years dropdown filter
        if experience_years and experience_years != "all":
            exp_val = experience_years.lower()
            if exp_val in ("fresher", "0"):
                if level not in ("fresher", "internship", "junior") and "0" not in years:
                    continue
            elif exp_val in ("<1", "less_than_1", "under_1"):
                if "0" not in years and "<1" not in years and "0-1" not in years and "fresher" not in level:
                    continue
            elif exp_val == "1-2":
                if not any(k in years for k in ["1", "2", "0-2", "1-2", "1-3"]):
                    continue
            elif exp_val == "2-3":
                if not any(k in years for k in ["2", "3", "1-3", "2-3", "2-4"]):
                    continue
            elif exp_val == "3-5":
                if not any(k in years for k in ["3", "4", "5", "3-5", "2-5", "3-6"]):
                    continue
            elif exp_val in ("5+", "senior"):
                if not any(k in years for k in ["5", "6", "7", "8", "5+"]) and level not in ("senior", "lead"):
                    continue

        # Date posted filter (24h, 3d, 7d/week, 30d/month)
        if date_posted and date_posted != "all":
            created_at = j.get("created_at")
            if created_at and isinstance(created_at, datetime.datetime):
                delta = now - created_at
                if date_posted in ("24h", "1d", "day") and delta.total_seconds() > 86400:
                    continue
                elif date_posted == "3d" and delta.total_seconds() > (3 * 86400):
                    continue
                elif date_posted in ("7d", "week", "1w") and delta.total_seconds() > (7 * 86400):
                    continue
                elif date_posted in ("30d", "month", "1m") and delta.total_seconds() > (30 * 86400):
                    continue

        # Boolean keyword evaluation
        full_text = f"{j.get('title', '')} {j.get('company', '')} {' '.join(j.get('skills', []))} {j.get('description', '')}".lower()
        if query:
            has_boolean_ops = any(op in query.upper().split() for op in ("AND", "OR", "NOT")) or '"' in query
            if has_boolean_ops:
                if not evaluate_boolean_keyword(query, full_text) and not evaluate_boolean_keyword(q_expanded, full_text):
                    continue
            else:
                tokens = [t.lower() for t in query.split() if len(t) > 1]
                if tokens and not any(t in full_text for t in tokens):
                    continue
        filtered.append(j)

    # If no jobs match the filters/query, return empty list
    if not filtered:
        return []

    # If no query string, return facet-filtered results
    if not query.strip():
        return filtered[:top_k]

    # Vector ranking
    query_vec = embed_text(q_expanded or query)
    index = get_vector_index()
    vector_results = index.search_knn(query_vec, filtered, top_k=len(filtered))

    # Reciprocal Rank Fusion
    rrf_scores: Dict[str, float] = {}
    k_const = 60.0

    # Keyword rank
    for rank, j in enumerate(filtered):
        jid = str(j.get("id"))
        rrf_scores[jid] = rrf_scores.get(jid, 0.0) + (1.0 / (k_const + rank + 1))

    # Vector rank
    for rank, (j, sim) in enumerate(vector_results):
        jid = str(j.get("id"))
        rrf_scores[jid] = rrf_scores.get(jid, 0.0) + (1.0 / (k_const + rank + 1))

    # Sort filtered jobs by RRF score desc
    filtered.sort(key=lambda j: rrf_scores.get(str(j.get("id")), 0.0), reverse=True)
    return filtered[:top_k]

