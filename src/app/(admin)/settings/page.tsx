"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useChangePassword, useCurrentAdmin } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Repeat the new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Both new passwords must match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** Values baked in at build time from the environment — never secrets. */
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-text">{children}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const session = useCurrentAdmin();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const onSubmit = handleSubmit((values) => {
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      // clear the fields so a shared screen doesn't keep them around
      { onSuccess: () => reset(EMPTY) }
    );
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account and how this panel reaches the auction server."
      />

      <div className="flex max-w-[640px] flex-col gap-5">
        <Panel>
          <PanelHeader
            title="Your profile"
            description="Ask a super admin if any of this needs changing."
          />
          {session.isLoading ? (
            <LoadingState label="Loading your profile" className="py-10" />
          ) : session.isError || !session.data ? (
            <ErrorState
              title="Couldn't load your profile"
              message={session.error?.message}
              onRetry={() => session.refetch()}
              className="py-10"
            />
          ) : (
            <dl className="divide-y divide-line">
              <DetailRow label="Name">{session.data.name}</DetailRow>
              <DetailRow label="Email">
                <span className="break-all">{session.data.email}</span>
              </DetailRow>
              <DetailRow label="Role">
                <StatusBadge status={session.data.role} />
              </DetailRow>
              <DetailRow label="Last login">
                <span className="tabular">
                  {formatDate(session.data.lastLoginAt)}
                </span>
              </DetailRow>
            </dl>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Change password"
            description="You'll stay signed in on this device."
          />
          <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5" noValidate>
            <Input
              label="Current password"
              required
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <Input
              label="New password"
              required
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Input
              label="Confirm new password"
              required
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={changePassword.isPending}
              >
                Change password
              </Button>
            </div>
          </form>
        </Panel>

        <Panel>
          <PanelHeader
            title="Connection"
            description="Where this panel sends its requests."
          />
          <dl className="divide-y divide-line">
            <DetailRow label="API base URL">
              <code className="break-all font-mono text-sm text-text">
                {API_URL ?? "Not configured"}
              </code>
            </DetailRow>
            <DetailRow label="WebSocket URL">
              <code className="break-all font-mono text-sm text-text">
                {WS_URL ?? "Not configured"}
              </code>
            </DetailRow>
          </dl>
          <p className="border-t border-line px-5 py-3.5 text-sm text-faint">
            Both come from environment variables and are fixed when the panel is
            built. Change them in the deployment environment, not here.
          </p>
        </Panel>
      </div>
    </>
  );
}
