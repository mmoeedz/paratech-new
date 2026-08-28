import type { Metadata } from "next";
import { CaseStudies } from "@/components/CaseStudies";
import { CTA } from "@/components/CTA";

const TITLE = "Work — Paratech";
const DESCRIPTION =
  "Case studies across design, development, growth, and AI automation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/work" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function WorkPage() {
  return (
    <>
      <CaseStudies />
      <CTA primaryLabel="Discuss a similar project" />
    </>
  );
}
