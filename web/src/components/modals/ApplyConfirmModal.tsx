import React from 'react';
import { CheckCircle2, Clock, X, ExternalLink } from 'lucide-react';
import { triggerConfetti } from '../../lib/confetti';

interface PendingApplication {
  id: string;
  title: string;
  company: string;
  apply_url: string;
}

interface ApplyConfirmModalProps {
  pending?: PendingApplication | null;
  isOpen?: boolean;
  jobTitle?: string;
  companyName?: string;
  onConfirm: (notes?: string) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export const ApplyConfirmModal: React.FC<ApplyConfirmModalProps> = ({
  pending,
  isOpen = true,
  jobTitle,
  companyName,
  onConfirm,
  onDismiss,
  isLoading = false,
}) => {
  const displayTitle = pending?.title || jobTitle || 'Position';
  const displayCompany = pending?.company || companyName || 'Company';
  if (!isOpen && !pending) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-brand-600 dark:text-brand-dark flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Application Follow-up
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Honest application tracking
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          Did you complete and submit your application for{' '}
          <span className="font-bold text-slate-900 dark:text-white">{displayTitle}</span> at{' '}
          <span className="font-bold text-slate-900 dark:text-white">{displayCompany}</span>?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Not yet
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              triggerConfetti();
              onConfirm();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition disabled:opacity-60"
          >
            <CheckCircle2 size={15} />
            <span>{isLoading ? 'Updating...' : 'Yes, I applied! 🎉'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

