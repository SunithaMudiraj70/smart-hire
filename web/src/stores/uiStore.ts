import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

export interface UIState {
  activeDrawer: string | null;
  drawerData: any;
  activeModal: string | null;
  modalData: any;
  toasts: ToastItem[];

  openDrawer: (drawerName: string, data?: any) => void;
  closeDrawer: () => void;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'error', duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeDrawer: null,
  drawerData: null,
  activeModal: null,
  modalData: null,
  toasts: [],

  openDrawer: (activeDrawer: string, drawerData: any = null) => set({ activeDrawer, drawerData }),
  closeDrawer: () => set({ activeDrawer: null, drawerData: null }),

  openModal: (activeModal: string, modalData: any = null) => set({ activeModal, modalData }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (message: string, type: 'info' | 'success' | 'error' = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

