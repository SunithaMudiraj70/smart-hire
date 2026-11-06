import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Briefcase, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../../lib/axios';
import { MarketInsights } from '../../types';

function getUpdatedAgoText(insights: MarketInsights): string {
  if (insights.updated_at) {
    const diffMs = Date.now() - new Date(insights.updated_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Updated just now';
    if (diffMins === 1) return 'Updated 1 min ago';
    if (diffMins < 60) return `Updated ${diffMins} min ago`;
  }
  return `Updated ${insights.last_updated}`;
}

export const MarketPulse: React.FC = () => {
  const { data: insights } = useQuery<MarketInsights>({
    queryKey: ['market-insights'],
    queryFn: async () => {
      const res = await api.get('/api/insights');
      return res.data;
    },
    refetchInterval: 60000, // Refetch every 60s
  });

  if (!insights) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs py-2 px-4 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Pulse Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Activity size={13} className="text-brand-600 dark:text-brand-dark" />
            Market Pulse
          </span>
        </div>

        {/* Pulse Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Briefcase size={13} className="text-slate-400" />
            <span>New today:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {insights.new_jobs_today}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>High matches:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {insights.your_matches} positions
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <TrendingUp size={13} className="text-brand-500" />
            <span>Top skill in demand:</span>
            <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {insights.top_skill_in_demand}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
            <span>{getUpdatedAgoText(insights)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

