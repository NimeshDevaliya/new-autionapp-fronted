"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToastMutation } from "@/hooks/use-toast-mutation";
import { adminsApi } from "@/lib/api/admins";
import { queryKeys } from "@/lib/query-keys";
import type { Admin } from "@/types";

const schema = z.object({
  newPassword: z.string().min(8, "Use at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

/** Sets a new password for another admin. The old one is never shown. */
export function ResetPasswordModal({
  open,
  onClose,
  admin,
}: {
  open: boolean;
  onClose: () => void;
  admin: Admin;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "" },
  });

  // never carry a typed password across opens
  useEffect(() => {
    if (open) reset({ newPassword: "" });
  }, [open, admin, reset]);

  const resetPassword = useToastMutation({
    mutationFn: (values: FormValues) =>
      adminsApi.resetPassword(admin._id, values.newPassword),
    successMessage: `Password reset for ${admin.name}`,
    invalidate: [queryKeys.admins],
    onSuccess: () => {
      reset({ newPassword: "" });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset password"
      description={`Sets a new sign-in password for ${admin.name}.`}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={resetPassword.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="reset-password-form"
            variant="primary"
            loading={resetPassword.isPending}
          >
            Reset password
          </Button>
        </>
      }
    >
      <form
        id="reset-password-form"
        onSubmit={handleSubmit((values) => resetPassword.mutate(values))}
        className="flex flex-col gap-4"
        noValidate
      >
        <p className="text-sm text-muted">
          {admin.email} will need this password the next time they sign in.
          Their current one stops working immediately.
        </p>
        <Input
          label="New password"
          required
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Share it with them securely — it can't be read back later."
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
      </form>
    </Modal>
  );
}
