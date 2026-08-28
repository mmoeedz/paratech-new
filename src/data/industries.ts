/**
 * Ten industries Paratech's AI automation & calling agent services target,
 * each with its own pain points and the specific services that solve them.
 * Content adapted from the internal industry playbook (Downloads/
 * AI_Automation_Industry_Playbook.pdf) into client-facing copy — the
 * playbook's "services you can offer" framing (written for reseller
 * outreach) is rewritten here as what Paratech itself delivers.
 */

export type IndustryService = {
  title: string;
  description: string;
};

export type Industry = {
  slug: string;
  number: string;
  title: string;
  /** The specific businesses this category covers. */
  subtitle: string;
  /** One-line summary for the index grid. */
  short: string;
  painPoints: string[];
  services: IndustryService[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "home-property-services",
    number: "01",
    title: "Home & Property Services",
    subtitle:
      "HVAC · Plumbing · Electricians · Roofing · Construction & Trades · Logistics & Delivery",
    short:
      "Every missed call is a job worth thousands going straight to a competitor — we make sure none go unanswered.",
    painPoints: [
      "Every missed call is a job worth $3,000–$10,000 going straight to a competitor.",
      "Technicians are on-site and can't answer the phone during business hours.",
      "No coverage for after-hours emergency calls — burst pipes, no heat, and other emergencies.",
      "Quotes and follow-ups get delayed or forgotten during the busy season.",
    ],
    services: [
      {
        title: "AI Calling Agent (Inbound)",
        description:
          "Answers every call instantly, 24/7, and books or routes emergency jobs.",
      },
      {
        title: "Missed-Call Text-Back",
        description:
          "Auto-texts any caller who couldn't get through, within seconds.",
      },
      {
        title: "Appointment & Dispatch Booking",
        description:
          "Books jobs directly into the calendar or dispatch system.",
      },
      {
        title: "Quote & Invoice Follow-Up",
        description:
          "Automatically follows up on unsigned quotes to close more jobs.",
      },
      {
        title: "Review Request Automation",
        description:
          "Sends a review request automatically after a completed job.",
      },
      {
        title: "CRM Integration & Lead Logging",
        description: "Every call and lead is logged and tagged automatically.",
      },
    ],
  },
  {
    slug: "real-estate",
    number: "02",
    title: "Real Estate",
    subtitle: "Agents · Brokerages · Property Managers",
    short:
      "Buyer and renter inquiries go cold within minutes if unanswered — we answer every one instantly, day or night.",
    painPoints: [
      "Buyer/renter inquiries come in at all hours and go cold within minutes if unanswered.",
      "Agents are showing properties and can't pick up every call.",
      "Manual follow-up on leads is inconsistent, so warm leads slip away.",
    ],
    services: [
      {
        title: "AI Calling Agent (Instant Lead Response)",
        description: "Answers every inbound inquiry immediately, day or night.",
      },
      {
        title: "Showing & Viewing Scheduler",
        description: "Books property viewings directly into the agent's calendar.",
      },
      {
        title: "WhatsApp/SMS Inquiry Automation",
        description:
          "Handles listing questions and shares details automatically.",
      },
      {
        title: "Lead Scoring & Routing",
        description:
          "Ranks leads by intent and routes hot ones straight to an agent.",
      },
      {
        title: "Automated Follow-Up Sequences",
        description: "Nurtures leads who aren't ready to buy or rent yet.",
      },
      {
        title: "Insights Dashboard",
        description:
          "Shows response times, conversion rates, and peak inquiry hours.",
      },
    ],
  },
  {
    slug: "healthcare-wellness-beauty",
    number: "03",
    title: "Healthcare, Wellness & Beauty",
    subtitle: "Clinics · Dental Practices · Spas · Gyms & Fitness Studios · Beauty Salons",
    short:
      "Front desks juggling walk-ins, phones, and bookings lose appointments — automated scheduling and reminders don't.",
    painPoints: [
      "Front desk staff are overwhelmed juggling walk-ins, phones, and bookings.",
      "Missed calls mean missed appointments and lost revenue.",
      "No-shows are a constant, costly problem.",
      "Membership and package renewals are easy to forget without automated follow-up.",
    ],
    services: [
      {
        title: "AI Appointment Scheduling",
        description:
          "Books, reschedules, and confirms appointments over the phone or chat.",
      },
      {
        title: "Automated Reminders",
        description:
          "Reduces no-shows with SMS and call reminders before each appointment.",
      },
      {
        title: "Missed-Call Recovery",
        description:
          "Captures and follows up on every call the front desk couldn't take.",
      },
      {
        title: "Patient/Client Follow-Up",
        description: "Checks in after visits and re-engages inactive clients.",
      },
      {
        title: "Membership & Renewal Automation",
        description: "Auto-reminds gym or spa members before renewal dates.",
      },
      {
        title: "FAQ & Intake Chatbot",
        description: "Answers hours, pricing, and service questions instantly.",
      },
    ],
  },
  {
    slug: "hospitality-food",
    number: "04",
    title: "Hospitality & Food",
    subtitle: "Hotels · Restaurants · Event Venues",
    short:
      "Reservation calls go unanswered during rush hours — booking, ordering, and event inquiries run themselves instead.",
    painPoints: [
      "Reservation calls go unanswered during rush hours.",
      "Staff can't manage phones and in-person service at the same time.",
      "Large or private event inquiries get delayed responses.",
    ],
    services: [
      {
        title: "AI Reservation/Booking Agent",
        description: "Takes table or room bookings over the phone automatically.",
      },
      {
        title: "Order & Takeout Call Handling",
        description:
          "Handles phone-in food orders without pulling staff off the floor.",
      },
      {
        title: "Waitlist & Table Management",
        description:
          "Manages walk-in waitlists and notifies guests automatically.",
      },
      {
        title: "Event Inquiry Handling",
        description:
          "Captures private event and catering inquiries and books consultations.",
      },
      {
        title: "WhatsApp Ordering Automation",
        description: "Lets customers order or book directly via WhatsApp.",
      },
      {
        title: "Review & Feedback Automation",
        description: "Requests reviews and collects feedback after each visit.",
      },
    ],
  },
  {
    slug: "financial-professional-services",
    number: "05",
    title: "Financial & Professional Services",
    subtitle: "Banking · Insurance · Accounting · Consulting · Legal · Recruitment & Staffing",
    short:
      "High-value inquiries need a fast, professional first response — especially where a missed call can mean a lost case.",
    painPoints: [
      "High-value client inquiries need a fast, professional first response.",
      "Compliance and confidentiality requirements make manual intake slow.",
      "Missed intake calls — especially in legal — can mean a lost high-value case or client.",
    ],
    services: [
      {
        title: "AI Intake & Qualification Agent",
        description: "Handles first-contact calls and qualifies leads professionally.",
      },
      {
        title: "Consultation Scheduling",
        description: "Books client consultations directly into advisor or lawyer calendars.",
      },
      {
        title: "Secure Client Follow-Up",
        description: "Automated, compliant follow-up on pending documents or cases.",
      },
      {
        title: "Document & Appointment Reminders",
        description: "Reduces missed meetings and late document submissions.",
      },
      {
        title: "CRM / Case Management Integration",
        description: "Every lead and client interaction is logged automatically.",
      },
      {
        title: "Insights Dashboard",
        description:
          "Tracks lead conversion, response time, and case or client pipeline.",
      },
    ],
  },
  {
    slug: "retail-ecommerce-automotive",
    number: "06",
    title: "Retail, E-commerce & Automotive",
    subtitle: "Online & Physical Retail · Auto Repair Shops · Dealerships",
    short:
      "Order questions, service bookings, and abandoned carts — handled and recovered automatically, around the clock.",
    painPoints: [
      "Customers call about order status, returns, and stock instead of using self-service.",
      "Service bays and dealerships miss booking calls during busy hours.",
      "Abandoned carts and unconfirmed orders go unrecovered.",
    ],
    services: [
      {
        title: "AI Order Tracking & Support Agent",
        description: "Answers order status, returns, and stock questions instantly.",
      },
      {
        title: "Cart Recovery Calls/Texts",
        description: "Automatically follows up on abandoned online carts.",
      },
      {
        title: "Service Appointment Booking",
        description:
          "Books repair and service appointments for auto shops and dealers.",
      },
      {
        title: "Missed-Call Recovery",
        description: "Recovers leads from unanswered service or sales calls.",
      },
      {
        title: "Review Automation",
        description: "Requests reviews after purchases or completed services.",
      },
    ],
  },
  {
    slug: "enterprise-large-scale",
    number: "07",
    title: "Enterprise & Large-Scale Industries",
    subtitle: "Technology & SaaS · Manufacturing · Large Banking/Insurance · Telecom",
    short:
      "High call and ticket volumes overwhelm human-only teams — conversational AI scales where legacy IVR can't.",
    painPoints: [
      "High call and ticket volumes overwhelm human-only support teams.",
      "Legacy IVR systems frustrate customers and hurt satisfaction scores.",
      "Leadership needs real-time visibility into operational and customer data.",
    ],
    services: [
      {
        title: "Enterprise AI Voice Agents",
        description: "Replaces or upgrades legacy IVR with natural, conversational AI.",
      },
      {
        title: "Support Ticket Triage",
        description: "Automatically classifies and routes incoming support requests.",
      },
      {
        title: "Workflow & Systems Integration",
        description: "Connects AI automation into existing enterprise software.",
      },
      {
        title: "Custom AI Agent Development",
        description: "Builds tailored agents for specific enterprise workflows.",
      },
      {
        title: "Predictive Insights Dashboards",
        description: "Surfaces trends across calls, tickets, and customer data.",
      },
    ],
  },
  {
    slug: "marketing-outsourcing-tech",
    number: "08",
    title: "Marketing, Outsourcing & Tech Services",
    subtitle: "Digital Marketing Agencies · Call Centers & BPOs · IT/Software Outsourcing",
    short:
      "Agencies and BPOs want to offer more without hiring more — white-labeled AI services fill the gap.",
    painPoints: [
      "Agencies want to offer more to clients without hiring more staff.",
      "BPOs face rising labor costs and staffing shortages.",
      "Clients increasingly expect AI-powered service as standard.",
    ],
    services: [
      {
        title: "White-Label AI Calling Agent",
        description: "Agencies resell your AI calling service under their own brand.",
      },
      {
        title: "Outbound Calling for Campaigns",
        description:
          "AI-driven outbound calls to support marketing and sales campaigns.",
      },
      {
        title: "Done-For-You Fulfillment",
        description: "We handle the AI automation delivery behind the scenes.",
      },
      {
        title: "Client Reporting & Insights Dashboards",
        description: "Ready-made reports agencies can present to their own clients.",
      },
    ],
  },
  {
    slug: "education-training",
    number: "09",
    title: "Education & Training",
    subtitle: "Schools · Colleges · Training Institutes · EdTech",
    short:
      "Admissions inquiries go unanswered outside office hours — instant response keeps prospective students from dropping off.",
    painPoints: [
      "Admissions inquiries go unanswered outside office hours.",
      "Prospective students drop off without consistent follow-up.",
      "Class schedules and reminders are managed manually.",
    ],
    services: [
      {
        title: "AI Admissions/Enrollment Agent",
        description: "Answers inquiries and qualifies prospective students instantly.",
      },
      {
        title: "Automated Follow-Up",
        description: "Nurtures undecided applicants until they enroll or opt out.",
      },
      {
        title: "Class & Schedule Reminders",
        description: "Reduces no-shows for classes, tests, and orientations.",
      },
      {
        title: "FAQ Chatbot",
        description: "Handles fees, courses, and admission requirement questions.",
      },
    ],
  },
  {
    slug: "agriculture-emerging-sectors",
    number: "10",
    title: "Agriculture & Emerging Sectors",
    subtitle: "Agri-Business · Suppliers & Distributors · Other Early-Stage Adopters",
    short:
      "Limited digital infrastructure and low bandwidth call for lightweight automation, not complex software.",
    painPoints: [
      "Limited digital infrastructure makes complex software hard to adopt.",
      "Buyers and suppliers coordinate manually over phone calls.",
      "Low-bandwidth areas need lightweight, simple communication tools.",
    ],
    services: [
      {
        title: "AI Order/Inquiry Handling",
        description: "Manages buyer-supplier calls for orders and pricing questions.",
      },
      {
        title: "WhatsApp/SMS-Based Automation",
        description: "Lightweight automation that works well on low bandwidth.",
      },
      {
        title: "Basic Scheduling & Follow-Up",
        description: "Simple automated reminders for deliveries and orders.",
      },
    ],
  },
];

export function getIndustry(slug: string) {
  return INDUSTRIES.find((industry) => industry.slug === slug);
}
