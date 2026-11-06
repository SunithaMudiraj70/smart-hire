import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Users, Upload, CheckCircle2, Building, ShieldCheck, Mail } from 'lucide-react';
import api from '../../lib/axios';

export const RecruiterWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'post'>('jobs');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobLoc, setJobLoc] = useState('Bengaluru / Remote');
  const [jobSalary, setJobSalary] = useState('₹18,00,000 - ₹28,00,000 a year');
  const [jobSkills, setJobSkills] = useState('Python, SQL, FastAPI, React');
  const [jobDesc, setJobDesc] = useState('');

  // Fetch posted jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ['recruiter-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/recruiter/jobs');
      return res.data;
    },
  });

  // Post Job Mutation
  const postJobMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/recruiter/jobs', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      setToastMessage('Native position published on smart-hire!');
      setActiveTab('jobs');
      setJobTitle('');
      setJobDesc('');
      setTimeout(() => setToastMessage(null), 3500);
    },
  });

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    const skillsList = jobSkills.split(',').map((s) => s.trim()).filter(Boolean);
    postJobMutation.mutate({
      title: jobTitle,
      department: jobDept,
      location: jobLoc,
      salary: jobSalary,
      skills: skillsList,
      description: jobDesc,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Building size={14} />
            <span>Recruiter & Hiring Workspace</span>
          </div>
          <h1 className="text-2xl font-extrabold">smart-hire for Employers</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Publish direct verified engineering positions, review native candidate submissions, and manage candidate talent pools.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('post')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus size={16} />
          <span>Post a direct role</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'jobs'
              ? 'border-brand-600 text-brand-600 dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase size={15} />
          <span>Posted Roles ({jobs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('post')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'post'
              ? 'border-brand-600 text-brand-600 dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus size={15} />
          <span>Publish Role</span>
        </button>
      </div>

      {/* TAB: Post Job */}
      {activeTab === 'post' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Publish Direct Employer Role
          </h2>
          <form onSubmit={handlePostJob} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Lead Machine Learning Engineer"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={jobDept}
                  onChange={(e) => setJobDept(e.target.value)}
                  placeholder="Engineering"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={jobLoc}
                  onChange={(e) => setJobLoc(e.target.value)}
                  placeholder="Bengaluru / Remote"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salary Range
              </label>
              <input
                type="text"
                value={jobSalary}
                onChange={(e) => setJobSalary(e.target.value)}
                placeholder="₹18,00,000 - ₹28,00,000 a year"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Required Skills (comma separated)
              </label>
              <input
                type="text"
                value={jobSkills}
                onChange={(e) => setJobSkills(e.target.value)}
                placeholder="Python, SQL, FastAPI, React"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Job Overview & Requirements
              </label>
              <textarea
                rows={4}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Describe role responsibilities, team scale, and expectations..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring"
              />
            </div>

            <button
              type="submit"
              disabled={postJobMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition disabled:opacity-60"
            >
              {postJobMutation.isPending ? 'Publishing...' : 'Publish Position'}
            </button>
          </form>
        </div>
      )}

      {/* TAB: Jobs List */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          {jobsLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading posted roles...</div>
          )}

          {!jobsLoading && jobs.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Briefcase className="mx-auto text-slate-400 mb-3" size={32} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No roles published yet</h3>
              <p className="text-xs text-slate-500 mt-1">Publish a direct role to receive native candidate applications.</p>
            </div>
          )}

          {!jobsLoading && jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{job.department} • {job.location} • {job.salary}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(job.skills || []).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-brand-700 dark:text-brand-300">
                  {job.applications_count} candidate applications
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

