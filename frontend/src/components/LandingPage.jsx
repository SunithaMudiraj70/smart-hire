import React from 'react';

export default function LandingPage({
  isLoggedIn,
  candidate,
  onLaunchDashboard,
  onOpenAuth
}) {
  return (
    <div className="landing-page">
      
      {/* Landing Top Header */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <div className="nav-brand-btn">
            <span className="brand-icon-box">TP</span>
            <span className="brand-text">TalentPulse</span>
          </div>

          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Agentic Workflow</a>
            <a href="#integrations">ATS Integrations</a>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isLoggedIn ? (
              <button
                className="btn-primary"
                onClick={onLaunchDashboard}
                style={{ padding: "8px 18px", fontSize: "13.5px" }}
              >
                Go to Dashboard ({candidate?.name?.split(" ")[0] || "User"}) ↗
              </button>
            ) : (
              <>
                <button
                  className="btn-clear-search"
                  onClick={() => onOpenAuth("login")}
                  style={{ height: "36px", padding: "0 14px", fontSize: "13.5px", fontWeight: 600, color: "#334155" }}
                >
                  Sign In
                </button>
                <button
                  className="btn-primary"
                  onClick={() => onOpenAuth("register")}
                  style={{ padding: "8px 18px", fontSize: "13.5px" }}
                >
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          
          <div className="landing-badge">
            <span>✨</span> Next-Gen Autonomous Job Acquisition Suite
          </div>

          <h1 className="landing-title">
            Land Your Dream Job Faster with <span style={{ color: "#0284c7" }}>Autonomous AI Applications</span>
          </h1>

          <p className="landing-subtitle">
            TalentPulse automates multi-portal job aggregation from Greenhouse ATS, RemoteOK, LinkedIn, and enterprise employer feeds. Match your resume with sub-second precision and auto-submit tailored applications with verifiable audit receipts.
          </p>

          <div className="landing-cta-row">
            <button
              className="btn-primary landing-btn-hero"
              onClick={onLaunchDashboard}
            >
              <span>⚡ Launch Candidate Dashboard</span> ↗
            </button>

            <button
              className="btn-secondary landing-btn-hero"
              onClick={() => onOpenAuth("register")}
            >
              <span>👤 Create Candidate Account</span>
            </button>
          </div>

          {/* Social Proof / Portal Pills */}
          <div className="portal-pills-row">
            <span className="portal-pill-item">✓ Greenhouse ATS Direct</span>
            <span className="portal-pill-item">✓ RemoteOK Verified</span>
            <span className="portal-pill-item">✓ Arbeitnow Tech Feeds</span>
            <span className="portal-pill-item">✓ Targeted Company Careers</span>
            <span className="portal-pill-item">✓ Local Ollama / Llama 3</span>
          </div>

        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          
          <div className="section-head">
            <h2 className="section-title">Designed for Modern High-Growth Careers</h2>
            <p className="section-subtitle">
              Everything you need to automate tedious job searching, personalize cover letters, and track verified submissions.
            </p>
          </div>

          <div className="feature-grid">
            
            <div className="feature-card">
              <div className="feature-icon-box">🔍</div>
              <h3 className="feature-title">Live Multi-Portal Search</h3>
              <p className="feature-desc">
                Evaluate boolean expressions like <code>("Machine Learning" OR "AI") AND "Python"</code> across live APIs and direct employer boards with sub-second indexing.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">🎯</div>
              <h3 className="feature-title">AI Resume Intelligence</h3>
              <p className="feature-desc">
                Cascading parsers extract core skills, work tenure, contact details, and target roles from PDF CVs. Computes deterministic fit scores and customized improvement notes.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">⚡</div>
              <h3 className="feature-title">1-Click Auto-Apply & Receipts</h3>
              <p className="feature-desc">
                Submits applications in 1 click and issues permanent audit records with reference IDs (<code>APP-YYYYMMDD-XXXX</code>) and customized cover letters synced to Supabase.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">📋</div>
              <h3 className="feature-title">Clipboard Quick-Fill Bridge</h3>
              <p className="feature-desc">
                Bypasses aggressive bot blocks on protected job boards by pre-formatting candidate credentials and pitch directly to your clipboard for instant form pasting.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">⚙️</div>
              <h3 className="feature-title">Granular Automation Controls</h3>
              <p className="feature-desc">
                Full user control over auto-applying, AI cover note generation, and profile resume sharing toggles saved in real-time to your preferences.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">🔒</div>
              <h3 className="feature-title">Privacy-First Architecture</h3>
              <p className="feature-desc">
                Your data stays private. Powered by local Ollama AI models with optional remote PostgreSQL persistence on Supabase or resilient local JSON storage.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Agentic Workflow Pipeline */}
      <section className="landing-section bg-alt" id="workflow">
        <div className="landing-container">
          
          <div className="section-head">
            <h2 className="section-title">The Autonomous Agentic Workflow</h2>
            <p className="section-subtitle">
              How TalentPulse accelerates your job acquisition journey in 4 automated stages.
            </p>
          </div>

          <div className="workflow-steps-grid">
            
            <div className="workflow-step-card">
              <div className="step-num">01</div>
              <h4 className="step-title">Ingest &amp; Parse</h4>
              <p className="step-desc">Drop your PDF resume. Our parser extracts 50+ tech skills, seniority, and contact information automatically.</p>
            </div>

            <div className="workflow-step-card">
              <div className="step-num">02</div>
              <h4 className="step-title">Multi-Board Scraping</h4>
              <p className="step-desc">Searches live Greenhouse, RemoteOK, and corporate portals simultaneously for openings matching your exact location and mode.</p>
            </div>

            <div className="workflow-step-card">
              <div className="step-num">03</div>
              <h4 className="step-title">Match &amp; Synthesize</h4>
              <p className="step-desc">Calculates semantic CV alignment percentages and drafts bespoke 3-paragraph cover letters tailored to each company.</p>
            </div>

            <div className="workflow-step-card">
              <div className="step-num">04</div>
              <h4 className="step-title">Dispatch &amp; Audit</h4>
              <p className="step-desc">Transmits application payloads and stores permanent audit receipts with tracking numbers in your Applied Jobs tab.</p>
            </div>

          </div>

          <div style={{ textAlign: "center", marginTop: "36px" }}>
            <button
              className="btn-primary"
              onClick={onLaunchDashboard}
              style={{ padding: "12px 28px", fontSize: "15px", fontWeight: 700 }}
            >
              Start Finding Jobs with TalentPulse ↗
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="brand-icon-box" style={{ width: "24px", height: "24px", fontSize: "11px" }}>TP</span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>TalentPulse Enterprise</span>
            <span style={{ fontSize: "13px", color: "#64748b" }}>• Autonomous Job Acquisition Suite</span>
          </div>
          <div style={{ fontSize: "12.5px", color: "#64748b" }}>
            © {new Date().getFullYear()} TalentPulse. Built for high-performance software and AI careers.
          </div>
        </div>
      </footer>

    </div>
  );
}
