import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({
  currentTab,
  onSelectTab,
  appliedCount,
  savedCount,
  candidate,
  isLoggedIn,
  onOpenProfile,
  onOpenSettings,
  onOpenAuth,
  onLogout,
  onNavigateLanding
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: "🎯",
      title: "3 New Jobs Matched Your CV",
      time: "Just now • Canonical & HackerRank",
      unread: true
    },
    {
      id: 2,
      icon: "✅",
      title: "Application Acknowledged",
      time: "Today • Machine Learning Engineer at Canonical",
      unread: true
    },
    {
      id: 3,
      icon: "📄",
      title: "Profile CV Sync Active",
      time: "Yesterday • Active Resume verified",
      unread: false
    }
  ]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const initials = candidate?.name
    ? candidate.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "SM";

  return (
    <header className="app-nav-header">
      <div className="nav-container">
        
        {/* Left: Brand + Navigation Tabs */}
        <div className="nav-left">
          <button className="nav-brand-btn" onClick={onNavigateLanding} title="TalentPulse Home">
            <span className="brand-icon-box">TP</span>
            <span className="brand-text">TalentPulse</span>
          </button>

          <nav className="nav-tabs">
            <button
              className={`nav-tab-btn ${currentTab === "find-jobs" ? "active" : ""}`}
              onClick={() => onSelectTab("find-jobs")}
            >
              Find Jobs
            </button>
            <button
              className={`nav-tab-btn ${currentTab === "recommended" ? "active" : ""}`}
              onClick={() => onSelectTab("recommended")}
            >
              Recommended <span className="badge-rec">CV Matched</span>
            </button>
            <button
              className={`nav-tab-btn ${currentTab === "applied" ? "active" : ""}`}
              onClick={() => onSelectTab("applied")}
            >
              Applied Jobs <span className="tab-pill">{appliedCount}</span>
            </button>
            <button
              className={`nav-tab-btn ${currentTab === "saved" ? "active" : ""}`}
              onClick={() => onSelectTab("saved")}
            >
              Saved Jobs <span className="tab-pill">{savedCount}</span>
            </button>
          </nav>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="nav-right">
          
          {/* Notifications Popover */}
          <div className="nav-popover-wrap" ref={notifRef}>
            <button
              className="nav-icon-btn"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
            >
              <span className="bell-icon">🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="dropdown-popover show" id="notificationsDropdown">
                <div className="dropdown-header-row">
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>Notifications</span>
                  <button
                    className="dropdown-link-btn"
                    onClick={() => setNotifications([])}
                  >
                    Clear all
                  </button>
                </div>
                <div className="notif-items-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`}>
                        <div className="notif-icon">{n.icon}</div>
                        <div className="notif-text">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu or Auth Button */}
          {isLoggedIn ? (
            <div className="nav-popover-wrap" ref={profileRef}>
              <button
                className="profile-nav-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                title="Account & Settings"
              >
                <div className="avatar-dot">{initials}</div>
                <span className="profile-nav-name">{candidate?.name || "Candidate"}</span>
                <span className="dropdown-chevron">▾</span>
              </button>

              {profileOpen && (
                <div className="dropdown-popover profile-dropdown show">
                  <div className="dropdown-profile-header">
                    <div className="avatar-dot-large">{initials}</div>
                    <div style={{ overflow: "hidden" }}>
                      <div className="dd-name">{candidate?.name || "Candidate"}</div>
                      <div className="dd-email">{candidate?.email || "candidate@email.com"}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => { setProfileOpen(false); onOpenProfile(); }}
                  >
                    <span className="dd-item-icon">
                      <svg className="dd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <span>My Profile &amp; Resume</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => { setProfileOpen(false); onOpenSettings(); }}
                  >
                    <span className="dd-item-icon">
                      <svg className="dd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </span>
                    <span>Settings &amp; Preferences</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => { setProfileOpen(false); onOpenAuth("login"); }}
                  >
                    <span className="dd-item-icon">
                      <svg className="dd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 3 21 3 21 8"></polyline>
                        <line x1="4" y1="20" x2="21" y2="3"></line>
                        <polyline points="21 16 21 21 16 21"></polyline>
                        <line x1="15" y1="15" x2="21" y2="21"></line>
                        <line x1="4" y1="4" x2="9" y2="9"></line>
                      </svg>
                    </span>
                    <span>Switch Account / Sign Up</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item text-danger"
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                  >
                    <span className="dd-item-icon">
                      <svg className="dd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "#dc2626" }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </span>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-primary"
                style={{ padding: "7px 16px", fontSize: "13px" }}
                onClick={() => onOpenAuth("login")}
              >
                Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
