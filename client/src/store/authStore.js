import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import queryClient from '../api/queryClient';

/**
 * Dynamic storage adapter for "Remember this device":
 * - If rememberMe is TRUE (default): Saves to localStorage (persists across browser restarts).
 * - If rememberMe is FALSE: Saves to sessionStorage (active during the tab session & survives F5 refreshes,
 *   but automatically terminates when the user closes the browser/tab).
 */
const dynamicStorage = {
  getItem: (name) => {
    try {
      // 1. Check tab-scoped session first
      const sessionVal = sessionStorage.getItem(name);
      if (sessionVal) return sessionVal;
      // 2. Check persistent device storage
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      const isRemembered = parsed?.state?.rememberMe !== false;
      if (isRemembered) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    try {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      /** Logged-in user object: { _id, name, phone, storeName, settings } */
      user: null,

      /** JWT access token */
      accessToken: null,

      /** Remember this device preference */
      rememberMe: true,

      /**
       * Call after a successful login or registration.
       * @param {{ _id: string, name: string, phone: string, storeName: string, settings: object }} user
       * @param {string} token - new access token
       * @param {boolean} [rememberMe=true] - whether to persist across browser restarts
       */
      setAuth: (user, token, rememberMe = true) => {
        const prevId = get().user?._id || get().user?.id;
        const newId = user?._id || user?.id;
        if (!prevId || (newId && prevId !== newId)) {
          queryClient.clear();
        }
        set({ user, accessToken: token, rememberMe });
      },

      /**
       * Update only the access token (used by the silent refresh interceptor).
       * @param {string} token
       */
      setToken: (token) => set({ accessToken: token }),

      /** Clear all auth state — used on logout or unrecoverable 401. */
      logout: () => {
        queryClient.clear();
        set({ user: null, accessToken: null, rememberMe: true });
        dynamicStorage.removeItem('inventiq-auth');
      },

      /**
       * Derived boolean — true when a valid access token is present.
       */
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'inventiq-auth',
      storage: createJSONStorage(() => dynamicStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        rememberMe: state.rememberMe,
      }),
    }
  )
);

export default useAuthStore;
