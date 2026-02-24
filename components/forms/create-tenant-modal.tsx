"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTenantSchema, type CreateTenantFormValues } from "@/lib/schemas";
import { usePlans, usePlatformSettings } from "@/hooks/useApi";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTenantModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateTenantModalProps) {
  const { data: plans } = usePlans();
  const { data: settings } = usePlatformSettings();
  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      contactEmail: "",
      phone: "",
      address: "",
      planId: "",
      adminName: "",
      adminEmail: "",
    },
  });

  const defaultPlanId = settings?.default_plan_id ?? "";
  const planIds = Array.isArray(plans) ? plans.map((p) => p.id) : [];
  useEffect(() => {
    if (open && defaultPlanId && planIds.includes(defaultPlanId)) {
      form.setValue("planId", defaultPlanId);
    }
  }, [open, defaultPlanId, planIds.join(","), form.setValue]);

  const onSubmit = async (values: CreateTenantFormValues) => {
    try {
      const payload = {
        name: values.name,
        subdomain: values.subdomain,
        contact_email: values.contactEmail,
        phone: values.phone,
        address: values.address,
        plan_id: values.planId,
        admin_name: values.adminName,
        admin_email: values.adminEmail,
      };
      await api.post("/api/platform/tenants", payload);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      form.setError("root", {
        message: e instanceof Error ? e.message : "Failed to create tenant",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create tenant</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input id="subdomain" {...form.register("subdomain")} />
              {form.formState.errors.subdomain && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.subdomain.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                {...form.register("contactEmail")}
              />
              {form.formState.errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              value={form.watch("planId")}
              onValueChange={(v) => form.setValue("planId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(plans) ? plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} — {plan.price}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
            {form.formState.errors.planId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.planId.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name</Label>
              <Input id="adminName" {...form.register("adminName")} />
              {form.formState.errors.adminName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adminName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                {...form.register("adminEmail")}
              />
              {form.formState.errors.adminEmail && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adminEmail.message}
                </p>
              )}
            </div>
          </div>
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
