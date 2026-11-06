// State Management
let activeCandidate = null;
let userSettings = {
  auto_apply_enabled: true,
  attach_cover_letter: true,
  share_resume: true
};

let currentJobs = [];
let selectedJob = null;
let savedJobs = [];
let appliedJobs = [];
let filterExperience = "all";
let filterLocation = "all";
let filterWorkMode = "all";
let currentTab = "find-jobs";
let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const currentView = sessionStorage.getItem("talentpulse_view") || "app";
  switchAppView(currentView);

  await loadCandidateProfile();
  await loadUserSettings();
  await loadSavedJobs();
  await loadAppliedJobs();
  setupCvDropzone();
  setupDynamicSearchListeners();
  setupGlobalClickDismiss();
  executeSearch();
});


// ==================== 1. Profile & Settings Management ====================
async function loadCandidateProfile() {
  try {
    const res = await fetch("/api/user/profile");
    if (res.ok) {
      const data = await res.json();
      activeCandidate = data.profile || data;
      if (data.settings) {
        userSettings = Object.assign(userSettings, data.settings);
      }
      updateCandidateUI(activeCandidate);
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}

async function loadUserSettings() {
  try {
    const res = await fetch("/api/user/settings");
    if (res.ok) {
      const settings = await res.json();
      userSettings = Object.assign(userSettings, settings);
      updateSettingsUI();
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

function updateSettingsUI() {
  const autoApplyEl = document.getElementById("toggleAutoApply");
  const coverEl = document.getElementById("toggleAttachCoverLetter");
  const resumeEl = document.getElementById("toggleShareResume");

  if (autoApplyEl) autoApplyEl.checked = !!userSettings.auto_apply_enabled;
  if (coverEl) coverEl.checked = !!userSettings.attach_cover_letter;
  if (resumeEl) resumeEl.checked = !!userSettings.share_resume;
}

async function handleSettingToggle(key, value) {
  userSettings[key] = value;
  try {
    const payload = {};
    payload[key] = value;
    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const labels = {
        auto_apply_enabled: "Auto-applying",
        attach_cover_letter: "Attach cover letter",
        share_resume: "Share resume"
      };
      const label = labels[key] || key;
      showToast(`${label} ${value ? "turned ON" : "turned OFF"}`, "info");
    }
  } catch (e) {
    console.error("Failed to update setting:", e);
    showToast("Failed to save setting", "error");
  }
}

function updateCandidateUI(cand) {
  if (!cand) return;
  const name = cand.name || "Candidate";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "CV";

  // Navbar elements
  const navNameEl = document.getElementById("navCandidateName");
  const navAvatarEl = document.getElementById("navAvatar");
  const ddAvatar = document.getElementById("ddAvatar");
  const ddName = document.getElementById("ddUserName");
  const ddEmail = document.getElementById("ddUserEmail");

  if (navNameEl) navNameEl.innerText = name;
  if (navAvatarEl) navAvatarEl.innerText = initials;
  if (ddAvatar) ddAvatar.innerText = initials;
  if (ddName) ddName.innerText = name;
  if (ddEmail) ddEmail.innerText = cand.email || "candidate@domain.com";
}

// Dropdown Popovers
function toggleNotificationsMenu(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById("notificationsDropdown");
  const wasActive = dd ? dd.classList.contains("active") : false;
  closeDropdowns();
  if (dd && !wasActive) dd.classList.add("active");
}

function toggleProfileMenu(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById("profileDropdown");
  const wasActive = dd ? dd.classList.contains("active") : false;
  closeDropdowns();
  if (dd && !wasActive) dd.classList.add("active");
}

function toggleFilterMenu(dropdownId, e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById(dropdownId);
  const wasActive = dd ? dd.classList.contains("active") : false;
  closeDropdowns();
  if (dd && !wasActive) dd.classList.add("active");
}

function closeDropdowns(exceptId = "") {
  const popovers = [
    "notificationsDropdown",
    "profileDropdown",
    "expDropdown",
    "locDropdown",
    "workModeDropdown"
  ];
  popovers.forEach(id => {
    if (id !== exceptId) {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    }
  });
}

function setupGlobalClickDismiss() {
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-popover-wrap") && !e.target.closest(".dropdown-select-wrap")) {
      closeDropdowns();
    }
  });
}


function clearNotifications() {
  const badge = document.getElementById("notifBadge");
  if (badge) badge.style.display = "none";
  const list = document.getElementById("notifList");
  if (list) {
    list.innerHTML = `
      <div style="padding:20px; text-align:center; font-size:12.5px; color:#64748b;">
        No unread notifications
      </div>
    `;
  }
  showToast("All notifications marked as read", "info");
}

function switchAppView(view) {
  const landingSec = document.getElementById("landingPageSection");
  const appContainer = document.getElementById("appContainer");
  if (!landingSec || !appContainer) return;

  if (view === "landing") {
    landingSec.style.display = "block";
    appContainer.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    landingSec.style.display = "none";
    appContainer.style.display = "block";
  }
}

function handleLogout() {
  sessionStorage.removeItem("talentpulse_logged_in");
  sessionStorage.setItem("talentpulse_view", "landing");
  switchAppView("landing");
  showToast("Logged out. Please sign in or register to enter dashboard.", "info");
}

function handleLaunchPortalClick() {
  const isLoggedIn = sessionStorage.getItem("talentpulse_logged_in") === "true";
  if (isLoggedIn) {
    sessionStorage.setItem("talentpulse_view", "app");
    switchAppView("app");
    showToast("Welcome back to your dashboard!", "info");
    if (!currentJobs || currentJobs.length === 0) {
      executeSearch();
    }
  } else {
    // Prompt login or signup first as requested by user
    openAuthModal("login");
    showToast("Please sign in or create an account first to enter dashboard.", "info");
  }
}

function launchAppDemo() {
  handleLaunchPortalClick();
}

function bypassAsGuest() {
  sessionStorage.setItem("talentpulse_logged_in", "true");
  sessionStorage.setItem("talentpulse_view", "app");
  switchAppView("app");
  closeAuthModal();
  showToast("Welcome! Exploring as demo candidate.", "info");
  if (!currentJobs || currentJobs.length === 0) {
    executeSearch();
  }
}

// Modal open/close helpers
function openSettingsModal() {
  updateSettingsUI();
  document.getElementById("settingsModalOverlay").classList.add("active");
}

function closeSettingsModal() {
  document.getElementById("settingsModalOverlay").classList.remove("active");
}

function openAuthModal(mode = "login") {
  switchAuthTab(mode);
  document.getElementById("authModalOverlay").classList.add("active");
}

function closeAuthModal() {
  document.getElementById("authModalOverlay").classList.remove("active");
}

function switchAuthTab(mode) {
  const isReg = mode === "register";
  const regBtn = document.getElementById("tabRegisterMode");
  const loginBtn = document.getElementById("tabLoginMode");
  const regForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const modalTitle = document.getElementById("authModalTitle");
  const modalSub = document.getElementById("authModalSubtitle");

  if (regBtn) regBtn.classList.toggle("active", isReg);
  if (loginBtn) loginBtn.classList.toggle("active", !isReg);
  if (regForm) regForm.style.display = isReg ? "block" : "none";
  if (loginForm) loginForm.style.display = isReg ? "none" : "block";

  if (modalTitle) {
    modalTitle.innerText = isReg ? "Create Candidate Profile" : "Sign In to TalentPulse";
  }
  if (modalSub) {
    modalSub.innerText = isReg 
      ? "Enter your details to generate tailored applications & matching"
      : "Access your candidate dashboard, matched jobs, and application tracking";
  }
}

function openProfileEditModal() {
  if (activeCandidate) {
    document.getElementById("editName").value = activeCandidate.name || "";
    document.getElementById("editHeadline").value = activeCandidate.headline || "";
    document.getElementById("editEmail").value = activeCandidate.email || "";
    document.getElementById("editPhone").value = activeCandidate.phone || "";
    document.getElementById("editLocation").value = activeCandidate.location || "";
    document.getElementById("editExp").value = activeCandidate.years_experience || 3;
    document.getElementById("editLinkedin").value = activeCandidate.linkedin || "";
    document.getElementById("editSkills").value = (activeCandidate.skills || []).join(", ");

    // Update Active CV Card in Modal
    const fnEl = document.getElementById("modalCvFilename");
    const metaEl = document.getElementById("modalCvMeta");
    if (fnEl) fnEl.textContent = activeCandidate.filename || "Alex_Thomas_Resume.pdf";
    if (metaEl) {
      const skillsCount = (activeCandidate.skills || []).length || 8;
      const expYears = activeCandidate.years_experience || 3;
      metaEl.textContent = `${skillsCount} Skills Extracted • ${expYears} Yrs Experience • Ready for 1-Click Apply`;
    }
  }
  document.getElementById("editProfileModal").classList.add("active");
}

function closeProfileEditModal() {
  document.getElementById("editProfileModal").classList.remove("active");
}


async function saveProfileEdits() {
  const skillsStr = document.getElementById("editSkills").value;
  const updatePayload = {
    name: document.getElementById("editName").value.trim(),
    headline: document.getElementById("editHeadline").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
    location: document.getElementById("editLocation").value.trim(),
    years_experience: parseInt(document.getElementById("editExp").value) || 3,
    linkedin: document.getElementById("editLinkedin").value.trim(),
    skills: skillsStr.split(",").map(s => s.trim()).filter(Boolean)
  };

  try {
    const res = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload)
    });
    if (res.ok) {
      const data = await res.json();
      activeCandidate = data.user.profile;
      updateCandidateUI(activeCandidate);
      closeProfileEditModal();
      showToast("Profile details updated successfully!", "info");
      executeSearch();
    }
  } catch (err) {
    console.error("Profile edit error:", err);
    showToast("Failed to update profile", "error");
  }
}

