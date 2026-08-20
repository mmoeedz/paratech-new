import type { Metadata } from "next";
import { Services } from "@/components/Services";
import { AutomationShowcase } from "@/components/AutomationShowcase";
import { AIAgents } from "@/components/AIAgents";
import { Technology } from "@/components/Technology";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Services — Paratech",
  description:
    "AI automation, web and custom software, growth marketing, and data analytics — four connected capabilities delivered by one team.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <Services />
      <AutomationShowcase />
      <AIAgents />
      <Technology />
      <CTA />
    </>
  );
}
