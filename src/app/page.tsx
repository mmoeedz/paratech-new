import { Hero } from "@/components/Hero";
import { ServicesScroll } from "@/components/ServicesScroll";
import { HowWeWork } from "@/components/HowWeWork";
import { ExploreLinks } from "@/components/ExploreLinks";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesScroll />
      <HowWeWork />
      <ExploreLinks />
      <CTA />
    </>
  );
}
