export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UserProfile {
  headline?: string;
  phone?: string;
  location?: string;
  years_experience?: number;
  target_roles?: string[];
  skills?: string[];
  resume_filename?: string;
}

export interface UserSettings {
  notify_new_matches: boolean;
  email_digest: boolean;
  theme: 'system' | 'light' | 'dark';
  auto_apply_enabled: boolean;
  attach_cover_note: boolean;
  share_resume: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  kind: 'match' | 'application' | 'digest' | 'system';
  job_id: string;
  is_read: boolean;
  created_at: string;
}

export interface JobMatchBreakdown {
  score: number;
  matched_skills?: string[];
  missing_skills?: string[];
  matching_skills?: string[];
  learn_next?: string[];
  recommendation?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  is_remote?: boolean;
  work_mode?: string;
  salary?: string;
  rating?: string;
  source: string;
  source_badge_color?: string;
  is_public_ats?: boolean;
  apply_url?: string;
  link?: string;
  direct_apply_url?: string;
  description?: string;
  skills?: string[];
  job_type?: string;
  posted?: string;
  experience?: string;
  url_origin?: string;
  link_status?: string;
  match?: JobMatchBreakdown;
  sources_count?: number;
  quality_flags?: {
    stale?: boolean;
    no_salary?: boolean;
  };
}

export interface AppliedJobRecord {
  id: string;
  application_id: string;
  job_id: string;
  company: string;
  title: string;
  location: string;
  salary: string;
  status: 'saved' | 'clicked' | 'applied' | 'interview' | 'offer' | 'rejected' | string;
  source?: string;
  apply_url?: string;
  clicked_at?: string;
  applied_at?: string;
  confirmed_via?: string;
  notes?: string;
  cover_letter?: string;
  job_data?: Job;
  events?: Array<{
    id: string;
    from_status: string;
    to_status: string;
    note: string;
    created_at: string;
  }>;
}

export interface MarketInsights {
  new_jobs_today: number;
  your_matches: number;
  top_skill_in_demand: string;
  last_updated: string;
  updated_at?: string;
  active_sources: string[];
}

