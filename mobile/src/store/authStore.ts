import api from "@api/client";
import { AuthResponse, UserPrivateProfile } from "@types/models";
import { clearTokens, getTokens, saveTokens } from "@utils/keychain";
import axios from "axios";
import { create } from "zustand";

/** Minimal guest user for __DEV__ when backend is down (UI development). */
const GUEST_USER: UserPrivateProfile = {
  id: "guest-dev",
  email: "guest@dev.local",
  first_name: "Guest",
  last_name: "(Dev)",
  role: "member",
  housing_reason: "exploring",
  is_active: true,
  hobbies: [],
  kyc_status: "pending",
  verification_score: 0,
  created_at: new Date().toISOString(),
};

interface AuthState {
  user: UserPrivateProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  /** __DEV__: set when backend ping fails; enables "Bypass Login" on UI. */
  serverReachable: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<UserPrivateProfile>) => void;
  setUser: (user: UserPrivateProfile) => void;
  /** Debug: force transition to app to test if main app can render (Truth Protocol). */
  forceTransitionToApp: () => void;
  /** __DEV__ only: enter app as guest when backend is down (see Map/UI). */
  guestLogin: () => void;
  /** __DEV__: set when backend ping fails so UI can show Bypass Login. */
  setServerReachable: (reachable: boolean) => void;
  /** __DEV__: bypass login – set isAuthenticated true without backend (emergency UI dev). */
  bypassLogin: () => void;
}

interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  city?: string;
  state?: string;
  housing_reason?: string;
  professional_title?: string;
  background_check_consent: boolean;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  serverReachable: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{ data: AuthResponse }>("/auth/login", {
        email,
        password,
      });
      const { user, access_token, refresh_token } = data.data;
      await saveTokens(access_token, refresh_token);
      set({
        user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /** Atomic registration: API → saveTokens → verify write → only then set auth state. No isLoading: false until transition. */
  register: async (input) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<{ data: AuthResponse }>(
        "/auth/register",
        input,
        {
          timeout: 20_000,
        },
      );
      console.log("[REG_FLOW] API Success");
      const { user, access_token, refresh_token } = data.data;

      await saveTokens(access_token, refresh_token);
      const verified = await getTokens();
      const storageOk =
        verified?.accessToken === access_token &&
        verified?.refreshToken === refresh_token;
      if (!storageOk) {
        await clearTokens();
        set({ isLoading: false });
        throw new Error("Could not save session. Please try again.");
      }
      console.log("[REG_FLOW] Storage Verified");

      set({
        user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
      console.log("[REG_FLOW] Transitioning to App");
    } catch (error: unknown) {
      set({ isLoading: false });
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const msg =
          (error.response?.data as any)?.error?.message ?? error.message ?? "";
        const msgLower = String(msg).toLowerCase();
        if (
          status === 400 &&
          (msgLower.includes("exist") ||
            msgLower.includes("already") ||
            msgLower.includes("registered"))
        ) {
          const userExistsError = Object.assign(
            new Error(msg || "An account with this email already exists."),
            {
              isUserExists: true as const,
              prefillEmail: input.email,
            },
          );
          throw userExistsError;
        }
        if (
          error.code === "ECONNABORTED" ||
          error.message?.toLowerCase().includes("timeout")
        ) {
          throw Object.assign(error, {
            message:
              "Request timed out. Please check your connection and try again.",
          });
        }
        if (error.response?.status === undefined && error.message) {
          throw Object.assign(error, {
            message:
              "Network error. Please check your connection and try again.",
          });
        }
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore server errors on logout
    } finally {
      await clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  /** Sanitized boot: invalid or missing token clears store instead of crashing. Idempotent. */
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const tokens = await getTokens();
      if (!tokens?.accessToken?.trim()) {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }
      const { data } = await api.get<{ data: UserPrivateProfile }>("/auth/me");
      set({
        user: data.data,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      await clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  updateUser: (data) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...data } });
  },

  setUser: (user) => set({ user }),

  /** Emergency exit: Skip to Map (Dev). Sets mock user so app/nav work; completely skips login check. */
  forceTransitionToApp: () => {
    if (!__DEV__) return;
    console.log(
      "[AUTH_STORE] forceTransitionToApp (Skip to Map – bypass, mock user)",
    );
    set({
      user: GUEST_USER,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
    });
  },

  guestLogin: () => {
    if (!__DEV__) return;
    console.log("[AUTH_STORE] guestLogin (Dev Mode – backend bypass)");
    set({
      user: GUEST_USER,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
    });
  },

  setServerReachable: (reachable) => set({ serverReachable: reachable }),

  bypassLogin: () => {
    if (!__DEV__) return;
    console.log(
      "[AUTH_STORE] bypassLogin (Dev-Override – backend unreachable)",
    );
    set({
      user: GUEST_USER,
      isAuthenticated: true,
      isInitialized: true,
      isLoading: false,
    });
  },
}));

// ── Truth Protocol: log every auth state change to catch unexpected flips ───────
if (__DEV__) {
  useAuthStore.subscribe((state) => {
    console.log("[AUTH_STORE]", {
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      isLoading: state.isLoading,
      hasUser: !!state.user,
    });
  });
}

// Subscribe to API client signout events (triggered by failed refresh)
import { authEvents } from "@api/client";
authEvents.on("signout", () => {
  useAuthStore.getState().logout();
});