// User Registration & Login
async function handleUserRegister() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const location = document.getElementById("regLocation").value.trim();
  const target_roles = document.getElementById("regTargetRoles").value.trim();
  const skills = document.getElementById("regSkills").value.trim();

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, location, target_roles, skills, years_experience: 3, linkedin: ""
      })
    });

    if (res.ok) {
      const data = await res.json();
      activeCandidate = data.user.profile;
      updateCandidateUI(activeCandidate);
      sessionStorage.setItem("talentpulse_logged_in", "true");
      sessionStorage.setItem("talentpulse_view", "app");
      switchAppView("app");
      closeAuthModal();
      showToast(`Welcome, ${name}! Profile created.`, "info");
      executeSearch();
    }
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Failed to create profile.", "error");
  }
}

async function handleUserLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      const data = await res.json();
      activeCandidate = data.user.profile;
      updateCandidateUI(activeCandidate);
      sessionStorage.setItem("talentpulse_logged_in", "true");
      sessionStorage.setItem("talentpulse_view", "app");
      switchAppView("app");
      closeAuthModal();
      showToast("Signed in successfully!", "info");
      executeSearch();
    }
  } catch (err) {
    console.error("Login error:", err);
    showToast("Login failed.", "error");
  }
}

// ==================== 2. Dropdown Filter Handlers ====================
function setExperienceFilter(exp, label) {
  filterExperience = exp;
  document.getElementById("labelExpFilter").innerText = label;
  document.querySelectorAll("#expDropdown .filter-menu-item").forEach(item => {
    item.classList.toggle("active", item.innerText.includes(label) || (exp === 'all' && item.innerText.includes('Any')));
  });
  document.getElementById("btnExpFilter").classList.toggle("active", exp !== "all");
  closeDropdowns();
  updateResetButtonState();
  executeSearch();
}

