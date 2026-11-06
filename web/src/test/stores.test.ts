import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../stores/filterStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';

describe('Zustand Stores Suite', () => {
  beforeEach(() => {
    useFilterStore.getState().resetFilters();
    useUIStore.setState({ activeDrawer: null, drawerData: null, activeModal: null, modalData: null, toasts: [] });
    useAuthStore.setState({ user: null, profile: null, settings: null, status: 'idle', isLoading: false, isAuthenticated: false });
  });

  describe('FilterStore', () => {
    it('initializes with default empty filters', () => {
      const state = useFilterStore.getState();
      expect(state.q).toBe('');
      expect(state.location).toBe('');
      expect(state.workMode).toBe('all');
      expect(state.page).toBe(1);
    });

    it('sets filters and updates search params', () => {
      useFilterStore.getState().setQ('Backend Engineer');
      useFilterStore.getState().setLocation('Bengaluru');
      useFilterStore.getState().setWorkMode('remote');
      useFilterStore.getState().setExperience('1-3');

      const params = useFilterStore.getState().toSearchParams();
      expect(params.get('q')).toBe('Backend Engineer');
      expect(params.get('loc')).toBe('Bengaluru');
      expect(params.get('mode')).toBe('remote');
      expect(params.get('exp')).toBe('1-3');
    });

    it('syncs correctly from URLSearchParams', () => {
      const params = new URLSearchParams('q=Frontend&loc=Hyderabad&mode=hybrid&exp=3-5&page=2');
      useFilterStore.getState().syncFromParams(params);

      const state = useFilterStore.getState();
      expect(state.q).toBe('Frontend');
      expect(state.location).toBe('Hyderabad');
      expect(state.workMode).toBe('hybrid');
      expect(state.experience).toBe('3-5');
      expect(state.page).toBe(2);
    });
  });

  describe('UIStore', () => {
    it('manages modal open and close states', () => {
      expect(useUIStore.getState().activeModal).toBeNull();
      useUIStore.getState().openModal('apply-confirm', { jobId: '123' });

      expect(useUIStore.getState().activeModal).toBe('apply-confirm');
      expect(useUIStore.getState().modalData).toEqual({ jobId: '123' });

      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
      expect(useUIStore.getState().modalData).toBeNull();
    });

    it('manages toast notifications lifecycle', () => {
      expect(useUIStore.getState().toasts).toHaveLength(0);

      useUIStore.getState().showToast('Application submitted!', 'success', 0);
      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Application submitted!');
      expect(toasts[0].type).toBe('success');

      useUIStore.getState().removeToast(toasts[0].id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('AuthStore', () => {
    it('manages user authentication state reactively', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      const mockUser = {
        id: 'u1',
        email: 'alex@gmail.com',
        name: 'Alex Thomas',
        role: 'candidate',
        created_at: new Date().toISOString(),
      };
      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
