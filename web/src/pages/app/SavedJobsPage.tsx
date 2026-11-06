import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, MapPin, ExternalLink, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../lib/axios';
import { Job } from '../../types';
import { formatSalary } from '../../lib/salary';
import { getJobApplyUrl } from '../../lib/getJobApplyUrl';

export const SavedJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: savedJobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['saved-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/saved');
      return res.data;
    },
  });

  const removeSaveMutation = useMutation({
    mutationFn: async (job: Job) => {
      const res = await api.post('/api/jobs/save', { job });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      setToastMessage('Removed job from bookmarks.');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const handleCopyCoverLetter = async (job: Job) => {
    try {
      const res = await api.post('/api/jobs/copy-cover-letter', { job });
      if (res.data?.cover_letter) {
        await navigator.clipboard.writeText(res.data.cover_letter);
        setToastMessage('Cover letter copied to clipboard!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      setToastMessage('Failed to copy cover letter.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Bookmark size={22} className="text-brand-600 dark:text-brand-dark" />
          Saved Jobs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Positions you've bookmarked for careful review and follow-up.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-36" />
          ))}
        </div>
      )}

      {!isLoading && savedJobs.length === 0 && (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bookmark className="mx-auto text-slate-400 mb-3" size={32} />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No saved jobs yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bookmark positions in the Find Jobs search feed to review them anytime.
          </p>
        </div>
      )}

      {!isLoading && savedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {job.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      {job.company}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSaveMutation.mutate(job)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition"
                    title="Remove from saved"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin size={13} />
                  <span>{job.location}</span>
                  {formatSalary(job.salary) && <span className="font-semibold text-slate-700 dark:text-slate-300 ml-2">• {formatSalary(job.salary)}</span>}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                  {job.description}
                </p>
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

                <a
                  href={getJobApplyUrl(job) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                >
                  <span>Apply on {job.source || 'Portal'}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

