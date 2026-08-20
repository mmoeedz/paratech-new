import type { Metadata } from "next";
import { About } from "@/components/About";
import { WhyUs } from "@/components/WhyUs";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "About — Paratech",
  description:
    "A team built around design, engineering, growth, automation, and AI.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <About />
      <WhyUs />
      <CTA />
    </>
  );
}
