import { Job } from '../types';

/**
 * Deduplicated, canonical resolution for job apply URLs.
 * Used across Search, Recommended, Saved Jobs and notifications.
 * Never invents or synthesizes a URL; returns an empty string if missing or invalid.
 */
export const getJobApplyUrl = (job?: Partial<Job> | null): string => {
  if (!job) return '';
  const url = job.apply_url || job.direct_apply_url || job.link;
  if (url && typeof url === 'string') {
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }
  return '';
};

