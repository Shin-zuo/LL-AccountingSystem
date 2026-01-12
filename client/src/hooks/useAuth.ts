import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  // FIXED: Explicit query function with Anti-Caching headers
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/me"],
    // KEY FIX: Prevent React Query from using old data
    staleTime: 0,
    gcTime: 0, // Don't keep garbage data (formerly cacheTime)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry if 401
    
    // KEY FIX: Explicitly send fetch with no-cache headers
    queryFn: async () => {
      const res = await fetch("/api/me", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      if (!res.ok) {
        // If 401, return null (logged out)
        if (res.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user status");
      }
      
      const data = await res.json();
      return data.user;
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store user data
      queryClient.setQueryData(["/api/me"], data.user);
      // Force immediate invalidation to be safe
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // CLEAR EVERYTHING to prevent sticky sessions
      queryClient.removeQueries();
      queryClient.clear();
      queryClient.setQueryData(["/api/me"], null);
      
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('user') || key.includes('session')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      }
    },
  });

  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/refresh-session", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Session refresh failed");
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Auto-refresh session
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshSessionMutation.mutate();
    }, 10 * 60 * 1000); 
    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result;
    } catch (error) {
      throw error;
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      queryClient.clear();
      queryClient.setQueryData(["/api/me"], null);
      throw error;
    }
  }, [logoutMutation, queryClient]);

  const refreshSession = useCallback(async () => {
    try {
      await refreshSessionMutation.mutateAsync();
    } catch (error) {
      queryClient.setQueryData(["/api/me"], null);
      throw error;
    }
  }, [refreshSessionMutation, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshingSession: refreshSessionMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    sessionError: error,
  };
}