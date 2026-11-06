import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { Job } from '../types';
import { useFilterStore } from '../stores/filterStore';
import { useDebounce } from './useDebounce';

export interface JobsSearchResult {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  jobs: Job[];
  candidate_skills?: string[];
  candidate_name?: string;
}

export function useJobs() {
  const {
    q,
    location,
    workMode,
    experience,
    posted,
    sort,
    page
  } = useFilterStore();

  const debouncedQuery = useDebounce(q, 250);
  const debouncedLocation = useDebounce(location, 250);

  const queryInfo = useQuery<JobsSearchResult>({
    queryKey: ['jobs', debouncedQuery, debouncedLocation, workMode, experience, posted, sort, page],
    queryFn: async () => {
      const res = await api.get('/api/jobs/search', {
        params: {
          q: debouncedQuery,
          location: debouncedLocation,
          work_mode: workMode,
          experience_level: experience,
          posted_within: posted,
          sort,
          page,
          page_size: 20
        }
      });
      return res.data;
    },
    staleTime: 30000,
  });

  return {
    ...queryInfo,
    jobs: queryInfo.data?.jobs || [],
    total: queryInfo.data?.total || 0,
    totalPages: queryInfo.data?.pages || 1,
    currentPage: queryInfo.data?.page || 1,
    candidateSkills: queryInfo.data?.candidate_skills || []
  };
}

