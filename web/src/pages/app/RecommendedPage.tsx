import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, Loader2, Copy, ExternalLink, Bookmark } from 'lucide-react';
import api from '../../lib/axios';
import { Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getJobApplyUrl } from '../../lib/getJobApplyUrl';
import { formatSalary } from '../../lib/salary';
import { EmptyState } from '../../components/common/EmptyState';
import { ApplyConfirmModal } from '../../components/modals/ApplyConfirmModal';
import { useApplyFlow } from '../../hooks/useApplyFlow';

export const RecommendedPage: React.FC = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [removedJobIds, setRemovedJobIds] = useState<Set<string>>(new Set());

  const {
    handleApply,
    pendingConfirm,
    handleConfirm,
    handleDismissConfirm,
    toastMessage,
    setToastMessage
  } = useApplyFlow();

  const { data, isLoading } = useQuery<{ jobs: Job[]; candidate_name: string }>({
    queryKey: ['recommended-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/recommended');
      return res.data;
    },
  });

  const jobs = data?.jobs || [];

  // Saved jobs set
  const { data: savedJobs = [] } = useQuery<Job[]>({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/saved');
      return res.data;
    },
  });

  const savedIds = new Set(savedJobs.map((j) => j.id));

  const toggleSaveMutation = useMutation({
    mutationFn: async (job: Job) => {
      const isSaved = savedIds.has(job.id);
      if (isSaved) {
        await api.delete(`/api/jobs/saved/${job.id}`);
        return { is_saved: false };
      } else {
        const res = await api.post('/api/jobs/save', { job });
        return res.data;
      }
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      setToastMessage(resData.is_saved ? 'Job saved to your bookmarks.' : 'Job removed from bookmarks.');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const handleCopyCoverLetter = async (job: Job) => {
    try {
      const res = await api.post('/api/jobs/copy-cover-letter', { job });
      if (res.data?.clipboard_text) {
        await navigator.clipboard.writeText(res.data.clipboard_text);
        setToastMessage('Cover letter copied to clipboard!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setToastMessage('Failed to copy cover letter.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingConfirm && (
        <ApplyConfirmModal
          isOpen={true}
          jobTitle={pendingConfirm.title}
          companyName={pendingConfirm.company}
          onConfirm={(notes) => handleConfirm(notes)}
          onDismiss={handleDismissConfirm}
        />
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-700 text-white shadow-md mb-6">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles size={14} />
          <span>Curated Recommendations</span>
        </div>
        <h1 className="text-2xl font-extrabold">
          Recommended Positions for {user?.name || 'You'}
        </h1>
        <p className="text-sm text-indigo-100 mt-1 max-w-2xl">
          Positions scored directly against your verified profile skills:{' '}
          <span className="font-semibold text-white">
            {(profile?.skills || ['Python', 'SQL', 'FastAPI']).slice(0, 6).join(', ')}
          </span>
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-40" />
          ))}
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <EmptyState
          title="No recommendations available yet"
          description="Try updating your skills in Settings or searching for specific titles to seed your preferences."
        />
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.filter((j) => !removedJobIds.has(j.id)).map((job) => {
            const isSaved = savedIds.has(job.id);
            const score = job.match?.score ?? 80;
            const salaryText = formatSalary(job.salary);

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-brand-500/50 transition text-left"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {job.company}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shrink-0">
                      {score}% Fit
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <span>{job.location}</span>
                    {salaryText && <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">• {salaryText}</span>}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(job.skills || []).slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleCopyCoverLetter(job)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
                  >
                    <Copy size={13} />
                    <span>Copy cover letter</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSaveMutation.mutate(job)}
                      className={`p-1.5 rounded-lg border transition ${
                        isSaved
                          ? 'border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-950/40'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save job'}
                    >
                      <Bookmark size={15} className={isSaved ? 'fill-brand-600' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(job)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      <span>Apply on {job.source || 'Portal'}</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
