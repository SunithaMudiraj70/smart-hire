// Centralized API Client with Bearer Token Authorization

export function getAuthToken() {
  return localStorage.getItem("talentpulse_token") || sessionStorage.getItem("talentpulse_token") || "";
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("talentpulse_token", token);
    sessionStorage.setItem("talentpulse_token", token);
  } else {
    localStorage.removeItem("talentpulse_token");
    sessionStorage.removeItem("talentpulse_token");
  }
}

export function getAuthHeaders(customHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...customHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchHealth() {
  const res = await fetch("/api/health");
  return res.ok ? await res.json() : null;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/auth/me", {
      headers: getAuthHeaders()
    });
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
}

export async function fetchUserProfile() {
  const res = await fetch("/api/user/profile", {
    headers: getAuthHeaders()
  });
  return res.ok ? await res.json() : null;
}

export async function updateUserProfile(data) {
  const res = await fetch("/api/user/profile", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data)
  });
  return res.ok ? await res.json() : null;
}

export async function fetchUserSettings() {
  const res = await fetch("/api/user/settings", {
    headers: getAuthHeaders()
  });
  return res.ok ? await res.json() : null;
}

export async function updateUserSettings(settings) {
  const res = await fetch("/api/user/settings", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(settings)
  });
  return res.ok ? await res.json() : null;
}

export async function searchJobs({ keyword = "", location = "", portal = "all", job_type = "all", work_mode = "all", experience = "all", min_match = 0 }) {
  const res = await fetch("/api/jobs/search", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ keyword, location, portal, job_type, work_mode, experience, min_match })
  });
  return res.ok ? await res.json() : { jobs: [], total: 0 };
}

export async function fetchRecommendedJobs() {
  const res = await fetch("/api/jobs/recommended", {
    headers: getAuthHeaders()
  });
  return res.ok ? await res.json() : { jobs: [] };
}

export async function uploadResumeFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/candidate/upload", {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData
  });
  return res.ok ? await res.json() : null;
}

export async function executeAutoApplyApi(job) {
  const res = await fetch("/api/jobs/auto-apply", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ job })
  });
  return res.ok ? await res.json() : null;
}

export async function generateCoverLetterApi(job) {
  const res = await fetch("/api/jobs/cover-letter", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ job })
  });
  return res.ok ? await res.json() : null;
}

export async function fetchAppliedJobs() {
  const res = await fetch("/api/jobs/applied", {
    headers: getAuthHeaders()
  });
  return res.ok ? await res.json() : [];
}

export async function fetchSavedJobs() {
  const res = await fetch("/api/jobs/saved", {
    headers: getAuthHeaders()
  });
  return res.ok ? await res.json() : [];
}

export async function toggleSaveJobApi(job) {
  const res = await fetch("/api/jobs/save", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ job })
  });
  return res.ok ? await res.json() : null;
}

export async function registerCandidate(payload) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    const data = await res.json();
    if (data.token) setAuthToken(data.token);
    return data;
  }
  return null;
}

export async function loginCandidate(email, password = "") {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (res.ok) {
    const data = await res.json();
    if (data.token) setAuthToken(data.token);
    return data;
  }
  return null;
}
