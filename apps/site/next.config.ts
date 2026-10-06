import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    // Hospedagem estática não oferece a rota dinâmica /_next/image.
    unoptimized: true,
  },
};

export default nextConfig;
