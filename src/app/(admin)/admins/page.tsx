"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { DataTable, Pagination, type Column } from "@/components/ui/table";
import { useCurrentAdmin } from "@/hooks/use-auth";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { adminsApi, type AdminListParams } from "@/lib/api/admins";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";
import type { Admin, AdminRole, AdminStatus } from "@/types";
import { AdminFormModal } from "./admin-form-modal";
import { ResetPasswordModal } from "./reset-password-modal";

const PAGE_SIZE = 20;

/** Keeps the list from refetching on every keystroke. */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function AdminsPage() {
  const session = useCurrentAdmin();
  const isSuperAdmin = session.data?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [status, setStatus] = useState<AdminStatus | "">("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [resetting, setResetting] = useState<Admin | null>(null);
  const [deleting, setDeleting] = useState<Admin | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const params: AdminListParams = {
    page,
    limit: PAGE_SIZE,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };

  const admins = useQuery({
    queryKey: queryKeys.adminList(params),
    queryFn: () => adminsApi.list(params),
    enabled: isSuperAdmin,
  });

  const meta = admins.data?.meta;

  const toggleStatus = useToastMutation({
    mutationFn: (target: Admin) =>
      adminsApi.update(target._id, {
        status: target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    successMessage: (updated) =>
      updated.status === "ACTIVE"
        ? `${updated.name} can sign in again`
        : `${updated.name} deactivated`,
    invalidate: [queryKeys.admins],
  });

  const remove = useToastMutation({
    mutationFn: (target: Admin) => adminsApi.remove(target._id),
    successMessage: "Admin deleted",
    invalidate: [queryKeys.admins],
    onSuccess: () => {
      setDeleting(null);
      // removing the last row of a page would otherwise strand you on an empty one
      if (page > 1 && (admins.data?.items.length ?? 0) <= 1) {
        setPage(page - 1);
      }
    },
  });

  if (session.isLoading) {
    return <LoadingState label="Checking your access" />;
  }

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader
          title="Admins"
          description="Who can sign in to the panel, and what they're allowed to do."
        />
        <Panel>
          <EmptyState
            icon={ShieldAlert}
            title="Super admins only"
            message="Only super admins can add, edit or remove team members. Ask one of them if you need your access changed."
          />
        </Panel>
      </>
    );
  }

  const hasFilters = Boolean(debouncedSearch || role || status);

  // any change to the filters starts the list again from the first page
  const clearFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  const columns: Column<Admin>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <span className="font-medium text-text">{row.name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-muted">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Created at",
      render: (row) => (
        <span className="tabular whitespace-nowrap text-muted">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => {
        const isSelf = row._id === session.data?._id;
        const togglePending =
          toggleStatus.isPending && toggleStatus.variables?._id === row._id;

        return (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={togglePending}
              disabled={toggleStatus.isPending}
              onClick={() => toggleStatus.mutate(row)}
            >
              {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="whitespace-nowrap"
              onClick={() => setResetting(row)}
            >
              Reset password
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isSelf}
              title={
                isSelf ? "You can't delete your own account" : undefined
              }
              className={
                isSelf ? undefined : "text-ball hover:bg-ball/10 hover:text-ball"
              }
              onClick={() => setDeleting(row)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Admins"
        description="Who can sign in to the panel, and what they're allowed to do."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add admin
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Input
            label="Search"
            type="search"
            placeholder="Name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          label="Role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as AdminRole | "");
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super admin</option>
          <option value="AUCTION_ADMIN">Auction admin</option>
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AdminStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      <Panel>
        {admins.isLoading ? (
          <LoadingState label="Loading admins" />
        ) : admins.isError ? (
          <ErrorState
            message={admins.error.message}
            onRetry={() => admins.refetch()}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={admins.data?.items ?? []}
              keyOf={(row) => row._id}
              emptyState={
                hasFilters ? (
                  <EmptyState
                    icon={Users}
                    title="No admins match those filters"
                    message="Try a different name, role or status."
                    action={
                      <Button size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No admins yet"
                    message="Add the people who need access to the auction panel."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditing(null);
                          setFormOpen(true);
                        }}
                      >
                        <Plus className="size-4" aria-hidden />
                        Add admin
                      </Button>
                    }
                  />
                )
              }
            />
            {meta && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Panel>

      <AdminFormModal
        open={formOpen}
        admin={editing}
        isSelf={Boolean(editing && editing._id === session.data?._id)}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      {resetting && (
        <ResetPasswordModal
          open
          admin={resetting}
          onClose={() => setResetting(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          title="Delete admin"
          message={`${deleting.name} (${deleting.email}) will lose access immediately. This can't be undone.`}
          confirmLabel="Delete admin"
          loading={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting)}
        />
      )}
    </>
  );
}
