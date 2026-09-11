"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/states";
import { getToken } from "@/lib/api-client";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/dashboard" : "/login");
  }, [router]);

  return <LoadingState label="Taking you in" className="min-h-screen" />;
}
