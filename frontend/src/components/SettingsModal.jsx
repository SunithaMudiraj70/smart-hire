import React from 'react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onToggleSetting
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title">Settings &amp; Automation Preferences</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px" }}>
          Control how TalentPulse automates your applications, drafts cover letters, and handles your data.
        </p>

        <div className="settings-list">
          
          {/* Toggle 1: Auto-Apply */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-title">Enable 1-Click Auto-Applying</div>
              <div className="setting-desc">
                When enabled, clicking "Auto-Apply" will submit your verified candidate profile directly without re-prompting.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings.auto_apply_enabled}
                onChange={(e) => onToggleSetting("auto_apply_enabled", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Toggle 2: Attach Cover Letter */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-title">Attach AI-Tailored Cover Letter</div>
              <div className="setting-desc">
                Automatically generate and attach a company-specific 3-paragraph cover letter using Ollama/Llama 3 with each application.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings.attach_cover_letter}
                onChange={(e) => onToggleSetting("attach_cover_letter", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Toggle 3: Share Resume Profile */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-title">Share Candidate Resume with Employer</div>
              <div className="setting-desc">
                Transmit your parsed resume and active PDF attachment directly to the employer's applicant tracking system.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings.share_resume}
                onChange={(e) => onToggleSetting("share_resume", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Toggle 4: Auto-Fill External ATS Forms */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-title">Auto-Fill External ATS Forms</div>
              <div className="setting-desc">
                Automatically pre-fill contact details and skills into external application links and ATS forms via clipboard assistant.
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings.auto_fill_forms}
                onChange={(e) => onToggleSetting("auto_fill_forms", e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

        </div>

        <div className="modal-actions" style={{ marginTop: "24px" }}>
          <button className="btn-primary" onClick={onClose} style={{ width: "100%", padding: "10px" }}>
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
