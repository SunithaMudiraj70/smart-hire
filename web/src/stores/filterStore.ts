import { create } from 'zustand';

export interface FilterState {
  q: string;
  location: string;
  workMode: string;
  experience: string;
  posted: string;
  sort: string;
  page: number;

  setQ: (q: string) => void;
  setLocation: (loc: string) => void;
  setWorkMode: (workMode: string) => void;
  setExperience: (exp: string) => void;
  setPosted: (posted: string) => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  syncFromParams: (searchParams: URLSearchParams) => void;
  toSearchParams: () => URLSearchParams;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  q: '',
  location: '',
  workMode: 'all',
  experience: 'all',
  posted: 'all',
  sort: 'match',
  page: 1,

  setQ: (q: string) => set({ q, page: 1 }),
  setLocation: (location: string) => set({ location, page: 1 }),
  setWorkMode: (workMode: string) => set({ workMode, page: 1 }),
  setExperience: (experience: string) => set({ experience, page: 1 }),
  setPosted: (posted: string) => set({ posted, page: 1 }),
  setSort: (sort: string) => set({ sort }),
  setPage: (page: number) => set({ page }),

  resetFilters: () =>
    set({
      q: '',
      location: '',
      workMode: 'all',
      experience: 'all',
      posted: 'all',
      sort: 'match',
      page: 1,
    }),

  syncFromParams: (searchParams: URLSearchParams) => {
    const q = searchParams.get('q') || '';
    const location = searchParams.get('loc') || '';
    const workMode = searchParams.get('mode') || 'all';
    const experience = searchParams.get('exp') || 'all';
    const posted = searchParams.get('posted') || 'all';
    const sort = searchParams.get('sort') || 'match';
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;

    set({ q, location, workMode, experience, posted, sort, page });
  },

  toSearchParams: () => {
    const s = get();
    const params = new URLSearchParams();
    if (s.q.trim()) params.set('q', s.q.trim());
    if (s.location.trim()) params.set('loc', s.location.trim());
    if (s.workMode && s.workMode !== 'all') params.set('mode', s.workMode);
    if (s.experience && s.experience !== 'all') params.set('exp', s.experience);
    if (s.posted && s.posted !== 'all') params.set('posted', s.posted);
    if (s.sort && s.sort !== 'match') params.set('sort', s.sort);
    if (s.page > 1) params.set('page', s.page.toString());
    return params;
  },
}));

