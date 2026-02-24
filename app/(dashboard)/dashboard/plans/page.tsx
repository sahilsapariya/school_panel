"use client";

import { useState, useMemo } from "react";
import { usePlans, usePlanFeatures, useInvalidatePlans } from "@/hooks/useApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlanSchema, editPlanSchema, type CreatePlanFormValues, type EditPlanFormValues } from "@/lib/schemas";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Plan } from "@/types";
import { Switch } from "@/components/ui/switch";

export default function PlansPage() {
  const { data: plans, isLoading, error } = usePlans();
  const { data: planFeatures } = usePlanFeatures();
  const invalidatePlans = useInvalidatePlans();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

  const defaultFeatures = useMemo(() => {
    const f: Record<string, boolean> = {};
    (planFeatures ?? []).forEach(({ key }) => {
      f[key] = true;
    });
    return f;
  }, [planFeatures]);

  const createForm = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema) as never,
    defaultValues: { name: "", priceMonthly: 0, maxStudents: 100, maxTeachers: 20, features: defaultFeatures },
  });

  const editForm = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanSchema) as never,
    defaultValues: { name: "", priceMonthly: 0, maxStudents: 100, maxTeachers: 20, features: {} },
  });

  const handleCreate = async (values: CreatePlanFormValues) => {
    try {
      await api.post("/api/platform/plans", {
        name: values.name,
        price_monthly: values.priceMonthly,
        max_students: values.maxStudents,
        max_teachers: values.maxTeachers,
        features_json: values.features ?? undefined,
      });
      setCreateOpen(false);
      createForm.reset({ name: "", priceMonthly: 0, maxStudents: 100, maxTeachers: 20, features: defaultFeatures });
      await invalidatePlans();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (plan: Plan) => {
    setPlanToEdit(plan);
    const features = { ...defaultFeatures, ...plan.features };
    editForm.reset({
      name: plan.name,
      priceMonthly: plan.price,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      features,
    });
    setEditOpen(true);
  };

  const handleEdit = async (values: EditPlanFormValues) => {
    if (!planToEdit) return;
    try {
      await api.patch(`/api/platform/plans/${planToEdit.id}`, {
        name: values.name,
        price_monthly: values.priceMonthly,
        max_students: values.maxStudents,
        max_teachers: values.maxTeachers,
        features_json: values.features ?? undefined,
      });
      setEditOpen(false);
      setPlanToEdit(null);
      await invalidatePlans();
    } catch (e) {
      console.error(e);
    }
  };

  const openDelete = (plan: { id: string; name: string }) => {
    setPlanToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await api.delete(`/api/platform/plans/${planToDelete.id}`);
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
      await invalidatePlans();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Plans</h1>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load plans"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <Button
          onClick={() => {
            createForm.setValue("features", defaultFeatures);
            setCreateOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add plan
        </Button>
      </div>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Subscription plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create, edit, or delete plans. Plans in use by tenants cannot be deleted.
          </p>
        </CardHeader>
        <CardContent>
          {!plans?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              No plans configured. Add a plan to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Price (INR/mo)</TableHead>
                  <TableHead className="text-right">Max Students</TableHead>
                  <TableHead className="text-right">Max Teachers</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(plan.price)}
                    </TableCell>
                    <TableCell className="text-right">{plan.maxStudents}</TableCell>
                    <TableCell className="text-right">{plan.maxTeachers}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(plan)}
                          aria-label="Edit plan"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(plan)}
                          aria-label="Delete plan"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input id="create-name" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-price">Price (INR/month)</Label>
              <Input id="create-price" type="number" step="0.01" {...createForm.register("priceMonthly")} />
              {createForm.formState.errors.priceMonthly && (
                <p className="text-sm text-destructive">{createForm.formState.errors.priceMonthly.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-maxStudents">Max students</Label>
                <Input id="create-maxStudents" type="number" {...createForm.register("maxStudents")} />
                {createForm.formState.errors.maxStudents && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.maxStudents.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-maxTeachers">Max teachers</Label>
                <Input id="create-maxTeachers" type="number" {...createForm.register("maxTeachers")} />
                {createForm.formState.errors.maxTeachers && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.maxTeachers.message}</p>
                )}
              </div>
            </div>
            {planFeatures && planFeatures.length > 0 && (
              <div className="space-y-3">
                <Label>Features</Label>
                <p className="text-xs text-muted-foreground">Enable or disable features for this plan. Disabled features will be hidden and blocked for tenants on this plan.</p>
                <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  {planFeatures.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={createForm.watch("features")?.[key] ?? true}
                        onCheckedChange={(checked: boolean) =>
                          createForm.setValue("features", { ...createForm.watch("features"), [key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setPlanToEdit(null); setEditOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (INR/month)</Label>
              <Input id="edit-price" type="number" step="0.01" {...editForm.register("priceMonthly")} />
              {editForm.formState.errors.priceMonthly && (
                <p className="text-sm text-destructive">{editForm.formState.errors.priceMonthly.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxStudents">Max students</Label>
                <Input id="edit-maxStudents" type="number" {...editForm.register("maxStudents")} />
                {editForm.formState.errors.maxStudents && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.maxStudents.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxTeachers">Max teachers</Label>
                <Input id="edit-maxTeachers" type="number" {...editForm.register("maxTeachers")} />
                {editForm.formState.errors.maxTeachers && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.maxTeachers.message}</p>
                )}
              </div>
            </div>
            {planFeatures && planFeatures.length > 0 && (
              <div className="space-y-3">
                <Label>Features</Label>
                <p className="text-xs text-muted-foreground">Enable or disable features for this plan.</p>
                <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  {planFeatures.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={editForm.watch("features")?.[key] ?? true}
                        onCheckedChange={(checked: boolean) =>
                          editForm.setValue("features", { ...editForm.watch("features"), [key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the plan &quot;{planToDelete?.name}&quot;. Plans that are assigned to tenants cannot be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
