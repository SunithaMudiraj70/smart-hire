import React from 'react';

export default function JobCard({
  job,
  isSelected,
  isApplied,
  isSaved,
  onSelect,
  onToggleSave
}) {
  const matchScore = job.match?.score || 75;
  const matchedSkills = (job.match?.matched_skills || []).slice(0, 3).join(", ");

  let salaryDisplay = job.salary;
  if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
    salaryDisplay = "Competitive / Market Rate";
  }

  return (
    <div
      className={`job-card-item ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="card-top">
        <h3 className="card-title">{job.title}</h3>
        <span
          className="portal-badge"
          style={{ background: job.source_badge_color || "#057642" }}
        >
          {job.source || "Portal"}
        </span>
      </div>

      <div className="company-line">
        <span style={{ fontWeight: 600 }}>{job.company}</span>
        <span className="rating-tag">{job.rating || "4.4 ★"}</span>
        {isApplied && <span className="status-badge-applied">✓ Applied</span>}
      </div>

      <div className="loc-salary-row">
        <span>📍 {job.location || "Remote / India"}</span>
        <span>💰 {salaryDisplay}</span>
      </div>

      <div className="cv-match-pill">
        <span>✨</span> <strong>{matchScore}% Match</strong>
        {matchedSkills && (
          <span style={{ fontWeight: 400, color: "#15803d" }}>• {matchedSkills}</span>
        )}
      </div>

      <div className="card-snippet">
        {job.description || ""}
      </div>

      <div className="card-footer">
        <span>🕒 {job.posted || "Recent"}</span>
        <button
          className="btn-clear-search"
          style={{ padding: 0, height: "auto", fontSize: "14px" }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(job);
          }}
          title={isSaved ? "Unsave Job" : "Save Job"}
        >
          {isSaved ? "♥" : "♡"}
        </button>
      </div>
    </div>
  );
}
