import type { Metadata } from "next";
import { CaseStudies } from "@/components/CaseStudies";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Work — Paratech",
  description:
    "Case studies across design, development, growth, and AI automation.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <CaseStudies />
      <CTA primaryLabel="Discuss a similar project" />
    </>
  );
}
