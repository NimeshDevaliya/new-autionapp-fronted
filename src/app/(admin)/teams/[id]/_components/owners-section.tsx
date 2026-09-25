"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { teamOwnersApi } from "@/lib/api/team-owners";
import { queryKeys } from "@/lib/query-keys";
import type { TeamOwner } from "@/types";

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the owner's name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type CreateValues = z.infer<typeof createSchema>;

const resetSchema = z.object({ password: z.string().min(8, "At least 8 characters") });
type ResetValues = z.infer<typeof resetSchema>;

/** Who can sign in at /team/login and bid for this team. */
export function OwnersSection({ teamId }: { teamId: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const [resetFor, setResetFor] = useState<TeamOwner | null>(null);
  const [deleteFor, setDeleteFor] = useState<TeamOwner | null>(null);

  const owners = useQuery({
    queryKey: queryKeys.teamOwners(teamId),
    queryFn: () => teamOwnersApi.list(teamId),
  });
  const invalidate = [queryKeys.teamOwners(teamId)];

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const create = useToastMutation({
    mutationFn: (values: CreateValues) => teamOwnersApi.create(teamId, values),
    successMessage: "Owner login created",
    invalidate,
    onSuccess: () => {
      setAddOpen(false);
      createForm.reset();
    },
  });
  const toggle = useToastMutation({
    mutationFn: (owner: TeamOwner) =>
      teamOwnersApi.update(teamId, owner._id, {
        status: owner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    successMessage: (owner) =>
      owner.status === "ACTIVE" ? "Owner reactivated" : "Owner deactivated",
    invalidate,
  });
  const reset = useToastMutation({
    mutationFn: (values: ResetValues) =>
      teamOwnersApi.update(teamId, resetFor!._id, { password: values.password }),
    successMessage: "Password reset",
    invalidate,
    onSuccess: () => {
      setResetFor(null);
      resetForm.reset();
    },
  });
  const remove = useToastMutation({
    mutationFn: () => teamOwnersApi.remove(teamId, deleteFor!._id),
    successMessage: "Owner login deleted",
    invalidate,
    onSuccess: () => setDeleteFor(null),
  });

  const columns: Column<TeamOwner>[] = [
    {
      key: "name",
      header: "Name",
      render: (o) => <span className="font-medium text-text">{o.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (o) => <span className="text-muted">{o.email}</span>,
    },
    { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
    {
      key: "actions",
      header: "",
      render: (o) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetFor(o)}
            aria-label={`Reset password for ${o.name}`}
          >
            <KeyRound className="size-4" aria-hidden /> Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggle.mutate(o)}
            loading={toggle.isPending}
            aria-label={`${o.status === "ACTIVE" ? "Deactivate" : "Activate"} ${o.name}`}
          >
            {o.status === "ACTIVE" ? (
              <UserX className="size-4" aria-hidden />
            ) : (
              <UserCheck className="size-4" aria-hidden />
            )}
            {o.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteFor(o)}
            aria-label={`Delete ${o.name}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Panel className="mt-6">
      <PanelHeader
        title="Owner logins"
        description="Owners sign in at /team/login and bid for this team from their own phone."
        action={
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden /> Add owner
          </Button>
        }
      />
      {owners.isLoading ? (
        <TableSkeleton rows={2} cols={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={owners.data ?? []}
          keyOf={(o) => o._id}
          emptyState={
            <EmptyState
              title="No owner logins yet"
              message="Add one so the team can bid from the team app."
            />
          }
        />
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add owner login"
        description="They'll use these details at /team/login."
        size="sm"
      >
        <form
          onSubmit={createForm.handleSubmit((v) => create.mutate(v))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Name"
            error={createForm.formState.errors.name?.message}
            {...createForm.register("name")}
          />
          <Input
            label="Email"
            type="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register("email")}
          />
          <Input
            label="Password"
            type="text"
            autoComplete="off"
            hint="Share this with the owner; they can't change it themselves."
            error={createForm.formState.errors.password?.message}
            {...createForm.register("password")}
          />
          <Button type="submit" variant="primary" fullWidth loading={create.isPending}>
            Create login
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title={`Reset password for ${resetFor?.name ?? ""}`}
        size="sm"
      >
        <form
          onSubmit={resetForm.handleSubmit((v) => reset.mutate(v))}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="New password"
            type="text"
            autoComplete="off"
            error={resetForm.formState.errors.password?.message}
            {...resetForm.register("password")}
          />
          <Button type="submit" variant="primary" fullWidth loading={reset.isPending}>
            Reset password
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => remove.mutate()}
        title={`Delete ${deleteFor?.name ?? "this owner"}?`}
        message="They will be signed out and can no longer bid for this team."
        confirmLabel="Delete login"
        loading={remove.isPending}
        destructive
      />
    </Panel>
  );
}
