import React from 'react';
import { Bookmark, MapPin, Building2 } from 'lucide-react';
import { Job } from '../../types';
import { formatSalary } from '../../lib/salary';

interface JobCardProps {
  job: Job;
  isSelected?: boolean;
  isSaved?: boolean;
  onSelect: (job: Job) => void;
  onToggleSave?: (job: Job, e: React.MouseEvent) => void;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected = false,
  isSaved = false,
  onSelect,
  onToggleSave,
  className = ''
}) => {
  const matchScore = job.match?.score || 65;
  const salaryText = formatSalary(job.salary);

  return (
    <div
      onClick={() => onSelect(job)}
      className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer relative group text-left ${
        isSelected
          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-brand-500 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-dark transition-colors">
              {job.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
            <Building2 size={13} className="shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">{job.company}</span>
            {job.rating && <span className="text-amber-500 font-bold">{job.rating}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              matchScore >= 70
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
            }`}
          >
            {matchScore}% Match
          </span>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => onToggleSave(job, e)}
              className={`p-1.5 rounded-lg border transition ${
                isSaved
                  ? 'border-brand-300 text-brand-600 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={isSaved ? 'Remove bookmark' : 'Save job'}
            >
              <Bookmark size={14} className={isSaved ? 'fill-brand-600' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <MapPin size={13} className="shrink-0 text-slate-400" />
        <span className="truncate">{job.location}</span>
      </div>

      {/* Metadata Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {salaryText && (
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {salaryText}
          </span>
        )}
        {job.experience && (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {job.experience}
          </span>
        )}
        {job.work_mode && (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium capitalize">
            {job.work_mode}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-brand-700 dark:text-brand-300 font-semibold">
          {job.source}
        </span>
      </div>
    </div>
  );
};

