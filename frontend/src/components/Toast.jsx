import React from 'react';

export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toastContainer" className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span>{t.type === "error" ? "⚠️" : "✓"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
