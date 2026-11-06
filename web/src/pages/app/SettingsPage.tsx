import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Bell,
  Sun,
  Moon,
  Upload,
  User,
  Trash2,
  CheckCircle2,
  X,
  Plus,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, UserSettings } from '../../types';
import { ProfileCompletenessWidget } from '../../components/profile/ProfileCompletenessWidget';

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const { user, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [headlineInput, setHeadlineInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Fetch settings
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const res = await api.get('/api/user/settings');
      return res.data;
    },
  });

  // Fetch profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/api/user/profile');
      return res.data;
    },
  });

  useEffect(() => {
    if (userProfile) {
      setSkillsList(userProfile.skills || []);
      setHeadlineInput(userProfile.headline || '');
      setPhoneInput(userProfile.phone || '');
      setLocationInput(userProfile.location || 'India');
    }
  }, [userProfile]);

  // Update Settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updated: Partial<UserSettings>) => {
      const res = await api.put('/api/user/settings', updated);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setToastMessage('Settings saved successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Update Profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updated: Partial<UserProfile>) => {
      const res = await api.put('/api/user/profile', updated);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      refreshProfile();
      setToastMessage('Profile and skills updated.');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Resume upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/user/resume-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.skills) {
        setSkillsList(res.data.skills);
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await refreshProfile();
      setToastMessage(`Resume ${file.name} uploaded and skills extracted!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setToastMessage('Failed to parse resume.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skillsList.includes(newSkill.trim())) {
      const updated = [...skillsList, newSkill.trim()];
      setSkillsList(updated);
      updateProfileMutation.mutate({ skills: updated });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    setSkillsList(updated);
    updateProfileMutation.mutate({ skills: updated });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/api/user/account');
        await logout();
      } catch {
        setToastMessage('Failed to delete account.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings size={22} className="text-brand-600 dark:text-brand-dark" />
          Account & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your job alerts, skills profile, and theme settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Completeness Ring Widget */}
        <ProfileCompletenessWidget profile={userProfile} />

        {/* Section 1: Resume & Profile Skills */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <User size={18} className="text-brand-600 dark:text-brand-dark" />
            Resume & Skill Match Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Your match score on the Find Jobs feed is computed from these skills.
          </p>

          {/* Resume Upload Drop Area */}
          <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-center mb-6">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition shadow-2xs"
            >
              <Upload size={15} />
              <span>{isUploading ? 'Parsing Resume...' : 'Drop or Upload PDF Resume'}</span>
            </label>
            {userProfile?.resume_filename && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center justify-center gap-1">
                <FileCheck size={14} />
                Active resume: {userProfile.resume_filename}
              </p>
            )}
          </div>

          {/* Editable Skills Chips */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Parsed Skills ({skillsList.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-brand-700 dark:text-brand-300 border border-indigo-200/60 dark:border-indigo-800/60"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-500 transition"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add skill input */}
            <form onSubmit={handleAddSkill} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill (e.g. Docker, TypeScript)"
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus-ring w-64"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition"
              >
                <Plus size={14} />
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Section 2: Notifications & Digest Toggles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Bell size={18} className="text-brand-600 dark:text-brand-dark" />
            Alerts & Notifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Configure how and when smart-hire notifies you about fresh matches.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Notify on new matches</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive in-app alerts when jobs matching &gt;70% of your skills are ingested.</p>
              </div>
              <input
                type="checkbox"
                checked={userSettings?.notify_new_matches ?? true}
                onChange={(e) => updateSettingsMutation.mutate({ notify_new_matches: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Daily Job Digest</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Receive a daily consolidated digest of the top engineering postings.</p>
              </div>
              <input
                type="checkbox"
                checked={userSettings?.email_digest ?? true}
                onChange={(e) => updateSettingsMutation.mutate({ email_digest: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Theme Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <Sun size={18} className="text-amber-500" />
            Theme & Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Choose your preferred color theme. Applied before first paint without flash.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'system', label: 'System Default' },
              { id: 'light', label: 'Light Mode' },
              { id: 'dark', label: 'Dark Mode' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id as any);
                  updateSettingsMutation.mutate({ theme: t.id as 'system' | 'light' | 'dark' });
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
                  theme === t.id
                    ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Account Danger Zone */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 shadow-xs">
          <h2 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-1">
            <ShieldAlert size={18} />
            Account Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Signed in as <strong>{user?.email}</strong>.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 hover:bg-red-100 transition"
          >
            <Trash2 size={14} />
            <span>Delete my account & data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