function setLocationFilter(loc, label) {
  filterLocation = loc;
  document.getElementById("labelLocFilter").innerText = label;
  document.querySelectorAll("#locDropdown .filter-menu-item").forEach(item => {
    item.classList.toggle("active", item.innerText.includes(label) || (loc === 'all' && item.innerText.includes('All')));
  });
  document.getElementById("btnLocFilter").classList.toggle("active", loc !== "all");
  closeDropdowns();
  updateResetButtonState();
  executeSearch();
}

function setWorkModeFilter(mode, label) {
  filterWorkMode = mode;
  document.getElementById("labelWorkModeFilter").innerText = label;
  document.querySelectorAll("#workModeDropdown .filter-menu-item").forEach(item => {
    item.classList.toggle("active", item.innerText.includes(label) || (mode === 'all' && item.innerText.includes('All')));
  });
  document.getElementById("btnWorkModeFilter").classList.toggle("active", mode !== "all");
  closeDropdowns();
  updateResetButtonState();
  executeSearch();
}

function shuffleJobsOrder() {
  if (currentJobs.length > 1) {
    currentJobs.sort(() => Math.random() - 0.5);
    renderJobsList(currentJobs);
    showToast("Shuffled job listings", "info");
  }
}

function updateResetButtonState() {
  const isFiltered = filterExperience !== "all" || filterLocation !== "all" || filterWorkMode !== "all";
  const resetBtn = document.getElementById("btnResetFilters");
  if (resetBtn) resetBtn.style.display = isFiltered ? "inline-block" : "none";
}

function clearAllFilters() {
  document.getElementById("searchInputWhat").value = "";
  document.getElementById("searchInputWhere").value = "";
  filterExperience = "all";
  filterLocation = "all";
  filterWorkMode = "all";

  document.getElementById("labelExpFilter").innerText = "Experience";
  document.getElementById("labelLocFilter").innerText = "Location";
  document.getElementById("labelWorkModeFilter").innerText = "Work Mode";

  document.getElementById("btnExpFilter").classList.remove("active");
  document.getElementById("btnLocFilter").classList.remove("active");
  document.getElementById("btnWorkModeFilter").classList.remove("active");

  updateResetButtonState();
  showToast("All filters reset", "info");
  loadRecommendedJobs();
}

function clearSearchAndReset() {
  document.getElementById("searchInputWhat").value = "";
  document.getElementById("searchInputWhere").value = "";
  loadRecommendedJobs();
}

// Navigation Tabs
async function switchNavTab(tab) {
  clearTimeout(searchDebounceTimer);
  currentTab = tab;
  document.getElementById("tabFindJobs").classList.toggle("active", tab === "find-jobs");
  document.getElementById("tabRecommended").classList.toggle("active", tab === "recommended");
  document.getElementById("tabApplied").classList.toggle("active", tab === "applied");
  document.getElementById("tabSaved").classList.toggle("active", tab === "saved");

  const hero = document.getElementById("searchHeroSection");
  const autoApplyBtn = document.getElementById("btnAutoApplyAll");

  if (tab === "find-jobs") {
    if (hero) hero.style.display = "block";
    if (autoApplyBtn) autoApplyBtn.style.display = "inline-flex";
    executeSearch();
  } else if (tab === "recommended") {
    if (hero) hero.style.display = "none";
    if (autoApplyBtn) autoApplyBtn.style.display = "inline-flex";
    loadRecommendedJobs();
  } else if (tab === "applied") {
    if (hero) hero.style.display = "none";
    if (autoApplyBtn) autoApplyBtn.style.display = "none";
    await renderAppliedJobs();
  } else if (tab === "saved") {
    if (hero) hero.style.display = "none";
    if (autoApplyBtn) autoApplyBtn.style.display = "none";
    renderSavedJobs();
  }
}

function setupDynamicSearchListeners() {
  const whatInput = document.getElementById("searchInputWhat");
  const whereInput = document.getElementById("searchInputWhere");

  if (whatInput) {
    whatInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      if (currentTab !== "find-jobs") return;
      searchDebounceTimer = setTimeout(() => {
        if (currentTab !== "find-jobs") return;
        if (!whatInput.value.trim()) {
          loadRecommendedJobs();
        } else {
          executeSearch();
        }
      }, 400);
    });

    whatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && currentTab === "find-jobs") executeSearch();
    });
  }

  if (whereInput) {
    whereInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && currentTab === "find-jobs") executeSearch();
    });
  }
}

