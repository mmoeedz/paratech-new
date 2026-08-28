import type { Metadata } from "next";
import { About } from "@/components/About";
import { WhyUs } from "@/components/WhyUs";
import { CTA } from "@/components/CTA";

const TITLE = "About — Paratech";
const DESCRIPTION =
  "A team built around design, engineering, growth, automation, and AI.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
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
