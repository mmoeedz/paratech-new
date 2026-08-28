/** Single source of truth for absolute URLs, metadata, and structured data. */
export const SITE = {
  name: "Paratech",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://paratech.agency",
  email: "contact@paratechsolutions.com",
  tagline: "Design. Build. Grow. Automate.",
  description:
    "Paratech is a digital growth, technology, and AI automation partner. We design digital experiences, build software, drive growth, and automate business operations with AI.",
  // TODO: swap in the real profile URLs once they exist.
  social: {
    instagram: "#",
    linkedin: "#",
  },
} as const;