// ==================== 3. Search & Job Execution ====================
async function executeSearch() {
  if (currentTab !== "find-jobs") return;

  const keyword = document.getElementById("searchInputWhat").value.trim();
  const searchLoc = document.getElementById("searchInputWhere").value.trim();
  const location = filterLocation !== "all" ? filterLocation : searchLoc;

  const countLabel = document.getElementById("resultsCountLabel");
  const metaLabel = document.getElementById("searchMetaLabel");
  if (countLabel) countLabel.innerText = "Searching jobs...";
  if (metaLabel) metaLabel.innerText = "Connecting to verified portals & company feeds";

  const cardsContainer = document.getElementById("jobCardsContainer");
  cardsContainer.innerHTML = `
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:32px; text-align:center; color:#64748b;">
      <div style="font-size:24px; margin-bottom:8px;">⏳</div>
      <div>Loading matching jobs...</div>
    </div>
  `;

  try {
    const res = await fetch("/api/jobs/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        location,
        portal: "all",
        job_type: "all",
        work_mode: filterWorkMode,
        experience: filterExperience,
        min_match: 0
      })
    });

    if (currentTab !== "find-jobs") return;

    if (res.ok) {
      const data = await res.json();
      currentJobs = data.jobs || [];

      if (data.is_recommended) {
        document.getElementById("resultsCountLabel").innerText = `Recommended for ${activeCandidate?.name || 'You'} (${currentJobs.length} jobs)`;
        document.getElementById("searchMetaLabel").innerText = "Displaying top openings matching your skills";
      } else {
        document.getElementById("resultsCountLabel").innerText = `${currentJobs.length} jobs found`;
        document.getElementById("searchMetaLabel").innerText = location ? `In ${location}` : "All verified locations";
      }

      renderJobsList(currentJobs);
    }
  } catch (err) {
    if (currentTab !== "find-jobs") return;
    console.error("Search error:", err);
    cardsContainer.innerHTML = `
      <div style="background:#ffffff; border:1px solid #fee2e2; border-radius:8px; padding:24px; text-align:center; color:#dc2626;">
        Could not connect to job service.
      </div>
    `;
  }
}

async function loadRecommendedJobs() {
  const cardsContainer = document.getElementById("jobCardsContainer");
  cardsContainer.innerHTML = `
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:32px; text-align:center; color:#64748b;">
      Finding recommended jobs for your profile...
    </div>
  `;

  try {
    const res = await fetch("/api/jobs/recommended");
    if (res.ok) {
      const data = await res.json();
      currentJobs = data.jobs || [];
      document.getElementById("resultsCountLabel").innerText = `Recommended for ${data.candidate_name || 'You'} (${currentJobs.length})`;
      document.getElementById("searchMetaLabel").innerText = `Matched with ${(data.target_roles || []).join(", ") || "your profile"}`;
      renderJobsList(currentJobs);
    }
  } catch (err) {
    console.error("Failed to load recommendations:", err);
  }
}

