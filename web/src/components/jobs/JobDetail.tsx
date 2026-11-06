import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Flag,
  RotateCcw
} from 'lucide-react';
import { Job } from '../../types';
import { formatSalary } from '../../lib/salary';
import { getJobApplyUrl } from '../../lib/getJobApplyUrl';

interface JobDetailProps {
  job: Job;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
  onApply: (job: Job) => void;
  onCloseMobile?: () => void;
  onReportBroken?: (jobId: string) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({
  job,
  isSaved = false,
  onToggleSave,
  onApply,
  onCloseMobile,
  onReportBroken
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportState, setReportState] = useState<'idle' | 'reported'>('idle');

  const applyUrl = getJobApplyUrl(job);
  const matchScore = job.match?.score || 65;
  const matchingSkills = job.match?.matching_skills || (job.skills || []).slice(0, 3);
  const learnNext = job.match?.learn_next || ['System Design', 'Cloud Architecture'];
  const salaryText = formatSalary(job.salary);

  const handleCopyKit = () => {
    const kitText = `Application for ${job.title} at ${job.company}\nLocation: ${job.location}\nApply URL: ${applyUrl}\n\nDear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background in ${matchingSkills.join(', ')}, I am confident in my ability to contribute effectively from day one.\n\nThank you for considering my application.\n\nBest regards.`;
    navigator.clipboard.writeText(kitText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleReport = () => {
    setReportState('reported');
    if (onReportBroken) {
      onReportBroken(job.id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-left">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {job.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building size={14} className="text-slate-400" />
              {job.company}
            </span>
            {job.rating && <span className="text-amber-500 font-bold">{job.rating}</span>}
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-slate-400" />
              {job.location}
            </span>
          </div>

          {salaryText && (
            <div className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {salaryText}
            </div>
          )}
        </div>

        {/* Bookmark Toggle Button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(job)}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isSaved
                ? 'border-brand-300 text-brand-600 bg-brand-50 dark:bg-brand-950/40'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save job'}
          >
            <Bookmark size={18} className={isSaved ? 'fill-brand-600' : ''} />
          </button>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="py-5 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleCopyKit}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-[0.98]"
        >
          {copySuccess ? <Check size={16} /> : <Copy size={16} />}
          <span>{copySuccess ? 'Copied application kit!' : 'Copy application kit'}</span>
        </button>

        {applyUrl && (
          <button
            type="button"
            onClick={() => onApply(job)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-[0.98]"
          >
            <span>Apply on {job.source || 'Portal'}</span>
            <ExternalLink size={15} />
          </button>
        )}
      </div>

      {/* Skill Alignment Breakdown */}
      <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-600 dark:text-brand-dark" />
            Skill Alignment Breakdown
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
            {matchScore}% Fit
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Matching skills on your profile:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold"
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>

          {learnNext.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Recommended skill to learn next:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {learnNext.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-800/60"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div className="mt-6 text-left">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Job Description
        </h4>
        <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed whitespace-pre-line">
          {job.description}
        </div>
      </div>

      {/* Broken Link Report */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Verified origin: {job.source || 'Direct ATS'}</span>
        {reportState === 'reported' ? (
          <span className="text-emerald-600 font-medium">Link reported. Thank you!</span>
        ) : (
          <button
            type="button"
            onClick={handleReport}
            className="hover:text-red-500 transition flex items-center gap-1"
          >
            <Flag size={12} />
            <span>Report broken link</span>
          </button>
        )}
      </div>
    </div>
  );
};

