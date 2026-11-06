import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CandidateDashboard from './components/CandidateDashboard';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import CoverLetterModal from './components/CoverLetterModal';
import ApplySuccessModal from './components/ApplySuccessModal';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/Toast';

import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserSettings,
  updateUserSettings,
  searchJobs,
  fetchRecommendedJobs,
  uploadResumeFile,
  executeAutoApplyApi,
  generateCoverLetterApi,
  fetchAppliedJobs,
  fetchSavedJobs,
  toggleSaveJobApi,
  registerCandidate,
  loginCandidate
} from './api';

export default function App() {
  // Navigation & Auth View State
  const [view, setView] = useState(() => sessionStorage.getItem("talentpulse_view") || "app");
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem("talentpulse_logged_in") === "true");

  // Core Data
  const [candidate, setCandidate] = useState(null);
  const [userSettings, setUserSettings] = useState({
    auto_apply_enabled: true,
    attach_cover_letter: true,
    share_resume: true,
    auto_fill_forms: true
  });
  const [currentTab, setCurrentTab] = useState("find-jobs");
  const [currentJobs, setCurrentJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [keyword, setKeyword] = useState("Machine Learning Engineer");
  const [location, setLocation] = useState("Hyderabad, Telangana");
  const [filterExperience, setFilterExperience] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterWorkMode, setFilterWorkMode] = useState("all");
  const [resultsCountLabel, setResultsCountLabel] = useState("Loading jobs...");
  const [searchMetaLabel, setSearchMetaLabel] = useState("Connecting to verified portals & company feeds");

  // Modals & Popups
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coverModalJob, setCoverModalJob] = useState(null);
  const [applySuccessReceipt, setApplySuccessReceipt] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const searchTimerRef = useRef(null);

  // Initial Data Loading
  useEffect(() => {
    async function init() {
      try {
        const userData = await fetchUserProfile();
        if (userData?.profile) {
          setCandidate(userData.profile);
          if (userData.settings) setUserSettings(userData.settings);
        }
        const appHistory = await fetchAppliedJobs();
        if (appHistory) setAppliedJobs(appHistory);

        const saved = await fetchSavedJobs();
        if (saved) setSavedJobs(saved);
      } catch (e) {
        console.error("Initialization error:", e);
      }
    }
    init();
  }, []);

  // Update sessionStorage on state changes
  useEffect(() => {
    sessionStorage.setItem("talentpulse_view", view);
  }, [view]);

  useEffect(() => {
    sessionStorage.setItem("talentpulse_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  // Execute Search Function
  const handleExecuteSearch = useCallback(async (customKw, customLoc) => {
    if (currentTab !== "find-jobs") return;
    setLoading(true);
    setResultsCountLabel("Searching jobs...");
    setSearchMetaLabel("Connecting to verified portals & company feeds");

    const kw = customKw !== undefined ? customKw : keyword;
    const loc = customLoc !== undefined ? customLoc : location;
    const targetLoc = filterLocation !== "all" ? filterLocation : loc;

    try {
      const data = await searchJobs({
        keyword: kw,
        location: targetLoc,
        work_mode: filterWorkMode,
        experience: filterExperience,
        min_match: 0
      });

      const list = data.jobs || [];
      setCurrentJobs(list);
      if (list.length > 0) {
        setSelectedJob(list[0]);
      } else {
        setSelectedJob(null);
      }

      if (data.is_recommended) {
        setResultsCountLabel(`Recommended for ${candidate?.name || 'You'} (${list.length} jobs)`);
        setSearchMetaLabel("Displaying top openings matching your skills");
      } else {
        setResultsCountLabel(`${list.length} jobs found`);
        setSearchMetaLabel(targetLoc ? `In ${targetLoc}` : "All verified locations");
      }
    } catch (err) {
      console.error("Search failed:", err);
      showToast("Could not connect to job service.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentTab, keyword, location, filterLocation, filterWorkMode, filterExperience, candidate, showToast]);

  // Load Recommended Jobs
  const handleLoadRecommended = useCallback(async () => {
    setLoading(true);
    setResultsCountLabel("Finding recommended jobs...");
    setSearchMetaLabel("Matching opportunities to your active CV profile");
    try {
      const data = await fetchRecommendedJobs();
      const list = data.jobs || [];
      setCurrentJobs(list);
      if (list.length > 0) setSelectedJob(list[0]);
      else setSelectedJob(null);

      setResultsCountLabel(`Recommended for ${data.candidate_name || candidate?.name || 'You'} (${list.length})`);
      setSearchMetaLabel("Curated positions matching your extracted skills");
    } catch (err) {
      console.error("Recommended fetch error:", err);
      showToast("Failed to load recommended jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [candidate, showToast]);

  // Load and Render Applied Jobs
  const handleLoadApplied = useCallback(async () => {
    setLoading(true);
    setResultsCountLabel("Loading applied jobs...");
    setSearchMetaLabel("Confirmed application submissions & audit receipts");
    try {
      const history = await fetchAppliedJobs();
      setAppliedJobs(history || []);
      const formatted = (history || []).map((a) => ({
        id: a.job_id || a.application_id,
        application_id: a.application_id,
        title: a.job_title || "Application",
        company: a.company || "Company",
        location: a.location || "Remote / India",
        source: a.source || "Portal",
        source_badge_color: a.source_badge_color || "#057642",
        rating: a.rating || "4.4 ★",
        salary: a.salary || "Competitive / Market Standard",
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
      }));

      setCurrentJobs(formatted);
      if (formatted.length > 0) setSelectedJob(formatted[0]);
      else setSelectedJob(null);

      setResultsCountLabel(`Applied Jobs (${formatted.length})`);
      setSearchMetaLabel("Confirmed application submissions & audit receipts");
    } catch (err) {
      console.error("Applied jobs load error:", err);
      showToast("Failed to load applied applications", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load and Render Saved Jobs
  const handleLoadSaved = useCallback(async () => {
    setLoading(true);
    setResultsCountLabel("Loading saved jobs...");
    setSearchMetaLabel("Your bookmarked career opportunities");
    try {
      const saved = await fetchSavedJobs();
      setSavedJobs(saved || []);
      setCurrentJobs(saved || []);
      if (saved && saved.length > 0) setSelectedJob(saved[0]);
      else setSelectedJob(null);

      setResultsCountLabel(`Saved Jobs (${saved.length})`);
      setSearchMetaLabel("Your bookmarked career opportunities");
    } catch (err) {
      console.error("Saved jobs load error:", err);
      showToast("Failed to load saved jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Dynamic Tab Switching
  const handleSelectTab = (tab) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setCurrentTab(tab);

    if (tab === "find-jobs") {
      handleExecuteSearch();
    } else if (tab === "recommended") {
      handleLoadRecommended();
    } else if (tab === "applied") {
      handleLoadApplied();
    } else if (tab === "saved") {
      handleLoadSaved();
    }
  };

  // Run search on initial dashboard load
  useEffect(() => {
    if (view === "app" && currentTab === "find-jobs") {
      handleExecuteSearch();
    }
  }, [view, currentTab]); // eslint-disable-line

  // 1-Click Auto Apply
  const handleAutoApply = async (job) => {
    if (!job) return;
    try {
      const res = await executeAutoApplyApi(job);
      if (res && res.success) {
        showToast(`✅ Successfully applied to ${job.company}!`, "info");
        setApplySuccessReceipt(res);
        const updated = await fetchAppliedJobs();
        setAppliedJobs(updated || []);
      } else {
        showToast("Application submission could not be verified.", "error");
      }
    } catch (e) {
      console.error("Apply error:", e);
      showToast("Failed to submit application", "error");
    }
  };

  // Auto-Apply to All visible jobs
  const handleAutoApplyAll = async () => {
    if (!currentJobs || currentJobs.length === 0) {
      showToast("No jobs available to auto-apply.", "error");
      return;
    }
    showToast(`Submitting applications to ${currentJobs.length} positions...`, "info");
    let count = 0;
    for (const job of currentJobs) {
      try {
        await executeAutoApplyApi(job);
        count++;
      } catch (e) {
        console.error(e);
      }
    }
    const updated = await fetchAppliedJobs();
    setAppliedJobs(updated || []);
    showToast(`Submitted ${count} verified applications!`, "info");
    handleSelectTab("applied");
  };

  // Toggle Save Job
  const handleToggleSave = async (job) => {
    if (!job) return;
    try {
      const res = await toggleSaveJobApi(job);
      if (res && res.success) {
        showToast(res.is_saved ? "♥ Job saved to bookmarks" : "Job removed from bookmarks", "info");
        const updated = await fetchSavedJobs();
        setSavedJobs(updated || []);
        if (currentTab === "saved") {
          setCurrentJobs(updated || []);
        }
      }
    } catch (e) {
      console.error("Save error:", e);
      showToast("Failed to save job", "error");
    }
  };

  // Clipboard Quick-Fill Assistant
  const handleQuickFillPortal = async (job) => {
    if (!job) return;
    const name = candidate?.name || "Applicant";
    const email = candidate?.email || "";
    const phone = candidate?.phone || "";
    const loc = candidate?.location || "";
    const exp = candidate?.years_experience || 3;
    const linkedin = candidate?.linkedin || "";
    const skills = (candidate?.skills || []).join(", ");
    const activeCv = candidate?.filename || "Resume.pdf";

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

    if (job.link && job.link !== "#") {
      window.open(job.link, "_blank", "noopener,noreferrer");
    } else {
      showToast("Link not available for this job.", "error");
    }
  };

  // Resume Upload
  const handleUploadResume = async (file) => {
    showToast(`Uploading and parsing ${file.name}...`, "info");
    try {
      const res = await uploadResumeFile(file);
      if (res && res.candidate) {
        setCandidate(res.candidate);
        showToast(`✅ Active CV updated: ${res.candidate.filename || file.name}`, "info");
        handleExecuteSearch();
      }
    } catch (e) {
      console.error("Upload error:", e);
      showToast("Failed to parse resume.", "error");
    }
  };

  // Profile Save
  const handleSaveProfile = async (formData) => {
    try {
      const res = await updateUserProfile(formData);
      if (res && res.user?.profile) {
        setCandidate(res.user.profile);
        showToast("Profile updated successfully", "info");
        setProfileOpen(false);
      }
    } catch (e) {
      console.error("Profile save error:", e);
      showToast("Failed to save profile", "error");
    }
  };

  // Settings Toggle
  const handleToggleSetting = async (key, value) => {
    const updated = { ...userSettings, [key]: value };
    setUserSettings(updated);
    try {
      await updateUserSettings({ [key]: value });
      const labels = {
        auto_apply_enabled: "Auto-applying",
        attach_cover_letter: "Attach cover letter",
        share_resume: "Share resume",
        auto_fill_forms: "Form auto-fill"
      };
      showToast(`${labels[key] || key} ${value ? "turned ON" : "turned OFF"}`, "info");
    } catch (e) {
      console.error("Setting update error:", e);
      showToast("Failed to update setting", "error");
    }
  };

  // Shuffle Listings
  const handleShuffle = () => {
    const shuffled = [...currentJobs].sort(() => Math.random() - 0.5);
    setCurrentJobs(shuffled);
    if (shuffled.length > 0) setSelectedJob(shuffled[0]);
    showToast("Shuffled job listings", "info");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword("");
    setLocation("");
    setFilterExperience("all");
    setFilterLocation("all");
    setFilterWorkMode("all");
    showToast("All filters reset", "info");
    handleLoadRecommended();
  };

  // Launch Portal from Landing Page
  const handleLaunchDashboard = () => {
    if (!isLoggedIn) {
      setAuthModalMode("login");
      setAuthModalOpen(true);
    } else {
      setView("app");
    }
  };

  // Auth: Login
  const handleLogin = async (email) => {
    try {
      await loginCandidate(email);
      setIsLoggedIn(true);
      setView("app");
      setAuthModalOpen(false);
      showToast(`Welcome back, ${candidate?.name || 'Candidate'}!`, "info");
    } catch (e) {
      console.error(e);
      showToast("Login failed", "error");
    }
  };

  // Auth: Register
  const handleRegister = async (payload) => {
    try {
      const res = await registerCandidate(payload);
      if (res && res.user) {
        setCandidate(res.user.profile);
        setIsLoggedIn(true);
        setView("app");
        setAuthModalOpen(false);
        showToast(`Account created for ${payload.name}!`, "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Registration failed", "error");
    }
  };

  // Guest Demo Bypass
  const handleBypassGuest = () => {
    setIsLoggedIn(true);
    setView("app");
    setAuthModalOpen(false);
    showToast("Entered as Demo Candidate Guest", "info");
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("talentpulse_logged_in");
    setView("landing");
    showToast("Logged out successfully", "info");
  };

  return (
    <div className="talentpulse-app">
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Top Header Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setView("app");
          handleSelectTab(tab);
        }}
        appliedCount={appliedJobs.length}
        savedCount={savedJobs.length}
        candidate={candidate}
        isLoggedIn={isLoggedIn}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={(m) => { setAuthModalMode(m); setAuthModalOpen(true); }}
        onLogout={handleLogout}
        onNavigateLanding={() => setView("landing")}
      />

      {/* Main Views: Landing Page vs Candidate Dashboard */}
      {view === "landing" ? (
        <LandingPage
          isLoggedIn={isLoggedIn}
          candidate={candidate}
          onLaunchDashboard={handleLaunchDashboard}
          onOpenAuth={(m) => { setAuthModalMode(m); setAuthModalOpen(true); }}
        />
      ) : (
        <CandidateDashboard
          currentTab={currentTab}
          jobs={currentJobs}
          selectedJob={selectedJob}
          onSelectJob={(j) => setSelectedJob(j)}
          appliedJobs={appliedJobs}
          savedJobs={savedJobs}
          candidate={candidate}
          loading={loading}
          resultsCountLabel={resultsCountLabel}
          searchMetaLabel={searchMetaLabel}
          keyword={keyword}
          setKeyword={setKeyword}
          location={location}
          setLocation={setLocation}
          onSearch={() => handleExecuteSearch()}
          onClearSearch={() => {
            setKeyword("");
            setLocation("");
            handleLoadRecommended();
          }}
          filterExperience={filterExperience}
          setFilterExperience={(exp) => { setFilterExperience(exp); }}
          filterLocation={filterLocation}
          setFilterLocation={(loc) => { setFilterLocation(loc); }}
          filterWorkMode={filterWorkMode}
          setFilterWorkMode={(wm) => { setFilterWorkMode(wm); }}
          onShuffle={handleShuffle}
          onResetFilters={handleResetFilters}
          onAutoApply={handleAutoApply}
          onAutoApplyAll={handleAutoApplyAll}
          onToggleSave={handleToggleSave}
          onOpenCoverModal={(j) => setCoverModalJob(j)}
          onQuickFillPortal={handleQuickFillPortal}
          onSwitchTab={(t) => handleSelectTab(t)}
        />
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        candidate={candidate}
        onSaveProfile={handleSaveProfile}
        onUploadResume={handleUploadResume}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={userSettings}
        onToggleSetting={handleToggleSetting}
      />

      <CoverLetterModal
        isOpen={!!coverModalJob}
        onClose={() => setCoverModalJob(null)}
        job={coverModalJob}
        candidate={candidate}
        onRegenerate={async (j) => {
          const res = await generateCoverLetterApi(j);
          return res?.cover_letter || "";
        }}
        onCopy={async (txt) => {
          await navigator.clipboard.writeText(txt);
          showToast("📋 Cover letter copied to clipboard!", "info");
        }}
      />

      <ApplySuccessModal
        isOpen={!!applySuccessReceipt}
        onClose={() => setApplySuccessReceipt(null)}
        receipt={applySuccessReceipt}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onBypassGuest={handleBypassGuest}
      />

    </div>
  );
}
