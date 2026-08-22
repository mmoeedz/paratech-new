import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — Paratech",
  description:
    "Tell us what you're trying to design, build, grow, or automate. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

const FAQ = [
  {
    question: "How quickly can you start?",
    answer:
      "Discovery usually begins within a week of scope being agreed. Smaller automation work can often start sooner.",
  },
  {
    question: "Do you work with small businesses?",
    answer:
      "Yes. A single well-chosen automation or a focused website is a perfectly good first engagement — you don't need a large budget to start.",
  },
  {
    question: "What does a project cost?",
    answer:
      "It depends on scope, integrations, and timeline, so we quote per engagement rather than from a rate card. You'll have a fixed number before any work starts.",
  },
];

export default async function ContactPage(props: PageProps<"/contact">) {
  const searchParams = await props.searchParams;
  const serviceParam = searchParams.service;
  const defaultService =
    typeof serviceParam === "string" ? serviceParam : undefined;

  return (
    <>
      <section className="relative overflow-hidden bg-obsidian pt-36 pb-24 sm:pt-44 lg:pt-52 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
        <div className="pointer-events-none absolute inset-0 bg-radial-copper" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <Eyebrow>Contact</Eyebrow>
              <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-cloud sm:text-5xl">
                Let&apos;s automate something real.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-cloud-soft">
                Tell us what you&apos;re trying to improve. We&apos;ll tell you
                whether we can help, what it would take, and what it would cost
                — before you commit to anything.
              </p>

              <div className="mt-10 flex flex-col gap-6 border-t border-line pt-8">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cloud-faint">
                    Email
                  </p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="mt-2 inline-block text-base font-medium text-copper transition-colors hover:text-cloud"
                  >
                    {SITE.email}
                  </a>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cloud-faint">
                    Response time
                  </p>
                  <p className="mt-2 text-base text-cloud">
                    Within one business day
                  </p>
                </div>
              </div>
            </div>

            <Reveal delay={0.08}>
              <div className="rounded-xl border border-line bg-deep/60 p-7 lg:p-9">
                <ContactForm defaultService={defaultService} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-ivory py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
            Before you write
          </h2>
          <dl className="mt-10 flex flex-col divide-y divide-line-light border-t border-line-light">
            {FAQ.map((item, i) => (
              <Reveal key={item.question} delay={i * 0.05}>
                <div className="py-6">
                  <dt className="text-base font-semibold text-ink">
                    {item.question}
                  </dt>
                  <dd className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">
                    {item.answer}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
