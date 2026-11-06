import React, { useState, useEffect } from 'react';

export default function ProfileModal({
  isOpen,
  onClose,
  candidate,
  onSaveProfile,
  onUploadResume
}) {
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    years_experience: 3,
    target_roles: "",
    skills: ""
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || "",
        headline: candidate.headline || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",
        years_experience: candidate.years_experience || 3,
        target_roles: Array.isArray(candidate.target_roles)
          ? candidate.target_roles.join(", ")
          : (candidate.target_roles || ""),
        skills: Array.isArray(candidate.skills)
          ? candidate.skills.join(", ")
          : (candidate.skills || "")
      });
    }
  }, [candidate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const roles = formData.target_roles.split(",").map(r => r.strip ? r.strip() : r.trim()).filter(Boolean);
    const skills = formData.skills.split(",").map(s => s.strip ? s.strip() : s.trim()).filter(Boolean);

    onSaveProfile({
      ...formData,
      target_roles: roles,
      skills: skills,
      years_experience: Number(formData.years_experience) || 3
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadResume(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadResume(e.target.files[0]);
    }
  };

  const activeCvFilename = candidate?.filename || "Active_Resume.pdf";
  const skillsCount = (candidate?.skills || []).length;
  const expYears = candidate?.years_experience || 3;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title">My Candidate Profile &amp; Resume</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Active CV Status Card */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>📄</span>
              <strong style={{ color: "#15803d", fontSize: "14px" }}>{activeCvFilename}</strong>
            </div>
            <span style={{ background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px" }}>
              Active for 1-Click Apply
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#166534" }}>
            {skillsCount} Skills Extracted • {expYears} Yrs Experience • Ready for 1-Click Applications
          </div>
        </div>

        {/* Dropzone for Updating Resume */}
        <div
          className={`cv-drop-box ${isDragging ? "dragover" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          style={{ marginBottom: "18px" }}
        >
          <div className="drop-icon">📤</div>
          <div className="drop-title">Drop new resume here to update or replace your CV</div>
          <div className="drop-sub">Supports PDF files • Extracts skills, experience, and contact info instantly</div>
          <label className="btn-file-select" style={{ display: "inline-block", marginTop: "10px" }}>
            Browse Computer
            <input
              type="file"
              accept=".pdf,.txt"
              style={{ display: "none" }}
              onChange={handleFileInput}
            />
          </label>
        </div>

        {/* Candidate Profile Details Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Professional Headline</label>
              <input
                type="text"
                className="form-input"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / City</label>
              <input
                type="text"
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Years of Experience</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="40"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label">Target Roles (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.target_roles}
              onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label">Core Skills (comma-separated)</label>
            <textarea
              className="form-input"
              rows="3"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: "18px" }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Profile Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
