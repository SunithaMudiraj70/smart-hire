import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  MapPin,
  ExternalLink,
  Clock,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  Award,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import api from '../../lib/axios';
import { AppliedJobRecord } from '../../types';
import { ApplicationDetailDrawer } from '../../components/drawers/ApplicationDetailDrawer';
import { triggerConfetti, triggerStageCelebration } from '../../lib/confetti';

export const AppliedTrackerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<AppliedJobRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch applications list
  const { data: records = [], isLoading } = useQuery<AppliedJobRecord[]>({
    queryKey: ['applied-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/applied');
      return res.data;
    },
  });

  // Fetch pipeline analytics stats
  const { data: stats } = useQuery({
    queryKey: ['applications-stats'],
    queryFn: async () => {
      const res = await api.get('/api/applications/stats');
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      const res = await api.put(`/api/jobs/applied/${id}/status`, { status, note });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
      const st = (data.status || '').toLowerCase();
      if (st === 'interview' || st === 'offer') {
        triggerStageCelebration();
      } else {
        triggerConfetti();
      }
      setToastMessage(`Status updated to "${data.status}"! 🎉`);
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/jobs/applied/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
      triggerConfetti();
      setToastMessage('Application confirmed and moved to Applied! 🎉');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  const statuses = ['saved', 'clicked', 'applied', 'reviewing', 'interview', 'on_hold', 'offer', 'rejected'];

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'interview':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300';
      case 'offer':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300';
      case 'on_hold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300';
      case 'applied':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300';
      case 'clicked':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const pendingClicked = records.filter((r) => r.status?.toLowerCase() === 'clicked');
  const activeApplications = records.filter((r) => r.status?.toLowerCase() !== 'clicked');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Send size={22} className="text-brand-600 dark:text-brand-dark" />
            Application Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your candidate application lifecycle with honest audit confirmation.
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Applied</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total_applied}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Week</p>
            <p className="text-xl font-extrabold text-brand-600 dark:text-brand-dark mt-1">{stats.this_week}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Confirm</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{stats.pending_confirm}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Interviews</p>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{stats.interviews}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Offers</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{stats.offers}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Response Rate</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.response_rate}</p>
          </div>
        </div>
      )}

      {/* Section 1: Pending Confirm Group */}
      {pendingClicked.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Apply clicked: Did you submit your application? ({pendingClicked.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {pendingClicked.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</h3>
                  <p className="text-xs text-slate-500">{rec.company} • Clicked {new Date(rec.clicked_at || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => confirmMutation.mutate(rec.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Yes, I applied
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'saved' })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 transition"
                  >
                    Move to saved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Active Application Pipeline */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!isLoading && activeApplications.length === 0 && pendingClicked.length === 0 && (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Send className="mx-auto text-slate-400 mb-3" size={32} />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No applications tracked yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            When you click "Apply on &lt;source&gt;" or copy a cover letter from Search, your application reference will be logged here.
          </p>
        </div>
      )}

      {!isLoading && activeApplications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeApplications.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecord(rec)}
                className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {rec.title}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        ({rec.application_id})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{rec.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {rec.location}
                      </span>
                      {rec.applied_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock size={12} />
                            {new Date(rec.applied_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-brand-600 dark:text-brand-dark font-medium flex items-center gap-1">
                        <Sparkles size={12} />
                        View Prep & Insights
                      </span>
                    </div>
                  </div>

                  {/* Status Selector & External Link */}
                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        value={rec.status?.toLowerCase() || 'applied'}
                        onChange={(e) => updateStatusMutation.mutate({ id: rec.id, status: e.target.value })}
                        className={`text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl border-0 focus-ring cursor-pointer appearance-none capitalize ${getStatusBadge(rec.status)}`}
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white capitalize">
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>

                    {rec.job_data?.apply_url && (
                      <a
                        href={rec.job_data?.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Open external job application link"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Candidate Stage Progression Question Prompt */}
                <div
                  className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-brand-600 dark:text-brand-dark shrink-0" />
                    <span>Have you heard back from <strong>{rec.company}</strong>? Did you get shortlisted or called for an interview?</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'interview', note: 'Shortlisted / Got Interview Call' })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 transition shadow-2xs"
                    >
                      📞 Got Interview Call
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'reviewing', note: 'Application viewed and in review' })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition shadow-2xs"
                    >
                      👁️ Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'on_hold', note: 'Application put on hold' })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition shadow-2xs"
                    >
                      ⏸️ On Hold
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'offer', note: 'Received job offer' })}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      🎉 Got Offer!
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'rejected', note: 'Application rejected / not selected' })}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      ❌ Not Selected
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Detail Drawer */}
      <ApplicationDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
