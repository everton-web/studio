import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Relatórios ficam fora: são noindex (meta robots + X-Robots-Tag no .htaccess).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://evertonbrito.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
