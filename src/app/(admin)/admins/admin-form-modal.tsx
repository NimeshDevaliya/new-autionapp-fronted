"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { adminsApi, type AdminInput } from "@/lib/api/admins";
import { queryKeys } from "@/lib/query-keys";
import type { Admin } from "@/types";

const baseSchema = z.object({
  name: z.string().trim().min(2, "Enter their full name"),
  email: z
    .string()
    .trim()
    .min(1, "Enter their email")
    .email("Enter a valid email"),
  role: z.enum(["SUPER_ADMIN", "AUCTION_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

/**
 * The two modes share one output shape, so the same form and resolver type
 * cover both. Only the new-admin path asks for — and checks — a password;
 * an existing password is never read back from the API.
 */
const createSchema = baseSchema.extend({
  password: z.string().min(8, "Use at least 8 characters"),
});

const editSchema = baseSchema.extend({
  password: z.string(),
});

type FormValues = z.infer<typeof createSchema>;

const EMPTY: FormValues = {
  name: "",
  email: "",
  password: "",
  role: "AUCTION_ADMIN",
  status: "ACTIVE",
};

function valuesFrom(admin: Admin): FormValues {
  return {
    name: admin.name,
    email: admin.email,
    password: "",
    role: admin.role,
    status: admin.status,
  };
}

/**
 * One form for both adding and editing an admin, so the two entry points
 * can't drift apart. Passing `admin` switches it into edit mode.
 */
export function AdminFormModal({
  open,
  onClose,
  admin,
  isSelf = false,
}: {
  open: boolean;
  onClose: () => void;
  admin?: Admin | null;
  /** Editing your own row also refreshes the session in the shell. */
  isSelf?: boolean;
}) {
  const editing = Boolean(admin);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema),
    defaultValues: EMPTY,
  });

  // reopening the modal must never show the previous admin's details
  useEffect(() => {
    if (!open) return;
    reset(admin ? valuesFrom(admin) : EMPTY);
  }, [open, admin, reset]);

  const save = useToastMutation({
    mutationFn: (input: AdminInput) =>
      admin ? adminsApi.update(admin._id, input) : adminsApi.create(input),
    successMessage: editing ? "Admin updated" : "Admin added",
    invalidate: isSelf ? [queryKeys.admins, queryKeys.auth] : [queryKeys.admins],
    onSuccess: () => {
      reset(EMPTY);
      onClose();
    },
  });

  const onSubmit = handleSubmit((values) => {
    save.mutate({
      name: values.name,
      email: values.email,
      role: values.role,
      status: values.status,
      // the API sets a password only when the account is created
      ...(editing ? {} : { password: values.password }),
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit admin" : "Add admin"}
      description={
        editing
          ? "Changes take effect the next time they load the panel."
          : "They can sign in as soon as you save, using the password you set here."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-form"
            variant="primary"
            loading={save.isPending}
          >
            {editing ? "Save changes" : "Add admin"}
          </Button>
        </>
      }
    >
      <form
        id="admin-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Name"
          required
          autoComplete="off"
          placeholder="Priya Sharma"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          required
          type="email"
          autoComplete="off"
          placeholder="priya@medianv.com"
          hint="They sign in with this address."
          error={errors.email?.message}
          {...register("email")}
        />

        {!editing && (
          <Input
            label="Password"
            required
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Share it with them securely — it can't be read back later."
            error={errors.password?.message}
            {...register("password")}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Role"
            required
            hint="Super admins can manage the team."
            error={errors.role?.message}
            {...register("role")}
          >
            <option value="AUCTION_ADMIN">Auction admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </Select>

          <Select
            label="Status"
            hint="Inactive accounts can't sign in."
            error={errors.status?.message}
            {...register("status")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
