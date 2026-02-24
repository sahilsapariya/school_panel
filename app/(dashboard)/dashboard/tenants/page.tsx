"use client";

import { useState } from "react";
import { useTenants, useInvalidateTenants, useInvalidateDashboard } from "@/hooks/useApi";
import { TenantsTable } from "@/components/tables/tenants-table";
import { Pagination } from "@/components/tables/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenantModal } from "@/components/forms/create-tenant-modal";
import { Plus } from "lucide-react";
import type { TenantListItem } from "@/types";
import { api } from "@/lib/api";

const LIMIT = 10;

export default function TenantsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error } = useTenants(page, LIMIT);
  const invalidateTenants = useInvalidateTenants();
  const invalidateDashboard = useInvalidateDashboard();

  const handleSuspendActivate = async (tenant: TenantListItem) => {
    try {
      const path =
        tenant.status === "active"
          ? `/api/platform/tenants/${tenant.id}/suspend`
          : `/api/platform/tenants/${tenant.id}/activate`;
      await api.patch(path);
      await invalidateTenants();
      await invalidateDashboard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePlan = (_tenant: TenantListItem) => {
    window.location.href = `/dashboard/tenants/${_tenant.id}?action=change-plan`;
  };

  const handleResetAdmin = async (tenant: TenantListItem) => {
    try {
      await api.post(`/api/platform/tenants/${tenant.id}/reset-admin`);
      await invalidateTenants();
    } catch (e) {
      console.error(e);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load tenants"}
        </p>
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 0;
  const tenants = data?.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add tenant
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>All tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              Loading…
            </div>
          ) : (
            <>
              <TenantsTable
                data={tenants}
                onSuspendActivate={handleSuspendActivate}
                onChangePlan={handleChangePlan}
                onResetAdmin={handleResetAdmin}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateTenantModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          invalidateTenants();
          invalidateDashboard();
        }}
      />
    </div>
  );
}
