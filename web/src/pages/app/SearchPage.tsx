import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { Job } from '../../types';
import { FilterBar } from '../../components/search/FilterBar';
import { JobCard } from '../../components/jobs/JobCard';
import { JobDetail } from '../../components/jobs/JobDetail';
import { EmptyState } from '../../components/common/EmptyState';
import { ApplyConfirmModal } from '../../components/modals/ApplyConfirmModal';
import { useFilterStore } from '../../stores/filterStore';
import { useUIStore } from '../../stores/uiStore';
import { useJobs } from '../../hooks/useJobs';
import { useApplyFlow } from '../../hooks/useApplyFlow';

export { getJobApplyUrl } from '../../lib/getJobApplyUrl';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const {
    q, location, workMode, experience, posted, sort, page,
    setPage, resetFilters, syncFromParams, toSearchParams,
  } = useFilterStore();

  useEffect(() => { syncFromParams(searchParams); }, [searchParams, syncFromParams]);
  useEffect(() => {
    const nextParams = toSearchParams();
    if (nextParams.toString() !== searchParams.toString()) setSearchParams(nextParams, { replace: true });
  }, [q, location, workMode, experience, posted, sort, page, setSearchParams, toSearchParams]);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Use modular hooks
  const { jobs, total, totalPages, currentPage, isLoading, isError, refetch } = useJobs();
  const { handleApply, pendingConfirm, handleConfirm, handleDismissConfirm } = useApplyFlow();
  const [newJobsCount, setNewJobsCount] = useState<number>(0);

  // Background 60s refresh banner check
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/api/jobs/search', {
          params: { q, location, work_mode: workMode, experience_level: experience, posted_within: posted, sort, page: 1, page_size: 1 }
        });
        if (res.data?.total && res.data.total > total) {
          setNewJobsCount(res.data.total - total);
        }
      } catch {
        // background check fails silently
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [q, location, workMode, experience, posted, sort, total]);

  // Load saved job IDs
  useEffect(() => {
    api.get('/api/jobs/saved')
      .then((res) => setSavedJobIds(new Set((res.data || []).map((j: Job) => j.id))))
      .catch(() => {});
  }, []);

  // Default selection when jobs load
  useEffect(() => {
    if (jobs.length > 0 && (!selectedJob || !jobs.some((j) => j.id === selectedJob.id))) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  // Bookmark toggle
  const saveMutation = useMutation({
    mutationFn: async (job: Job) => {
      const isAlreadySaved = savedJobIds.has(job.id);
      if (isAlreadySaved) {
        await api.delete(`/api/jobs/saved/${job.id}`);
        return { jobId: job.id, action: 'removed' };
      }
      await api.post('/api/jobs/saved', { job });
      return { jobId: job.id, action: 'saved' };
    },
    onSuccess: ({ jobId, action }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (action === 'saved') next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      useUIStore.getState().showToast(action === 'saved' ? 'Job saved to your bookmarks.' : 'Job removed from bookmarks.', 'success');
    }
  });

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setMobileDetailOpen(true);
  };

  const handleToggleSave = (job: Job, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveMutation.mutate(job);
  };

  const handleReportBroken = async (jobId: string) => {
    try {
      await api.post(`/api/jobs/${jobId}/report`);
      useUIStore.getState().showToast('Link reported. Our automated engine will recheck it.', 'info');
    } catch {
      // ignore
    }
  };

  const allVerified = jobs.length > 0 && jobs.every((j) => j.link_status === 'ok' || !j.link_status);
  const headerCountLabel = allVerified ? `${total} Verified Jobs Found` : `${total} Jobs Found`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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

      {/* Filter Bar */}
      <FilterBar />

      {/* Result Count Strip */}
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-brand-600 dark:text-brand-dark" />
          {isLoading ? 'Scanning direct ATS feeds...' : headerCountLabel}
        </span>
        {totalPages > 1 && (
          <span className="text-slate-400 font-medium lowercase">
            page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Cards List */}
        <div className={`lg:col-span-5 space-y-3 ${mobileDetailOpen ? 'hidden lg:block' : 'block'}`}>
          {newJobsCount > 0 && (
            <button
              onClick={() => {
                refetch();
                setNewJobsCount(0);
              }}
              className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-xs animate-in fade-in"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>{newJobsCount} new {newJobsCount === 1 ? 'job' : 'jobs'} found. Click to refresh</span>
            </button>
          )}

          {isLoading ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Loader2 className="animate-spin text-brand-600 mx-auto mb-3" size={24} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Searching active opportunities...</p>
            </div>
          ) : isError || jobs.length === 0 ? (
            <EmptyState
              title="No jobs found matching your criteria"
              description="Try adjusting your keywords, broadening your location, or clearing the work mode filters."
              actionLabel="Reset all filters"
              onAction={resetFilters}
            />
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  isSaved={savedJobIds.has(job.id)}
                  onSelect={handleSelectJob}
                  onToggleSave={handleToggleSave}
                />
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs text-slate-500 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Job Detail Pane */}
        <div className={`lg:col-span-7 sticky top-20 ${mobileDetailOpen ? 'block' : 'hidden lg:block'}`}>
          {mobileDetailOpen && (
            <button
              type="button"
              onClick={() => setMobileDetailOpen(false)}
              className="lg:hidden mb-4 inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-dark"
            >
              <ArrowLeft size={14} />
              <span>Back to jobs list</span>
            </button>
          )}

          {selectedJob ? (
            <JobDetail
              job={selectedJob}
              isSaved={savedJobIds.has(selectedJob.id)}
              onToggleSave={(j) => handleToggleSave(j)}
              onApply={(j) => handleApply(j)}
              onCloseMobile={() => setMobileDetailOpen(false)}
              onReportBroken={handleReportBroken}
            />
          ) : (
            <EmptyState
              title="Select a job to view details"
              description="Choose any job from the list to see deterministic skill matching, role requirements, and direct apply links."
            />
          )}
        </div>
      </div>
    </div>
  );
};
