import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Job } from '../types';
import { getJobApplyUrl } from '../lib/getJobApplyUrl';
import { triggerConfetti } from '../lib/confetti';
import { useUIStore } from '../stores/uiStore';

export interface PendingApplyInfo {
  id: string;
  title: string;
  company: string;
  apply_url: string;
}

export function useApplyFlow() {
  const queryClient = useQueryClient();
  const [pendingConfirm, setPendingConfirm] = useState<PendingApplyInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mutation to record click
  const clickMutation = useMutation({
    mutationFn: async (job: Job) => {
      const applyUrl = getJobApplyUrl(job);
      const res = await api.post('/api/jobs/apply-click', {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          source: job.source,
          apply_url: applyUrl
        }
      });
      return { record: res.data, job, applyUrl };
    },
    onSuccess: ({ record, job, applyUrl }) => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });

      // Open genuine link in a new tab
      if (applyUrl) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer');
      }

      // Prompt confirmation modal for tracking lifecycle
      setPendingConfirm({
        id: record.id,
        title: job.title,
        company: job.company,
        apply_url: applyUrl
      });
    },
    onError: (_err, job) => {
      // Still open link even if logging fails
      const applyUrl = getJobApplyUrl(job);
      if (applyUrl) {
        window.open(applyUrl, '_blank', 'noopener,noreferrer');
      }
    }
  });

  // Mutation to confirm application
  const confirmMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await api.post(`/api/applications/${id}/confirm`, { notes: notes || '' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
      triggerConfetti();
      useUIStore.getState().showToast('Application confirmed! Tracked in your Applied Jobs.', 'success');
      setToastMessage('Application confirmed! Tracked in your Applied Jobs.');
      setTimeout(() => setToastMessage(null), 4000);
      setPendingConfirm(null);
    }
  });

  const handleApply = (job: Job) => {
    clickMutation.mutate(job);
  };

  const handleConfirm = (notes?: string) => {
    if (pendingConfirm) {
      confirmMutation.mutate({ id: pendingConfirm.id, notes });
    }
  };

  const handleDismissConfirm = () => {
    setPendingConfirm(null);
  };

  return {
    handleApply,
    pendingConfirm,
    handleConfirm,
    handleDismissConfirm,
    isApplying: clickMutation.isPending,
    isConfirming: confirmMutation.isPending,
    toastMessage,
    setToastMessage
  };
}
