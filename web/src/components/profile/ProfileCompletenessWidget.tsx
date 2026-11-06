import React from 'react';
import { CheckCircle2, Circle, FileText, Code2, Briefcase, MapPin, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileCompletenessWidgetProps {
  profile?: UserProfile | null;
  onFocusStep?: (stepName: string) => void;
}

export const ProfileCompletenessWidget: React.FC<ProfileCompletenessWidgetProps> = ({
  profile,
  onFocusStep
}) => {
  const hasResume = Boolean(profile?.resume_filename);
  const hasSkills = Boolean(profile?.skills && profile.skills.length >= 3);
  const hasTargetRole = Boolean(profile?.target_roles && profile.target_roles.length > 0);
  const hasLocation = Boolean(
    profile?.location &&
    profile.location.trim().length > 0 &&
    profile.location.toLowerCase() !== 'india'
  );

  const steps = [
    {
      id: 'resume',
      label: 'Upload resume (PDF)',
      done: hasResume,
      icon: FileText,
      hint: 'Enables auto skill matching'
    },
    {
      id: 'skills',
      label: 'Add at least 3 core skills',
      done: hasSkills,
      icon: Code2,
      hint: `${profile?.skills?.length || 0}/3 skills added`
    },
    {
      id: 'role',
      label: 'Set target engineering role',
      done: hasTargetRole,
      icon: Briefcase,
      hint: profile?.target_roles?.[0] || 'Software Engineer'
    },
    {
      id: 'location',
      label: 'Specify preferred city / remote',
      done: hasLocation,
      icon: MapPin,
      hint: profile?.location || 'e.g. Bengaluru, Remote'
    }
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  // SVG ring calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-brand-600 dark:text-brand-dark transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
                {percentage}%
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">complete</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-dark uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Profile Strength</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {percentage === 100
                ? 'All-Star Profile! 🎉'
                : percentage >= 50
                ? 'Great progress!'
                : 'Complete your profile'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {completedCount} of {steps.length} milestones finished to unlock maximum match accuracy.
            </p>
          </div>
        </div>

        {percentage < 100 && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            💡 Profiles with 100% completeness receive 3x more accurate job matches.
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.id}
              onClick={() => onFocusStep && onFocusStep(st.id)}
              className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                st.done
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    st.done
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{st.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{st.hint}</p>
                </div>
              </div>

              {st.done ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

