"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DashboardResponse,
  PaginatedTenantsResponse,
  TenantDetail,
  PlanListResponse,
  PlanFeatureOption,
} from "@/types";

const DASHBOARD_KEY = ["platform", "dashboard"];
const TENANTS_KEY = (page: number, limit: number) =>
  ["platform", "tenants", page, limit];
const TENANT_KEY = (id: string) => ["platform", "tenant", id];
const PLANS_KEY = ["platform", "plans"];
const PLAN_FEATURES_KEY = ["platform", "plan-features"];

/** Reduces refetch storms when navigating; data stays fresh for 2 min */
const STALE_TIME = 2 * 60 * 1000;

export function usePlanFeatures() {
  return useQuery({
    queryKey: PLAN_FEATURES_KEY,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data?: unknown }>("/api/platform/plan-features");
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map((f: { key?: string; label?: string }) => ({
        key: String(f.key ?? ""),
        label: String(f.label ?? f.key ?? ""),
      })) as PlanFeatureOption[];
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data?: Record<string, unknown> }>(
        "/api/platform/dashboard"
      );
      const d = res?.data ?? {};
      return {
        metrics: {
          totalTenants: Number(d.total_tenants ?? 0),
          activeTenants: Number(d.active_tenants ?? 0),
          suspendedTenants: Number(d.suspended_tenants ?? 0),
          totalStudents: Number(d.total_students ?? 0),
          totalTeachers: Number(d.total_teachers ?? 0),
          monthlyRevenue: Number(d.revenue_monthly ?? 0),
        },
        tenantGrowthByMonth: Array.isArray(d.tenant_growth_by_month)
          ? (d.tenant_growth_by_month as Array<{ month?: string; count?: number }>).map(
              (g) => ({
                month: String(g.month ?? ""),
                count: Number(g.count ?? 0),
              })
            )
          : [],
      } as DashboardResponse;
    },
  });
}

export function useTenants(page: number, limit: number) {
  return useQuery({
    queryKey: TENANTS_KEY(page, limit),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{
        data?: { items?: unknown[]; pagination?: { page?: number; per_page?: number; total?: number; pages?: number } };
      }>(`/api/platform/tenants?page=${page}&per_page=${limit}`);
      const inner = res?.data;
      const items = Array.isArray(inner?.items) ? inner.items : [];
      const pagination = inner?.pagination ?? {};
      const data = items.map((t: unknown) => {
        const r = t as Record<string, unknown>;
        return {
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          subdomain: String(r.subdomain ?? ""),
          plan: String(r.plan_name ?? r.plan ?? ""),
          studentsCount: Number(r.student_count ?? r.studentsCount ?? 0),
          teachersCount: Number(r.teacher_count ?? r.teachersCount ?? 0),
          status: (r.status as "active" | "suspended") || "active",
        };
      });
      return {
        data,
        total: pagination.total ?? 0,
        page: pagination.page ?? 1,
        limit: pagination.per_page ?? limit,
        totalPages: pagination.pages ?? 0,
      } as PaginatedTenantsResponse;
    },
  });
}

export function useTenant(id: string | null) {
  return useQuery({
    queryKey: TENANT_KEY(id ?? ""),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ success?: boolean; data?: unknown }>(`/api/platform/tenants/${id}`);
      const r = (res?.data ?? {}) as Record<string, unknown>;
      return {
        id: String(r.id ?? ""),
        name: String(r.name ?? ""),
        subdomain: String(r.subdomain ?? ""),
        contactEmail: String(r.contact_email ?? r.contactEmail ?? ""),
        phone: typeof r.phone === "string" ? r.phone : undefined,
        address: typeof r.address === "string" ? r.address : undefined,
        plan: String(r.plan_name ?? r.plan ?? ""),
        planId: String(r.plan_id ?? r.planId ?? ""),
        status: (r.status as "active" | "suspended") || "active",
        studentsCount: Number(r.student_count ?? r.studentsCount ?? 0),
        teachersCount: Number(r.teacher_count ?? r.teachersCount ?? 0),
        createdAt: typeof r.created_at === "string" ? r.created_at : typeof r.createdAt === "string" ? r.createdAt : "",
      } as TenantDetail;
    },
    enabled: !!id,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: PLANS_KEY,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data?: unknown }>("/api/platform/plans");
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map((p: Record<string, unknown>) => {
        const rawFeatures = p.features_json ?? p.features;
        const features =
          rawFeatures && typeof rawFeatures === "object" && !Array.isArray(rawFeatures)
            ? (rawFeatures as Record<string, boolean>)
            : undefined;
        return {
          id: String(p.id ?? ""),
          name: String(p.name ?? ""),
          price: Number(p.price ?? p.price_monthly ?? 0),
          maxStudents: Number(p.maxStudents ?? p.max_students ?? 0),
          maxTeachers: Number(p.maxTeachers ?? p.max_teachers ?? 0),
          features,
        };
      }) as PlanListResponse;
    },
  });
}

export function useInvalidateTenants() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] });
}

export function useInvalidateTenant(id: string | null) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: TENANT_KEY(id ?? "") });
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
}

export function useInvalidatePlans() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PLANS_KEY });
}

const AUDIT_LOGS_KEY = (page: number, perPage: number, filters: Record<string, string>) =>
  ["platform", "audit-logs", page, perPage, filters];
export function useAuditLogs(
  page: number,
  perPage: number,
  filters: { action?: string; tenant_id?: string; date_from?: string; date_to?: string } = {}
) {
  return useQuery({
    queryKey: AUDIT_LOGS_KEY(page, perPage, filters),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (filters.action) params.set("action", filters.action);
      if (filters.tenant_id) params.set("tenant_id", filters.tenant_id);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      const res = await api.get<{ data?: { items?: unknown[]; pagination?: unknown } }>(
        `/api/platform/audit-logs?${params.toString()}`
      );
      const inner = (res as { data?: { items?: unknown[]; pagination?: Record<string, number> } })?.data;
      const items = Array.isArray(inner?.items) ? inner.items : [];
      const pagination = inner?.pagination ?? {};
      return {
        items,
        page: pagination.page ?? 1,
        perPage: pagination.per_page ?? perPage,
        total: pagination.total ?? 0,
        pages: pagination.pages ?? 0,
      };
    },
  });
}

const SETTINGS_KEY = ["platform", "settings"];
export function usePlatformSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data?: Record<string, string | null> }>("/api/platform/settings");
      return (res as { data?: Record<string, string | null> })?.data ?? {};
    },
  });
}

export function useInvalidateSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
}

const TENANT_ADMINS_KEY = (tenantId: string) => ["platform", "tenant", tenantId, "admins"];
export function useTenantAdmins(tenantId: string | null) {
  return useQuery({
    queryKey: TENANT_ADMINS_KEY(tenantId ?? ""),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data?: { admins?: unknown[] } }>(`/api/platform/tenants/${tenantId}/admins`);
      const admins = (res as { data?: { admins?: Array<{ id: string; email: string; name?: string }> } })?.data?.admins ?? [];
      return admins;
    },
    enabled: !!tenantId,
  });
}

export function useInvalidateTenantAdmins(tenantId: string | null) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: TENANT_ADMINS_KEY(tenantId ?? "") });
}