// ==================== 4. Render Job List & Details ====================
function renderJobsList(jobs) {
  const container = document.getElementById("jobCardsContainer");
  container.innerHTML = "";

  if (!jobs || jobs.length === 0) {
    container.innerHTML = `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:40px; text-align:center; color:#64748b;">
        <div style="font-size:24px; margin-bottom:8px;">🔍</div>
        <div style="font-size:15px; font-weight:700; color:#1e293b;">No jobs found</div>
        <div style="font-size:13px; margin-top:4px;">Try clearing filters to see recommended jobs.</div>
        <button class="filter-dropdown-btn" onclick="clearAllFilters()" style="margin-top:12px; display:inline-block;">
          Show Recommended Jobs
        </button>
      </div>
    `;
    document.getElementById("jobDetailContainer").innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #64748b;">
        <div style="font-size: 16px; font-weight: 700; color: #1e293b;">No job selected</div>
      </div>
    `;
    return;
  }

  jobs.forEach((job, index) => {
    const card = document.createElement("div");
    card.className = "job-card-item";
    card.id = `card-${job.id}`;
    if (index === 0) {
      card.classList.add("selected");
      selectedJob = job;
      renderJobDetail(job);
    }

    const matchScore = job.match?.score || 75;
    const matchedSkills = (job.match?.matched_skills || []).slice(0, 3).join(", ");
    const isApplied = appliedJobs.some(a => a.job_id === job.id || a.link === job.link);
    const isSaved = savedJobs.some(s => s.id === job.id);

    let salaryDisplay = job.salary;
    if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
      salaryDisplay = "Competitive / Market Rate";
    }

    card.onclick = () => selectJob(job.id);

    card.innerHTML = `
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(job.title)}</h3>
        <span class="portal-badge" style="background:${job.source_badge_color || '#057642'};">
          ${escapeHtml(job.source || 'Portal')}
        </span>
      </div>

      <div class="company-line">
        <span style="font-weight: 600;">${escapeHtml(job.company)}</span>
        <span class="rating-tag">${job.rating || '4.4 ★'}</span>
        ${isApplied ? '<span class="status-badge-applied">✓ Applied</span>' : ''}
      </div>

      <div class="loc-salary-row">
        <span>📍 ${escapeHtml(job.location || 'Remote / India')}</span>
        <span>💰 ${escapeHtml(salaryDisplay)}</span>
      </div>

      <div class="cv-match-pill">
        <span>✨</span> <strong>${matchScore}% Match</strong>
        ${matchedSkills ? `<span style="font-weight:400; color:#15803d;">• ${escapeHtml(matchedSkills)}</span>` : ''}
      </div>

      <div class="card-snippet">
        ${escapeHtml(job.description || '')}
      </div>

      <div class="card-footer">
        <span>🕒 ${escapeHtml(job.posted || 'Recent')}</span>
        <button class="btn-clear-search" style="padding:0; height:auto; font-size:14px;" onclick="event.stopPropagation(); toggleSaveJobDirect('${job.id}')" title="Save Job">
          ${isSaved ? '♥' : '♡'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function selectJob(jobId) {
  const job = currentJobs.find(j => j.id === jobId);
  if (!job) return;
  selectedJob = job;

  document.querySelectorAll(".job-card-item").forEach(c => c.classList.remove("selected"));
  const cardElem = document.getElementById(`card-${jobId}`);
  if (cardElem) cardElem.classList.add("selected");

  renderJobDetail(job);
}

function renderJobDetail(job) {
  const container = document.getElementById("jobDetailContainer");
  const isSaved = savedJobs.some(j => j.id === job.id);
  const appRecord = appliedJobs.find(a => a.job_id === job.id || a.application_id === job.id || a.link === job.link) || null;
  const isApplied = !!appRecord || job.is_applied === true;
  const matchScore = job.match?.score || 75;
  const matchedSkills = job.match?.matched_skills || [];
  const missingSkills = job.match?.missing_skills || [];

  let salaryDisplay = job.salary;
  if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
    salaryDisplay = "Competitive / Market Standard";
  }

  const matchedHtml = matchedSkills.length > 0
    ? matchedSkills.map(s => `<span class="skill-tag-match">✓ ${escapeHtml(s)}</span>`).join("")
    : `<span style="font-size:12px;color:#64748b;">Profile skills aligned</span>`;

  const missingHtml = missingSkills.map(s => `<span class="skill-tag-missing">+ ${escapeHtml(s)}</span>`).join("");

  const auditCardHtml = isApplied ? `
    <div class="application-audit-card">
      <div class="audit-card-head">
        <span class="audit-status-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Application Verified &amp; Recorded
        </span>
        <span class="audit-app-id">${escapeHtml(appRecord?.application_id || job.application_id || 'APP-CONFIRMED')}</span>
      </div>
      <div class="audit-details-grid">
        <div class="audit-item">
          <span class="audit-lbl">Candidate</span>
          <span class="audit-val">${escapeHtml(appRecord?.candidate_name || activeCandidate?.name || 'Alex Thomas')}</span>
        </div>
        <div class="audit-item">
          <span class="audit-lbl">Applied At</span>
          <span class="audit-val">${appRecord?.applied_at ? new Date(appRecord.applied_at).toLocaleString() : 'Recently Submitted'}</span>
        </div>
        <div class="audit-item">
          <span class="audit-lbl">Active CV Attached</span>
          <span class="audit-val">${escapeHtml(appRecord?.resume_attached || activeCandidate?.filename || 'Resume.pdf')}</span>
        </div>
        <div class="audit-item">
          <span class="audit-lbl">Status</span>
          <span class="audit-val" style="color:#15803d;">${escapeHtml(appRecord?.status || 'Submitted &amp; Verified')}</span>
        </div>
      </div>
      <div class="audit-explainer">
        <strong>Application Audit:</strong> This submission was validated and logged in TalentPulse with candidate contact details (${escapeHtml(appRecord?.candidate_email || activeCandidate?.email || 'verified')}) and customized AI cover note under tracking ID <code>${escapeHtml(appRecord?.application_id || job.application_id || 'APP-CONFIRMED')}</code>.
      </div>
    </div>
  ` : '';

  const directCareersHtml = job.direct_apply_url ? `
    <a href="${escapeHtml(job.direct_apply_url)}" target="_blank" rel="noopener noreferrer" class="btn-direct-careers" title="Open verified official employer careers portal">
      <span>🏢 Company Careers</span> ↗
    </a>
  ` : '';

  container.innerHTML = `
    <div class="detail-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <h2 class="detail-title">${escapeHtml(job.title)}</h2>
        <span class="portal-badge" style="background:${job.source_badge_color || '#057642'}; font-size:11px; padding:3px 8px;">
          ${escapeHtml(job.source || 'Portal')}
        </span>
      </div>

      <div class="detail-company-line">
        <span>🏢 ${escapeHtml(job.company)}</span>
        <span class="rating-tag">${job.rating || '4.4 ★'}</span>
        ${isApplied ? '<span class="status-badge-applied">✓ Application Submitted</span>' : ''}
      </div>

      <div class="detail-loc-salary">
        <span class="detail-chip">📍 ${escapeHtml(job.location || 'Remote / India')}</span>
        <span class="detail-chip">💼 ${escapeHtml(job.job_type || 'Full-time')}</span>
        <span class="detail-chip">💰 ${escapeHtml(salaryDisplay)}</span>
        <span class="detail-chip">⏱️ ${escapeHtml(job.experience || '2+ years')}</span>
      </div>

      <div class="action-row">
        <!-- 1-Click Auto Apply with Profile & Settings -->
        <button class="btn-auto-apply ${isApplied ? 'applied' : ''}" id="btnDetailAutoApply" onclick="executeAutoApply('${job.id}')">
          <span>${isApplied ? '✅ Application Submitted' : '⚡ Auto-Apply in 1-Click'}</span>
        </button>

        ${directCareersHtml}

        <!-- Direct Portal Link with Quick-Fill Assistant -->
        <button class="btn-apply-portal" onclick="openJobWithQuickFill('${job.id}')" title="Copies profile & pitch to clipboard, then opens job portal">
          <span>Open Job Link</span> ↗
        </button>

        <button class="btn-save-job ${isSaved ? 'saved' : ''}" onclick="toggleSaveCurrentJob()">
          <span>${isSaved ? '♥ Saved' : '♡ Save'}</span>
        </button>

        <button class="btn-save-job" onclick="openCoverModal()">
          <span>📄 Tailored Note</span>
        </button>
      </div>
    </div>

    ${auditCardHtml}

    <!-- CV Fit Breakdown -->
    <div class="cv-match-box">
      <div class="cv-match-header">
        <span class="cv-match-title">
          <span>🎯</span> Profile Match
        </span>
        <span class="cv-match-score">${matchScore}% Match Fit</span>
      </div>

      <div style="font-size: 13px; color: #166534; line-height: 1.5; margin-bottom: 8px;">
        ${escapeHtml(job.match?.rationale || 'Your background aligns with the core requirements of this role.')}
      </div>

      <div style="font-size: 12px; font-weight: 700; color: #166534;">Skills from your profile that match:</div>
      <div class="matched-skills-tags">
        ${matchedHtml}
        ${missingHtml}
      </div>
    </div>

    <!-- Job Description -->
    <div>
      <div class="detail-section-title">Job Details &amp; Qualifications</div>
      <div class="detail-body-text">${escapeHtml(job.description || '')}</div>
    </div>
  `;
}

async function openJobWithQuickFill(jobId) {
  const job = currentJobs.find(j => j.id === jobId) || selectedJob;
  if (!job) return;

  const name = activeCandidate?.name || "Applicant";
  const email = activeCandidate?.email || "";
  const phone = activeCandidate?.phone || "";
  const loc = activeCandidate?.location || "";
  const exp = activeCandidate?.years_experience || 3;
  const linkedin = activeCandidate?.linkedin || "";
  const skills = (activeCandidate?.skills || []).join(", ");
  const activeCv = activeCandidate?.filename || "Resume.pdf";

  const pitch = `Dear Hiring Team at ${job.company},

I am applying for the ${job.title} position. With my background in ${skills.split(',').slice(0, 5).join(', ')}, I am eager to make an immediate impact on your team.

Sincerely,
${name}
${email} | ${phone}
LinkedIn: ${linkedin}`;

  const clipboardData = `Applicant Name: ${name}
Email: ${email}
Phone: ${phone}
Location: ${loc}
Years Experience: ${exp}
LinkedIn: ${linkedin}
Active CV: ${activeCv}
Core Skills: ${skills}

--- Tailored Application Pitch ---
${pitch}`;

  try {
    await navigator.clipboard.writeText(clipboardData);
    showToast("📋 Profile & Pitch copied to clipboard! Paste directly into form.", "info");
  } catch (err) {
    console.log("Clipboard write failed:", err);
  }

  // Open the portal link in a new tab
  if (job.link && job.link !== "#") {
    window.open(job.link, "_blank", "noopener,noreferrer");
  } else {
    showToast("Link not available for this job.", "error");
  }
}

// ==================== 5. 1-Click Automated Apply ====================
async function executeAutoApply(jobId) {

  const job = currentJobs.find(j => j.id === jobId) || selectedJob;
  if (!job) return;

  const btn = document.getElementById("btnDetailAutoApply");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Applying with Profile...`;
  }

  try {
    const res = await fetch("/api/jobs/auto-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job })
    });

    if (res.ok) {
      const receipt = await res.json();
      await loadAppliedJobs();
      if (btn) {
        btn.className = "btn-auto-apply applied";
        btn.innerHTML = `<span>✅</span> Application Submitted`;
      }
      openApplySuccessModal(receipt);
      showToast("Application submitted successfully!", "info");
    }
  } catch (err) {
    console.error("Auto apply error:", err);
    showToast("Application submission failed.", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>⚡</span> Auto-Apply in 1-Click`;
    }
  }
}

