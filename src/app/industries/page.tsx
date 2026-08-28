import type { Metadata } from "next";
import { Industries } from "@/components/Industries";
import { CTA } from "@/components/CTA";
import { JsonLd } from "@/components/JsonLd";
import { INDUSTRIES } from "@/data/industries";
import { SITE } from "@/lib/site";

const TITLE = "Industries | ParaTech";
const DESCRIPTION =
  "AI automation and calling agent services tailored to ten industries — from home services and real estate to enterprise support.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/industries" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/industries" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function IndustriesPage() {
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: INDUSTRIES.map((industry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: industry.title,
      description: industry.short,
      url: `${SITE.url}/industries/${industry.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={listSchema} />

      <Industries />
      <CTA />
    </>
  );
}
