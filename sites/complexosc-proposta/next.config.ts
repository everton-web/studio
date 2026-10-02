import type { NextConfig } from "next";

// Padrão da agência para LP: export estático (sobe a pasta out/ no public_html).
const nextConfig: NextConfig = { output: "export", images: { unoptimized: true } };

export default nextConfig;
