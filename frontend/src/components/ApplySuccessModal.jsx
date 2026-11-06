import React from 'react';

export default function ApplySuccessModal({
  isOpen,
  onClose,
  receipt
}) {
  if (!isOpen || !receipt) return null;

  let salaryDisplay = receipt.salary;
  if (!salaryDisplay || salaryDisplay.toLowerCase() === "applied") {
    salaryDisplay = "Competitive / Market Standard";
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title" style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✅</span> Application Submitted &amp; Verified!
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
          <div style={{ fontWeight: 700, color: "#15803d", fontSize: "15px", marginBottom: "4px" }}>
            {receipt.job_title} at {receipt.company}
          </div>
          <div style={{ fontSize: "12.5px", color: "#166534", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span>
              <strong>Ref ID:</strong>{" "}
              <code style={{ background: "#dcfce7", padding: "1px 5px", borderRadius: "4px" }}>
                {receipt.application_id}
              </code>
            </span>
            <span><strong>Status:</strong> {receipt.status || "Submitted & Verified"}</span>
          </div>
        </div>

        <div style={{ marginBottom: "12px", fontSize: "12.5px", color: "#334155", lineHeight: 1.6 }}>
          <div><strong>Candidate:</strong> {receipt.candidate_name} ({receipt.candidate_email || "verified"})</div>
          <div><strong>Location:</strong> {receipt.location || "Remote / India"} • <strong>Salary:</strong> {salaryDisplay}</div>
          <div><strong>CV Attached:</strong> Active Profile Verified</div>
        </div>

        <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "4px" }}>
          Tailored Cover Note:
        </div>
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "10px",
          fontSize: "12.5px",
          fontStyle: "italic",
          color: "#334155",
          maxHeight: "140px",
          overflowY: "auto"
        }}>
          "{receipt.cover_letter_preview || receipt.full_cover_letter || "Cover letter attached"}"
        </div>

        <div className="modal-actions" style={{ marginTop: "18px" }}>
          <button className="btn-primary" onClick={onClose} style={{ width: "100%", padding: "10px" }}>
            Great, Continue Finding Jobs
          </button>
        </div>

      </div>
    </div>
  );
}
