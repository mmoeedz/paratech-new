import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SERVICE_CATEGORIES } from "@/data/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/work", priority: 0.8 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.7 },
    { path: "/insights", priority: 0.4 },
  ];

  // No CMS or per-page update tracking exists yet, so lastModified is
  // omitted rather than stamped with the build/request time — a fake date
  // is worse for crawlers than no date at all. Add it back once pages carry
  // a real content update date.
  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE.url}${route.path}`,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...SERVICE_CATEGORIES.map((category) => ({
      url: `${SITE.url}/services/${category.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
