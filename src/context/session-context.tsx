"use client";

import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageSetItem,
} from "@/lib/storage/browser-storage";
import { UserSession } from "@/types/session";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { toast } from "sonner";

interface SessionState {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: {
    theme: "light" | "dark" | "system";
    autoSave: boolean;
    notifications: boolean;
    language: string;
  };
  recentProjects: string[];
  favorites: string[];
}

type SessionAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_USER"; payload: UserSession | null }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | {
      type: "UPDATE_PREFERENCES";
      payload: Partial<SessionState["preferences"]>;
    }
  | { type: "ADD_RECENT_PROJECT"; payload: string }
  | { type: "REMOVE_RECENT_PROJECT"; payload: string }
  | { type: "CLEAR_RECENT_PROJECTS" }
  | { type: "ADD_FAVORITE"; payload: string }
  | { type: "REMOVE_FAVORITE"; payload: string }
  | { type: "CLEAR_FAVORITES" }
  | { type: "RESET_SESSION" };

interface SessionContextType {
  state: SessionState;
  actions: {
    login: (user: UserSession) => void;
    logout: () => void;
    updateUser: (updates: Partial<UserSession>) => void;
    updatePreferences: (
      preferences: Partial<SessionState["preferences"]>
    ) => void;
    addRecentProject: (projectId: string) => void;
    removeRecentProject: (projectId: string) => void;
    clearRecentProjects: () => void;
    addFavorite: (projectId: string) => void;
    removeFavorite: (projectId: string) => void;
    clearFavorites: () => void;
    clearError: () => void;
    resetSession: () => void;
  };
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case "SET_AUTHENTICATED":
      return { ...state, isAuthenticated: action.payload };

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case "ADD_RECENT_PROJECT":
      return {
        ...state,
        recentProjects: [
          action.payload,
          ...state.recentProjects.filter((id) => id !== action.payload),
        ].slice(0, 10), // Keep only last 10
      };

    case "REMOVE_RECENT_PROJECT":
      return {
        ...state,
        recentProjects: state.recentProjects.filter(
          (id) => id !== action.payload
        ),
      };

    case "CLEAR_RECENT_PROJECTS":
      return { ...state, recentProjects: [] };

    case "ADD_FAVORITE":
      return {
        ...state,
        favorites: [
          ...state.favorites.filter((id) => id !== action.payload),
          action.payload,
        ],
      };

    case "REMOVE_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.filter((id) => id !== action.payload),
      };

    case "CLEAR_FAVORITES":
      return { ...state, favorites: [] };

    case "RESET_SESSION":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
        recentProjects: [],
        favorites: [],
      };

    default:
      return state;
  }
}

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  preferences: {
    theme: "system",
    autoSave: true,
    notifications: true,
    language: "en",
  },
  recentProjects: [],
  favorites: [],
};

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Load session data from localStorage on mount
  useEffect(() => {
    try {
      const savedSession = safeLocalStorageGetItem("vt-challenge-session");
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        dispatch({ type: "SET_USER", payload: sessionData.user });
        dispatch({
          type: "UPDATE_PREFERENCES",
          payload: sessionData.preferences || {},
        });
        dispatch({
          type: "ADD_RECENT_PROJECT",
          payload: sessionData.recentProjects || [],
        });
        dispatch({
          type: "ADD_FAVORITE",
          payload: sessionData.favorites || [],
        });
      }
    } catch (error) {
      console.error("Failed to load session data:", error);
    }
  }, []);

  // Save session data to localStorage when it changes
  useEffect(() => {
    try {
      const sessionData = {
        user: state.user,
        preferences: state.preferences,
        recentProjects: state.recentProjects,
        favorites: state.favorites,
      };
      safeLocalStorageSetItem(
        "vt-challenge-session",
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error("Failed to save session data:", error);
    }
  }, [state.user, state.preferences, state.recentProjects, state.favorites]);

  const login = useCallback((user: UserSession) => {
    dispatch({ type: "SET_USER", payload: user });
    dispatch({ type: "SET_ERROR", payload: null });
    toast.success(`Welcome back!`);
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    toast.success("Logged out successfully");
  }, []);

  const updateUser = useCallback(
    (updates: Partial<UserSession>) => {
      if (state.user) {
        const updatedUser = { ...state.user, ...updates };
        dispatch({ type: "SET_USER", payload: updatedUser });
        toast.success("Profile updated successfully");
      }
    },
    [state.user]
  );

  const updatePreferences = useCallback(
    (preferences: Partial<SessionState["preferences"]>) => {
      dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });
      toast.success("Preferences updated");
    },
    []
  );

  const addRecentProject = useCallback((projectId: string) => {
    dispatch({ type: "ADD_RECENT_PROJECT", payload: projectId });
  }, []);

  const removeRecentProject = useCallback((projectId: string) => {
    dispatch({ type: "REMOVE_RECENT_PROJECT", payload: projectId });
  }, []);

  const clearRecentProjects = useCallback(() => {
    dispatch({ type: "CLEAR_RECENT_PROJECTS" });
    toast.success("Recent projects cleared");
  }, []);

  const addFavorite = useCallback((projectId: string) => {
    dispatch({ type: "ADD_FAVORITE", payload: projectId });
    toast.success("Added to favorites");
  }, []);

  const removeFavorite = useCallback((projectId: string) => {
    dispatch({ type: "REMOVE_FAVORITE", payload: projectId });
    toast.success("Removed from favorites");
  }, []);

  const clearFavorites = useCallback(() => {
    dispatch({ type: "CLEAR_FAVORITES" });
    toast.success("Favorites cleared");
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
    safeLocalStorageRemoveItem("vt-challenge-session");
    toast.success("Session reset successfully");
  }, []);

  const contextValue: SessionContextType = {
    state,
    actions: {
      login,
      logout,
      updateUser,
      updatePreferences,
      addRecentProject,
      removeRecentProject,
      clearRecentProjects,
      addFavorite,
      removeFavorite,
      clearFavorites,
      clearError,
      resetSession,
    },
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
