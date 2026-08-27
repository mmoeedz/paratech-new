import { Hero } from "@/components/Hero";
import { LabelBand } from "@/components/LabelBand";
import { ServicesScroll } from "@/components/ServicesScroll";
import { FlowScene } from "@/components/FlowScene";
import { AgentScene } from "@/components/AgentScene";
import { HowWeAutomate } from "@/components/HowWeAutomate";
import { HowWeWork } from "@/components/HowWeWork";
import { CTA } from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <LabelBand />
      <ServicesScroll />
      <FlowScene />
      <HowWeAutomate />
      <AgentScene />
      <HowWeWork />
      <CTA />
    </>
  );
}
