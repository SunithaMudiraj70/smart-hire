import React from 'react';
import ApplicationAuditCard from './ApplicationAuditCard';

export default function JobDetail({
  job,
  isApplied,
  isSaved,
  appRecord,
  candidate,
  onAutoApply,
  onToggleSave,
  onOpenCoverModal,
  onQuickFillPortal
}) {
  if (!job) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>No job selected</div>
        <div style={{ fontSize: "13px", marginTop: "4px" }}>Select a job card on the left to view details and apply.</div>
      </div>
    );
  }

  const matchScore = job.match?.score || 75;
  const matchedSkills = job.match?.matched_skills || [];
  const missingSkills = job.match?.missing_skills || [];

  let salaryDisplay = job.salary;
  if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
    salaryDisplay = "Competitive / Market Standard";
  }

  return (
    <div id="jobDetailContainer">
      <div className="detail-header">
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <h2 className="detail-title">{job.title}</h2>
          <span
            className="portal-badge"
            style={{
              background: job.source_badge_color || "#057642",
              fontSize: "11px",
              padding: "3px 8px"
            }}
          >
            {job.source || "Portal"}
          </span>
        </div>

        <div className="detail-company-line">
          <span>🏢 {job.company}</span>
          <span className="rating-tag">{job.rating || "4.4 ★"}</span>
          {isApplied && (
            <span className="status-badge-applied">✓ Application Submitted</span>
          )}
        </div>

        <div className="detail-loc-salary">
          <span className="detail-chip">📍 {job.location || "Remote / India"}</span>
          <span className="detail-chip">💼 {job.job_type || "Full-time"}</span>
          <span className="detail-chip">💰 {salaryDisplay}</span>
          <span className="detail-chip">⏱️ {job.experience || "2+ years"}</span>
        </div>

        <div className="action-row">
          
          {/* 1-Click Auto Apply */}
          <button
            className={`btn-auto-apply ${isApplied ? "applied" : ""}`}
            onClick={() => onAutoApply(job)}
          >
            <span>{isApplied ? "✅ Application Submitted" : "⚡ Auto-Apply in 1-Click"}</span>
          </button>

          {/* Direct Official Careers Portal */}
          {job.direct_apply_url && (
            <a
              href={job.direct_apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-direct-careers"
              title="Open verified official employer careers portal"
            >
              <span>🏢 Company Careers</span> ↗
            </a>
          )}

          {/* Direct Portal Link with Quick-Fill Assistant */}
          <button
            className="btn-apply-portal"
            onClick={() => onQuickFillPortal(job)}
            title="Copies profile & pitch to clipboard, then opens job portal"
          >
            <span>Open Job Link</span> ↗
          </button>

          {/* Bookmark Toggle */}
          <button
            className={`btn-save-job ${isSaved ? "saved" : ""}`}
            onClick={() => onToggleSave(job)}
          >
            <span>{isSaved ? "♥ Saved" : "♡ Save"}</span>
          </button>

          {/* Tailored Cover Letter Modal */}
          <button
            className="btn-save-job"
            onClick={() => onOpenCoverModal(job)}
          >
            <span>📄 Tailored Note</span>
          </button>

        </div>
      </div>

      {/* Application Audit & Verification Receipt Card */}
      {isApplied && (
        <ApplicationAuditCard appRecord={appRecord} candidate={candidate} />
      )}

      {/* CV Fit Breakdown */}
      <div className="cv-match-box">
        <div className="cv-match-header">
          <span className="cv-match-title">
            <span>🎯</span> Profile Match
          </span>
          <span className="cv-match-score">{matchScore}% Match Fit</span>
        </div>

        <div style={{ fontSize: "13px", color: "#166534", lineHeight: 1.5, marginBottom: "8px" }}>
          {job.match?.rationale || "Your background aligns with the core requirements of this role."}
        </div>

        <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Skills from your profile that match:</div>
        <div className="matched-skills-tags">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((s, idx) => (
              <span key={idx} className="skill-tag-match">✓ {s}</span>
            ))
          ) : (
            <span style={{ fontSize: "12px", color: "#64748b" }}>Profile skills aligned</span>
          )}

          {missingSkills.map((s, idx) => (
            <span key={idx} className="skill-tag-missing">+ {s}</span>
          ))}
        </div>
      </div>

      {/* Job Description */}
      <div>
        <div className="detail-section-title">Job Details &amp; Qualifications</div>
        <div className="detail-body-text" style={{ whiteSpace: "pre-line" }}>
          {job.description || "No full description available."}
        </div>
      </div>
    </div>
  );
}
