"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import {
  login as loginApi,
  logout as logoutApi,
  getSession,
  setPanelAuthCookie,
  clearPanelAuthCookie,
} from "@/lib/auth";
import type { LoginFormValues } from "@/lib/schemas";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isLoginPage = pathname === "/login";

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !isLoginPage,
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginApi(values),
    onSuccess: async (data) => {
      // When panel and API are on different domains, set panel-domain cookie so middleware sees auth
      const token = data?.data?.access_token;
      if (token) {
        await setPanelAuthCookie(token);
      }
      queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutApi();
      await clearPanelAuthCookie();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    session,
    isAuthenticated: !!session,
    isSessionLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
