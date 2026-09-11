"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useLogin } from "@/hooks/use-auth";
import { getToken } from "@/lib/api-client";

const schema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // already signed in — skip the form
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-lg bg-amber text-ink">
            <Gavel className="size-6" aria-hidden />
          </span>
          <h1 className="display text-3xl leading-tight">MedianV Auction</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to run auctions and manage the league.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((values) => login.mutate(values))}
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@medianv.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={login.isPending}
            className="mt-1"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
