import React, { useState, useEffect } from 'react';

export default function CoverLetterModal({
  isOpen,
  onClose,
  job,
  candidate,
  onRegenerate,
  onCopy
}) {
  const [letterText, setLetterText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job && candidate && isOpen) {
      // Default initial letter
      const name = candidate.name || "Candidate";
      const company = job.company || "Hiring Team";
      const title = job.title || "Position";
      const skills = (candidate.skills || []).slice(0, 4).join(", ") || "Machine Learning and Python";

      setLetterText(
        `Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${title} position currently open at ${company}. With my background in ${skills}, I am confident in my ability to make an immediate, impactful contribution to your engineering initiatives.\n\nThroughout my career, I have dedicated myself to architecting scalable systems, deploying reliable machine learning and web solutions, and solving complex domain challenges. The work your team is pursuing at ${company} strongly aligns with my technical focus, and I am particularly drawn to your commitment to engineering excellence.\n\nThank you for your consideration of my candidacy. I welcome the opportunity to discuss how my qualifications align with your objectives.\n\nSincerely,\n${name}\n${candidate.email || ""}\n${candidate.phone || ""}`
      );
    }
  }, [job, candidate, isOpen]);

  if (!isOpen || !job) return null;

  const handleRegenerateClick = async () => {
    setLoading(true);
    const result = await onRegenerate(job);
    if (result) {
      setLetterText(result);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title">
            Tailored AI Cover Letter — {job.company}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
          Synthesized specifically for the <strong>{job.title}</strong> role using your active profile and skills.
        </p>

        <textarea
          className="form-input"
          rows="12"
          value={letterText}
          onChange={(e) => setLetterText(e.target.value)}
          style={{ fontFamily: "inherit", lineHeight: 1.6, fontSize: "13.5px", padding: "14px" }}
        />

        <div className="modal-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRegenerateClick}
            disabled={loading}
          >
            <span>{loading ? "⏳ Synthesizing with AI..." : "✨ Regenerate with Ollama AI"}</span>
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onCopy(letterText)}
            >
              📋 Copy Letter to Clipboard
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
