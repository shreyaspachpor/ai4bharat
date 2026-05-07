import type { NextConfig } from "next";
import os from "os";
// import withBundleAnalyzer from "@next/bundle-analyzer";

const dynamicAllowedDevOrigins = (() => {
  const set = new Set<string>(["localhost", "127.0.0.1"]);
  const nets = os.networkInterfaces();

  for (const netIf of Object.values(nets)) {
    for (const address of netIf || []) {
      if (address.family === "IPv4" && !address.internal) {
        set.add(address.address);
      }
    }
  }

  return [...set];
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...dynamicAllowedDevOrigins,
    "charming-ran-random-approve.trycloudflare.com",
  ],
  /* config options here */
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "ik.imagekit.io",
  //       port: "",
  //     },
  //   ],
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
};

// const wrapped = (withBundleAnalyzer as any)({ enabled: process.env.ANALYZE === "true" })(nextConfig as any);

export default nextConfig;
