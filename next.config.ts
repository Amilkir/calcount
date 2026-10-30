import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

// Expone los bindings de Cloudflare (D1) a `next dev`.
initOpenNextCloudflareForDev();

export default nextConfig;
