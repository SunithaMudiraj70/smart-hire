import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  CheckCircle2,
  Briefcase,
  MapPin,
  BellRing,
  Code2
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { triggerConfetti } from '../../lib/confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_SKILLS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'FastAPI',
  'SQL',
  'PostgreSQL',
  'Docker',
  'AWS',
  'Java',
  'Go',
  'Git',
  'Machine Learning',
  'Tailwind CSS'
];

const POPULAR_ROLES = [
  'Frontend Engineer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'QA / Test Engineer'
];

const POPULAR_LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi NCR',
  'Remote Worldwide'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Python', 'SQL']);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Software Engineer']);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Bengaluru']);
  const [alertFrequency, setAlertFrequency] = useState<'instant' | 'daily' | 'off'>('daily');

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSkill.trim();
    if (clean && !selectedSkills.includes(clean)) {
      setSelectedSkills((prev) => [...prev, clean]);
      setCustomSkill('');
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update user profile
      await api.put('/api/user/profile', {
        skills: selectedSkills,
        target_roles: selectedRoles,
        location: selectedLocations.join(', ') || 'India'
      });

      // 2. Update alert settings
      await api.put('/api/user/settings', {
        notify_new_matches: alertFrequency !== 'off',
        email_digest: alertFrequency === 'daily'
      });
    },
    onSuccess: () => {
      localStorage.setItem('smart_hire_onboarded', 'true');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      refreshProfile();
      triggerConfetti();
      onClose();
    },
    onError: () => {
      localStorage.setItem('smart_hire_onboarded', 'true');
      onClose();
    }
  });

  const handleSkip = () => {
    localStorage.setItem('smart_hire_onboarded', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-dark flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Set up your Candidate Profile
              </h2>
              <p className="text-xs text-slate-500">Step {step} of 3</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Skip for now
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-brand-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Code2 size={16} className="text-brand-600 dark:text-brand-dark" />
                  What are your top skills?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  We use these to calculate exact match percentages on every verified job posting.
                </p>
              </div>

              {/* Skills Chips Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {COMMON_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Skill */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Type another skill (e.g. Next.js, Kubernetes)..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!customSkill.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 transition"
                >
                  Add
                </button>
              </form>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                Selected ({selectedSkills.length}):{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedSkills.join(', ') || 'None yet'}
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Briefcase size={16} className="text-brand-600 dark:text-brand-dark" />
                  What roles are you aiming for?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the positions you'd like us to prioritize in your recommended feed.
                </p>
                <div className="flex flex-wrap gap-2 pt-2.5">
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin size={16} className="text-brand-600 dark:text-brand-dark" />
                  Preferred locations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your target hubs or remote preference.
                </p>
                <div className="flex flex-wrap gap-2 pt-2.5">
                  {POPULAR_LOCATIONS.map((loc) => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleLocation(loc)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BellRing size={16} className="text-brand-600 dark:text-brand-dark" />
                  Job match alerts & frequency
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stay updated the instant high-match verified engineering positions go live.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  {
                    id: 'daily',
                    title: 'Daily Morning Digest (Recommended)',
                    desc: 'A curated daily list of top >70% matches directly in your inbox and app notification bell.'
                  },
                  {
                    id: 'instant',
                    title: 'Instant Real-Time Alerts',
                    desc: 'Get notified immediately whenever a new posting matches your exact stack.'
                  },
                  {
                    id: 'off',
                    title: 'Only in Dashboard',
                    desc: 'No emails; search manually whenever you visit the app.'
                  }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setAlertFrequency(opt.id as any)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      alertFrequency === opt.id
                        ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alert-freq"
                      checked={alertFrequency === opt.id}
                      onChange={() => setAlertFrequency(opt.id as any)}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition active:scale-[0.98]"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{saveMutation.isPending ? 'Saving...' : 'Finish & Go to Search'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