async function autoApplyAllQualified() {
  if (!currentJobs || currentJobs.length === 0) {
    showToast("No jobs available to auto-apply.", "error");
    return;
  }

  const btn = document.getElementById("btnAutoApplyAll");
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Applying...`;

  let count = 0;
  for (const job of currentJobs) {
    try {
      await fetch("/api/jobs/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job })
      });
      count++;
    } catch (e) {
      console.error(e);
    }
  }

  await loadAppliedJobs();
  btn.disabled = false;
  btn.innerHTML = `<span>⚡ Auto-Apply All</span>`;
  showToast(`Submitted ${count} verified applications!`, "info");
  switchNavTab("applied");
}

function openApplySuccessModal(receipt) {
  const modal = document.getElementById("autoApplyModal");
  const content = document.getElementById("applyModalContent");

  let salaryDisplay = receipt.salary;
  if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
    salaryDisplay = "Competitive / Market Standard";
  }

  content.innerHTML = `
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px; margin-bottom:14px;">
      <div style="font-weight:700; color:#15803d; font-size:15px; margin-bottom:4px;">
        ${escapeHtml(receipt.job_title)} at ${escapeHtml(receipt.company)}
      </div>
      <div style="font-size:12.5px; color:#166534; display:flex; gap:12px; flex-wrap:wrap;">
        <span><strong>Ref ID:</strong> <code style="background:#dcfce7; padding:1px 5px; border-radius:4px;">${escapeHtml(receipt.application_id)}</code></span>
        <span><strong>Status:</strong> ${escapeHtml(receipt.status || 'Submitted & Verified')}</span>
      </div>
    </div>

    <div style="margin-bottom:12px; font-size:12.5px; color:#334155;">
      <div><strong>Candidate:</strong> ${escapeHtml(receipt.candidate_name)} (${escapeHtml(receipt.candidate_email)})</div>
      <div><strong>Location:</strong> ${escapeHtml(receipt.location || 'Remote / India')} • <strong>Salary:</strong> ${escapeHtml(salaryDisplay)}</div>
      <div><strong>CV Attached:</strong> Active Profile Verified</div>
    </div>

    <div style="font-size:11.5px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:4px;">
      Tailored Cover Note:
    </div>
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; font-size:12.5px; font-style:italic; color:#334155; max-height:140px; overflow-y:auto;">
      "${escapeHtml(receipt.cover_letter_preview || receipt.full_cover_letter || 'Cover letter attached')}"
    </div>
  `;
  modal.classList.add("active");
}

function closeApplyModal() {
  document.getElementById("autoApplyModal").classList.remove("active");
}

// ==================== 6. Applied & Saved Jobs Management ====================
async function loadAppliedJobs() {
  try {
    const res = await fetch("/api/jobs/applied");
    if (res.ok) {
      appliedJobs = await res.json();
      const countEl = document.getElementById("appliedCountHeader");
      if (countEl) countEl.innerText = appliedJobs.length;
    }
  } catch (err) {
    console.error("Failed to load applied jobs:", err);
  }
}

async function renderAppliedJobs() {
  clearTimeout(searchDebounceTimer);
  
  const container = document.getElementById("jobCardsContainer");
  const countLabel = document.getElementById("resultsCountLabel");
  const metaLabel = document.getElementById("searchMetaLabel");
  const hero = document.getElementById("searchHeroSection");

  if (hero) hero.style.display = "none";
  if (countLabel) countLabel.innerText = "Applied Jobs";
  if (metaLabel) metaLabel.innerText = "Confirmed application submissions & audit receipts";

  if (container) {
    container.innerHTML = `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:32px; text-align:center; color:#64748b;">
        <div style="font-size:24px; margin-bottom:8px;">⏳</div>
        <div>Loading your verified applications...</div>
      </div>
    `;
  }

  await loadAppliedJobs();
  if (currentTab !== "applied") return;

  if (countLabel) countLabel.innerText = `Applied Jobs (${appliedJobs.length})`;
  if (metaLabel) metaLabel.innerText = "Confirmed application submissions & audit receipts";

  if (!appliedJobs || appliedJobs.length === 0) {
    if (container) {
      container.innerHTML = `
        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:48px 24px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">📋</div>
          <div style="font-size:16px; font-weight:700; color:#1e293b; margin-bottom:6px;">No applied jobs yet</div>
          <div style="font-size:13px; color:#64748b; margin-bottom:16px;">Use 1-Click Auto-Apply or direct links from the Find Jobs tab to submit applications.</div>
          <button class="btn-primary" onclick="switchNavTab('find-jobs')" style="padding:8px 18px; font-size:13px;">Find Jobs Now</button>
        </div>
      `;
    }
    const detailContainer = document.getElementById("jobDetailContainer");
    if (detailContainer) {
      detailContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #64748b;">
          <div style="font-size: 16px; font-weight: 700; color: #1e293b;">No applications submitted yet</div>
          <div style="font-size: 13px; margin-top: 6px;">Applications you submit will appear here with verification receipts.</div>
        </div>
      `;
    }
    return;
  }

  currentJobs = appliedJobs.map(a => {
    let salaryClean = a.salary;
    if (!salaryClean || salaryClean.toLowerCase() === "applied") {
      salaryClean = "Competitive / Market Standard";
    }

    return {
      id: a.job_id || a.application_id,
      application_id: a.application_id,
      title: a.job_title || "Application",
      company: a.company || "Company",
      location: a.location || "Remote / India",
      source: a.source || "Portal",
      source_badge_color: a.source_badge_color || "#057642",
      rating: a.rating || "4.4 ★",
      salary: salaryClean,
      job_type: a.job_type || "Full-time",
      experience: a.experience || "2+ years",
      posted: a.applied_at ? `Applied ${new Date(a.applied_at).toLocaleDateString()}` : "Recent",
      applied_at: a.applied_at,
      candidate_name: a.candidate_name,
      candidate_email: a.candidate_email,
      resume_attached: a.resume_attached,
      description: a.description || `Application Reference: ${a.application_id}\nCandidate: ${a.candidate_name}\nStatus: ${a.status || 'Submitted & Verified'}\n\nCover Letter Preview:\n${a.cover_letter_preview || ''}`,
      link: a.link || "#",
      direct_apply_url: a.direct_apply_url || a.link,
      is_applied: true,
      match: { score: a.match_score || 85, matched_skills: ["Python", "Machine Learning"], missing_skills: [] }
    };
  });

  renderJobsList(currentJobs);
}

