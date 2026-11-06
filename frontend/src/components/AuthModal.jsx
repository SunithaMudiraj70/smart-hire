import React, { useState } from 'react';

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onLogin,
  onRegister,
  onBypassGuest
}) {
  const [mode, setMode] = useState(initialMode);
  const [loginEmail, setLoginEmail] = useState("");
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "Hyderabad, Telangana",
    target_roles: "Machine Learning Engineer, AI Engineer",
    skills: "Python, PyTorch, Machine Learning, FastAPI, Docker",
    years_experience: 3
  });

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginEmail.trim()) {
      onLogin(loginEmail.trim());
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    onRegister(registerForm);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title">
            {mode === "login" ? "Sign In to TalentPulse" : "Create Candidate Account"}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
          <button
            type="button"
            className={`nav-tab-btn ${mode === "login" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px", borderBottom: mode === "login" ? "2px solid #0284c7" : "none" }}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${mode === "register" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px", borderBottom: mode === "register" ? "2px solid #0284c7" : "none" }}
            onClick={() => setMode("register")}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">Candidate Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="alex@gmail.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: "14px", fontWeight: 700 }}>
              Sign In to Candidate Dashboard
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Alex Thomas"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="candidate@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 7569615202"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Hyderabad, Telangana"
                  value={registerForm.location}
                  onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "10px" }}>
              <label className="form-label">Target Roles (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Machine Learning Engineer, AI Specialist"
                value={registerForm.target_roles}
                onChange={(e) => setRegisterForm({ ...registerForm, target_roles: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginTop: "10px" }}>
              <label className="form-label">Core Skills (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Python, PyTorch, Machine Learning, FastAPI"
                value={registerForm.skills}
                onChange={(e) => setRegisterForm({ ...registerForm, skills: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: "14px", fontWeight: 700, marginTop: "16px" }}>
              Register &amp; Open Portal
            </button>
          </form>
        )}

        {/* Demo Guest Access */}
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #e2e8f0", textAlign: "center" }}>
          <button
            type="button"
            className="filter-dropdown-btn"
            onClick={onBypassGuest}
            style={{ width: "100%", padding: "8px", fontSize: "12.5px", color: "#475569" }}
          >
            ⚡ Continue as Guest (Demo Access)
          </button>
        </div>

      </div>
    </div>
  );
}
