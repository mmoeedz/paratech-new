import { Hero } from "@/components/Hero";
import { ServicesScroll } from "@/components/ServicesScroll";
import { HowWeWork } from "@/components/HowWeWork";
import { HowWeAutomate } from "@/components/HowWeAutomate";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesScroll />
      <HowWeWork />
      <HowWeAutomate />
      <CTA />
    </>
  );
}
