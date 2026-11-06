import React, { useEffect, useState } from 'react';
import { Search, X, Briefcase, Calendar, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { LocationCombobox } from './LocationCombobox';

const WORK_MODE_OPTIONS = [
  { value: 'all', label: 'Work Mode: Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'Exp: Any' },
  { value: 'fresher', label: 'Fresher (0-1 yr)' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5+', label: '5+ years' },
];

const DATE_POSTED_OPTIONS = [
  { value: 'all', label: 'Posted: Any' },
  { value: '24h', label: 'Past 24h' },
  { value: '3d', label: 'Past 3 days' },
  { value: '7d', label: 'Past week' },
  { value: '30d', label: 'Past month' },
];

const SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'newest', label: 'Newest First' },
];

interface FilterBarProps {
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ className = '' }) => {
  const {
    q,
    location,
    workMode,
    experience,
    posted,
    sort,
    setQ,
    setLocation,
    setWorkMode,
    setExperience,
    setPosted,
    setSort,
    resetFilters,
  } = useFilterStore();

  // Local debounced input for title/keyword
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQ !== q) {
        setQ(localQ);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localQ, q, setQ]);

  const hasActiveFilters =
    q || location || workMode !== 'all' || experience !== 'all' || posted !== 'all' || sort !== 'match';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm ${className}`}
    >
      {/* One tidy row on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
        {/* 1. Job Title / Keyword input (~40% on desktop) */}
        <div className="relative w-full lg:w-[38%]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Job title, skill or keywords..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
          {localQ && (
            <button
              type="button"
              onClick={() => {
                setLocalQ('');
                setQ('');
              }}
              aria-label="Clear keyword"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 2. Location Combobox (~28% on desktop) */}
        <div className="w-full lg:w-[28%]">
          <LocationCombobox
            value={location}
            onChange={(val) => setLocation(val)}
            placeholder="City, State, or Remote..."
          />
        </div>

        {/* 3. Filter Dropdowns in one responsive group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1">
          {/* Work Mode Dropdown */}
          <div className="relative flex-1 min-w-[120px]">
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              aria-label="Work Mode"
              className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer appearance-none"
            >
              {WORK_MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Briefcase
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Experience Dropdown */}
          <div className="relative flex-1 min-w-[120px]">
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              aria-label="Experience level"
              className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer appearance-none"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Date Posted Dropdown */}
          <div className="relative flex-1 min-w-[110px]">
            <select
              value={posted}
              onChange={(e) => setPosted(e.target.value)}
              aria-label="Date posted"
              className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer appearance-none"
            >
              {DATE_POSTED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Calendar
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 min-w-[115px]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort by"
              className="w-full py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset all filters"
              className="p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

