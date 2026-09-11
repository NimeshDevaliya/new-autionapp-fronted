import os from "os";
import type { NextConfig } from "next";

/**
 * Hosts the dev server may be opened from besides localhost: every LAN address
 * of this machine, so the app works from a phone or another PC on the network
 * (Next blocks cross-origin dev requests otherwise). Extra hosts can be added
 * with NEXT_DEV_ALLOWED_ORIGINS=host1,host2. Dev only — no effect on builds.
 */
function lanHosts(): string[] {
  const hosts = new Set<string>();
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) hosts.add(address.address);
    }
  }
  for (const host of (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "").split(",")) {
    if (host.trim()) hosts.add(host.trim());
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  // standalone project: stop Next inferring a workspace root from stray
  // lockfiles in parent folders
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: lanHosts(),
};

export default nextConfig;
