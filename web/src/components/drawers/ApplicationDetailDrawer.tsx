import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Clock,
  Building,
  Sparkles,
  ExternalLink,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import api from '../../lib/axios';
import { AppliedJobRecord } from '../../types';
import { triggerConfetti, triggerStageCelebration } from '../../lib/confetti';

interface DrawerProps {
  record: AppliedJobRecord | null;
  onClose: () => void;
}

export const ApplicationDetailDrawer: React.FC<DrawerProps> = ({ record, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'insights' | 'prep'>('timeline');
  const [noteText, setNoteText] = useState(record?.notes || '');
  const queryClient = useQueryClient();

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!record) return;
      await api.put(`/api/jobs/applied/${record.id}/notes`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note?: string }) => {
      if (!record) return;
      await api.put(`/api/jobs/applied/${record.id}/status`, { status, note });
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
      const st = (status || '').toLowerCase();
      if (st === 'interview' || st === 'offer') {
        triggerStageCelebration();
      } else {
        triggerConfetti();
      }
    },
  });

  // Fetch interview prep
  const { data: prepData, isLoading: prepLoading } = useQuery({
    queryKey: ['interview-prep', record?.id],
    queryFn: async () => {
      if (!record) return null;
      const res = await api.post(`/api/applications/${record.id}/prep`);
      return res.data;
    },
    enabled: !!record && activeTab === 'prep',
  });

  // Fetch community notes for company
  const { data: communityNotes = [] } = useQuery({
    queryKey: ['community-notes', record?.company],
    queryFn: async () => {
      if (!record) return [];
      const res = await api.get(`/api/applications/community-notes?company=${encodeURIComponent(record.company)}`);
      return res.data;
    },
    enabled: !!record && activeTab === 'insights',
  });

  if (!record) return null;

  const company = record.company || 'Company';
  const role = record.title || 'Role';

  // Compliant Google site: searches (No scraping)
  const insightsLinks = [
    {
      label: 'AmbitionBox Company Reviews',
      url: `https://www.google.com/search?q=site:ambitionbox.com+${encodeURIComponent(company)}+reviews`,
    },
    {
      label: 'AmbitionBox Interview Questions',
      url: `https://www.google.com/search?q=site:ambitionbox.com+${encodeURIComponent(company)}+interview+questions`,
    },
    {
      label: 'Glassdoor India Interviews',
      url: `https://www.google.com/search?q=site:glassdoor.co.in+${encodeURIComponent(company)}+${encodeURIComponent(role)}+interview`,
    },
    {
      label: 'GeeksforGeeks Interview Experiences',
      url: `https://www.google.com/search?q=site:geeksforgeeks.org+${encodeURIComponent(company)}+interview+experience`,
    },
    {
      label: 'Reddit Engineering Discussions',
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(company)}+interview+${encodeURIComponent(role)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400">
              {record.application_id}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {record.title}
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {record.company} • {record.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Candidate Stage Progression Prompt */}
        <div className="mx-5 my-3 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-brand-600 dark:text-brand-dark shrink-0" />
              <span>Did you hear back from <strong>{record.company}</strong>?</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 capitalize">
              {record.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            Update your progress to keep your preparation and interview tracker accurate:
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'interview', note: 'Shortlisted / Got Interview Call' })}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition shadow-2xs"
            >
              📞 Got Interview Call
            </button>
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'reviewing', note: 'Under Review / In Progress' })}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs"
            >
              👁️ Under Review
            </button>
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'on_hold', note: 'Put on hold' })}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-2xs"
            >
              ⏸️ On Hold
            </button>
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'offer', note: 'Received job offer!' })}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
            >
              🎉 Got Offer!
            </button>
            <button
              type="button"
              onClick={() => updateStatusMutation.mutate({ status: 'rejected', note: 'Not selected' })}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 transition"
            >
              ❌ Not Selected
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'timeline'
                ? 'border-brand-600 text-brand-600 dark:text-brand-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={14} />
            <span>Timeline & Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'insights'
                ? 'border-brand-600 text-brand-600 dark:text-brand-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building size={14} />
            <span>Company Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prep')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'prep'
                ? 'border-brand-600 text-brand-600 dark:text-brand-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} />
            <span>Interview Prep</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: Timeline & Notes */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              {/* Timeline list */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Status History
                </h3>
                <div className="space-y-3">
                  {((record as any).events || []).length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                      Application logged on {new Date(record.applied_at || record.clicked_at || Date.now()).toLocaleDateString()}.
                    </div>
                  ) : (
                    ((record as any).events || []).map((ev: any) => (
                      <div key={ev.id} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {ev.note || `Status: ${ev.to_status}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(ev.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Candidate Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Application Notes
                  </h3>
                  <button
                    type="button"
                    onClick={() => saveNotesMutation.mutate(noteText)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-dark hover:underline"
                  >
                    Save Notes
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record interview notes, recruiter contacts, or referral details here..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus-ring"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Company Insights */}
          {activeTab === 'insights' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Verified External Searches
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Targeted site search queries to research interview formats, salary bands, and culture.
                </p>
                <div className="space-y-2">
                  {insightsLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
                    >
                      <span>{link.label}</span>
                      <ExternalLink size={13} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Community notes */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Community Interview Experiences ({company})
                </h3>
                {communityNotes.length === 0 ? (
                  <p className="text-xs text-slate-400">No candidate experiences submitted yet for {company}.</p>
                ) : (
                  <div className="space-y-2">
                    {communityNotes.map((cn: any) => (
                      <div key={cn.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{cn.role} • {cn.rounds}</p>
                        <p className="text-slate-500 mt-1">Difficulty: {cn.difficulty} | Outcome: {cn.outcome}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Interview Prep */}
          {activeTab === 'prep' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>AI-generated prep, not from real candidates. Use to test your domain readiness.</span>
              </div>

              {prepLoading && (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {prepData && (
                <>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Key Topics to Revise
                    </h3>
                    <div className="space-y-1.5">
                      {(prepData.topics_to_revise || []).map((t: string, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-semibold text-brand-700 dark:text-brand-300">
                          {idx + 1}. {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Likely Technical & Behavioral Questions
                    </h3>
                    <div className="space-y-2.5">
                      {(prepData.questions || []).map((q: string, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                          <p className="font-semibold text-slate-900 dark:text-white">Q{idx + 1}: {q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

