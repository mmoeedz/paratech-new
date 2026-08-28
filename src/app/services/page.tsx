import type { Metadata } from "next";
import { Services } from "@/components/Services";
import { AutomationShowcase } from "@/components/AutomationShowcase";
import { AIAgents } from "@/components/AIAgents";
import { Technology } from "@/components/Technology";
import { CTA } from "@/components/CTA";
import { JsonLd } from "@/components/JsonLd";
import { SERVICE_CATEGORIES } from "@/data/services";
import { SITE } from "@/lib/site";

const TITLE = "Services — Paratech";
const DESCRIPTION =
  "AI automation, web and custom software, growth marketing, and data analytics — four connected capabilities delivered by one team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/services" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ServicesPage() {
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: SERVICE_CATEGORIES.map((category, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: category.title,
      description: category.short,
      url: `${SITE.url}/services/${category.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={listSchema} />

      <Services />
      <AutomationShowcase />
      <AIAgents />
      <Technology />
      <CTA />
    </>
  );
}