async function loadSavedJobs() {
  try {
    const res = await fetch("/api/jobs/saved");
    if (res.ok) {
      savedJobs = await res.json();
      const countEl = document.getElementById("savedCountHeader");
      if (countEl) countEl.innerText = savedJobs.length;
    }
  } catch (err) {
    console.error("Failed to load saved jobs:", err);
  }
}

async function renderSavedJobs() {
  clearTimeout(searchDebounceTimer);
  const container = document.getElementById("jobCardsContainer");
  const countLabel = document.getElementById("resultsCountLabel");
  const metaLabel = document.getElementById("searchMetaLabel");
  const hero = document.getElementById("searchHeroSection");

  if (hero) hero.style.display = "none";
  await loadSavedJobs();
  if (currentTab !== "saved") return;

  if (countLabel) countLabel.innerText = `Saved Jobs (${savedJobs.length})`;
  if (metaLabel) metaLabel.innerText = "Your bookmarked career opportunities";
  currentJobs = savedJobs;
  renderJobsList(currentJobs);
}

async function toggleSaveCurrentJob() {
  if (!selectedJob) return;
  await toggleSaveJobDirect(selectedJob.id);
}

async function toggleSaveJobDirect(jobId) {
  const job = currentJobs.find(j => j.id === jobId) || selectedJob;
  if (!job) return;

  try {
    const res = await fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job })
    });
    if (res.ok) {
      const data = await res.json();
      await loadSavedJobs();
      if (currentTab === "saved") {
        renderSavedJobs();
      } else {
        renderJobDetail(selectedJob);
      }
      showToast(data.is_saved ? "Job saved to bookmarks" : "Job removed from saved", "info");
    }
  } catch (err) {
    console.error("Failed to toggle save job:", err);
  }
}

