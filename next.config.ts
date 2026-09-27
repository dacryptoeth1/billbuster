import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be opened by LAN IP (e.g. testing on a phone over venue Wi-Fi).
  // Without this, Next blocks its dev resources from non-localhost hosts, the page never
  // hydrates, and every button silently does nothing. Dev-only; no effect on production.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
