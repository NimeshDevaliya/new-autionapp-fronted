import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone project: stop Next inferring a workspace root from stray
  // lockfiles in parent folders
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
