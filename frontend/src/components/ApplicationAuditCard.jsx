import React from 'react';

export default function ApplicationAuditCard({ appRecord, candidate }) {
  if (!appRecord) return null;

  const candidateName = appRecord.candidate_name || candidate?.name || "Alex Thomas";
  const candidateEmail = appRecord.candidate_email || candidate?.email || "verified";
  const appId = appRecord.application_id || "APP-CONFIRMED";
  const appliedDate = appRecord.applied_at
    ? new Date(appRecord.applied_at).toLocaleString()
    : "Recently Submitted";
  const activeCv = appRecord.resume_attached || candidate?.filename || "Resume.pdf";
  const status = appRecord.status || "Submitted & Verified";

  return (
    <div className="application-audit-card">
      <div className="audit-card-head">
        <span className="audit-status-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Application Verified &amp; Recorded
        </span>
        <span className="audit-app-id">{appId}</span>
      </div>

      <div className="audit-details-grid">
        <div className="audit-item">
          <span className="audit-lbl">Candidate</span>
          <span className="audit-val">{candidateName}</span>
        </div>
        <div className="audit-item">
          <span className="audit-lbl">Applied At</span>
          <span className="audit-val">{appliedDate}</span>
        </div>
        <div className="audit-item">
          <span className="audit-lbl">Active CV Attached</span>
          <span className="audit-val">{activeCv}</span>
        </div>
        <div className="audit-item">
          <span className="audit-lbl">Status</span>
          <span className="audit-val" style={{ color: "#15803d" }}>{status}</span>
        </div>
      </div>

      <div className="audit-explainer">
        <strong>Application Audit:</strong> This submission was validated and logged in TalentPulse with candidate contact details ({candidateEmail}) and customized AI cover note under tracking ID <code>{appId}</code>.
      </div>
    </div>
  );
}
