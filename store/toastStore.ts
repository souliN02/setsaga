import { create } from 'zustand';

import type { CelebrationToast } from '@/lib/celebrations';

// Transient UI state only (CLAUDE.md conventions): the queue of celebration
// toasts currently on screen. The facts being celebrated — PR flags, unlock
// rows — live in the DB; losing this queue loses nothing.

type ToastState = {
  queue: CelebrationToast[];
  enqueueToasts: (toasts: CelebrationToast[]) => void;
  /** Drops the toast currently showing (queue head). */
  dismissToast: () => void;
};

export const useToastStore = create<ToastState>()((set) => ({
  queue: [],
  enqueueToasts: (toasts) => set((state) => ({ queue: [...state.queue, ...toasts] })),
  dismissToast: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
