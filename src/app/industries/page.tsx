import type { Metadata } from "next";
import { Industries } from "@/components/Industries";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Industries — Paratech",
  description:
    "AI automation and calling agent services tailored to ten industries — from home services and real estate to enterprise support.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <Industries />
      <CTA />
    </>
  );
}