// ==================== 7. Cover Letter Modal ====================
async function openCoverModal() {
  if (!selectedJob) return;
  const modal = document.getElementById("coverLetterModal");
  const title = document.getElementById("coverModalTitle");
  const body = document.getElementById("coverModalBody");

  title.innerText = `Tailored Cover Letter: ${selectedJob.title}`;
  body.innerText = "Drafting personalized cover letter with AI...";
  modal.classList.add("active");

  try {
    const res = await fetch("/api/jobs/cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: selectedJob })
    });
    if (res.ok) {
      const data = await res.json();
      body.innerText = data.cover_letter;
    }
  } catch (err) {
    body.innerText = "Failed to generate cover letter.";
  }
}

function closeCoverModal() {
  document.getElementById("coverLetterModal").classList.remove("active");
}

function copyCoverLetter() {
  const text = document.getElementById("coverModalBody").innerText;
  navigator.clipboard.writeText(text);
  showToast("Cover letter copied!", "info");
}

// ==================== 8. CV Dropzone ====================
function setupCvDropzone() {
  const dropzone = document.getElementById("cvDropzone");
  if (!dropzone) return;

  ["dragenter", "dragover"].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "var(--primary)";
      dropzone.style.background = "#eff6ff";
    });
  });

  ["dragleave", "drop"].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "#cbd5e1";
      dropzone.style.background = "#f8fafc";
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadCvFile(files[0]);
    }
  });
}

function handleModalCvUpload(e) {
  const files = e.target.files;
  if (files.length > 0) {
    uploadCvFile(files[0]);
  }
}

async function uploadCvFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  showToast(`Uploading and parsing ${file.name}...`, "info");

  try {
    const res = await fetch("/api/candidate/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      activeCandidate = data.candidate;
      updateCandidateUI(activeCandidate);

      // Update Active CV Card in Modal
      const fnEl = document.getElementById("modalCvFilename");
      const metaEl = document.getElementById("modalCvMeta");
      if (fnEl) fnEl.textContent = activeCandidate.filename || file.name;
      if (metaEl) {
        const skillsCount = (activeCandidate.skills || []).length || 8;
        const expYears = activeCandidate.years_experience || 3;
        metaEl.textContent = `${skillsCount} Skills Extracted • ${expYears} Yrs Experience • Ready for 1-Click Apply`;
      }

      // Update form inputs if modal is open
      const editName = document.getElementById("editName");
      const editHeadline = document.getElementById("editHeadline");
      const editEmail = document.getElementById("editEmail");
      const editPhone = document.getElementById("editPhone");
      const editLocation = document.getElementById("editLocation");
      const editExp = document.getElementById("editExp");
      const editSkills = document.getElementById("editSkills");

      if (editName && activeCandidate.name) editName.value = activeCandidate.name;
      if (editHeadline && activeCandidate.headline) editHeadline.value = activeCandidate.headline;
      if (editEmail && activeCandidate.email) editEmail.value = activeCandidate.email;
      if (editPhone && activeCandidate.phone) editPhone.value = activeCandidate.phone;
      if (editLocation && activeCandidate.location) editLocation.value = activeCandidate.location;
      if (editExp && activeCandidate.years_experience) editExp.value = activeCandidate.years_experience;
      if (editSkills && activeCandidate.skills) editSkills.value = activeCandidate.skills.join(", ");

      showToast(`✅ Active CV updated: ${activeCandidate.filename || file.name}`, "info");
      executeSearch();
    }
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Failed to parse CV.", "error");
  }
}


// Utilities
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  const icon = type === "error" ? "⚠️" : "✓";
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}
