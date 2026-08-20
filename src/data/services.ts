export type Service = {
  title: string;
  description: string;
};

export type ServiceCategory = {
  slug: string;
  number: string;
  /** Full name, used on the category page and in headings. */
  title: string;
  /** One-line summary for menus and cards. */
  short: string;
  /** Headline used at the top of the category page. */
  headline: string;
  /** Two-to-three sentence positioning paragraph. */
  intro: string;
  /** The single outcome this category is bought for. */
  outcome: string;
  services: Service[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "ai-automation",
    number: "01",
    title: "AI & Automation",
    short: "Systems that run the repetitive work for you.",
    headline: "Your business shouldn't run on repetitive tasks.",
    intro:
      "Most businesses lose hours every day to work that follows a predictable pattern — chasing leads, re-typing data between tools, answering the same questions, assembling the same reports. We build systems that handle that work automatically, and escalate to a person only when judgement is genuinely required.",
    outcome: "Work that moves forward without someone pushing it",
    services: [
      {
        title: "AI Lead Response & Qualification",
        description:
          "New enquiries get answered in seconds, qualified against your criteria, and routed to the right person — around the clock, including nights and weekends.",
      },
      {
        title: "WhatsApp & SMS Automation",
        description:
          "Meet customers on the channels they actually use, with conversations that can book, confirm, remind, and follow up on their own.",
      },
      {
        title: "Appointment & Follow-Up Automation",
        description:
          "Automated reminder sequences and one-tap confirmation that measurably cut no-shows, plus follow-up that keeps quiet leads warm.",
      },
      {
        title: "Document & Data Processing",
        description:
          "Invoices, receipts, forms, and contracts read and filed automatically, with the data landing in your systems instead of someone's inbox.",
      },
      {
        title: "CRM & Pipeline Automation",
        description:
          "Your CRM stays current without manual entry — enrichment, stage changes, task creation, and internal notifications all handled.",
      },
      {
        title: "Customer Support Automation",
        description:
          "An AI agent that answers from your real knowledge base, resolves the routine cases, and hands complex ones to your team with full context.",
      },
      {
        title: "AI Agents & Custom Solutions",
        description:
          "Purpose-built agents that research, analyse, decide, and act inside your workflows — connected to your live tools and APIs.",
      },
    ],
  },
  {
    slug: "web-software",
    number: "02",
    title: "Web & Software",
    short: "Websites and custom systems built around real workflows.",
    headline: "Software shaped around your business, not a template.",
    intro:
      "A website should do more than exist, and internal software should fit how your team already works. We design and build both — from conversion-focused marketing sites to the operational systems that replace spreadsheets and disconnected SaaS tools.",
    outcome: "Digital products that earn their keep",
    services: [
      {
        title: "Web Development",
        description:
          "Fast, reliable, accessible websites engineered for real-world performance rather than a good score on a demo page.",
      },
      {
        title: "Web Design & UI/UX",
        description:
          "Interfaces designed around how your customers actually behave, with a clear path from first impression to enquiry.",
      },
      {
        title: "Landing Pages & Conversion Design",
        description:
          "Focused pages built for specific campaigns and offers, structured to turn attention into enquiries.",
      },
      {
        title: "E-commerce Platforms",
        description:
          "Storefronts that handle real catalogues, real payment flows, and real fulfilment — wired into your operations.",
      },
      {
        title: "Custom Dashboards & Portals",
        description:
          "Client portals and internal dashboards that give each audience exactly the view and permissions they need.",
      },
      {
        title: "Business Systems & Web Apps",
        description:
          "Custom software that replaces a manual, spreadsheet-driven process end to end — built against your real data from day one.",
      },
    ],
  },
  {
    slug: "growth-marketing",
    number: "03",
    title: "Growth & Marketing",
    short: "Get found by customers already looking for you.",
    headline: "Be the business they find first.",
    intro:
      "Demand for what you do already exists — the question is whether you show up when someone goes looking. We build organic and paid visibility together, so you're not renting all of your traffic, and we measure everything against enquiries rather than impressions.",
    outcome: "Qualified traffic that converts, not just clicks",
    services: [
      {
        title: "SEO",
        description:
          "Technical, on-page, and content work that compounds — built around the searches that actually bring buyers.",
      },
      {
        title: "Local SEO",
        description:
          "Own the searches happening in your service area, where intent is highest and competition is beatable.",
      },
      {
        title: "Google Maps Optimization",
        description:
          "Google Business Profile, categories, reviews, and location signals tuned so you appear in the local map pack.",
      },
      {
        title: "Google Ads & PPC",
        description:
          "Search campaigns built on buying intent, with tight keyword targeting and conversion tracking that proves what worked.",
      },
      {
        title: "Social Media Marketing",
        description:
          "Consistent, on-brand presence on the platforms where your customers spend attention — organic and paid.",
      },
      {
        title: "Conversion Optimization",
        description:
          "Turn more of the traffic you already pay for into enquiries, by fixing the specific points where people drop off.",
      },
    ],
  },
  {
    slug: "data-analytics",
    number: "04",
    title: "Data & Analytics",
    short: "Turn scattered business data into decisions.",
    headline: "Decisions backed by data you can trust.",
    intro:
      "Most businesses already have the data they need — it's just spread across tools that don't talk to each other. We unify it, then build the dashboards and automated reporting that turn it into something you can actually run the business on.",
    outcome: "One clear view of how the business is performing",
    services: [
      {
        title: "Business Dashboards",
        description:
          "Interactive dashboards that unify your sources into a single live view, built for the decisions you make weekly.",
      },
      {
        title: "Automated Reporting",
        description:
          "Reports that assemble and deliver themselves on schedule, so nobody spends a morning rebuilding a spreadsheet.",
      },
      {
        title: "KPI & Performance Tracking",
        description:
          "The handful of numbers that actually matter, tracked consistently and visible to the people who own them.",
      },
      {
        title: "Attribution & Analytics",
        description:
          "Clear reporting on which channels and campaigns produce enquiries and revenue — not just sessions.",
      },
      {
        title: "Forecasting & Anomaly Detection",
        description:
          "Cash flow, receivables, and operational metrics flagged before they become problems, not after.",
      },
    ],
  },
];

export function getServiceCategory(slug: string) {
  return SERVICE_CATEGORIES.find((category) => category.slug === slug);
}
