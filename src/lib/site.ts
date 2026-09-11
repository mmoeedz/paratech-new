/** Single source of truth for absolute URLs, metadata, and structured data. */
export const SITE = {
  name: "ParaTech",
  // `||`, not `??` — an env var that exists but is left blank in Vercel's
  // dashboard is an empty string, not undefined, so `??` would let it
  // through and crash `new URL("")` at build time.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://paratech.agency",
  email: "contact@paratechsolutions.com",
  tagline: "AI & Digital Solutions",
  description:
    "Paratech is a digital growth, technology, and AI automation partner. We design digital experiences, build software, drive growth, and automate business operations with AI.",
  social: {
    instagram: "https://www.instagram.com/paratech.sol/",
    linkedin: "https://www.linkedin.com/company/paratechsolutions",
  },
  // Names people actually search for us by (Search Console top queries),
  // used as schema.org alternateName so Google maps the variants to this
  // one entity instead of treating them as unrelated brands. Limited to
  // real name/spelling variants of *us* — deliberately excludes "Arpatech"
  // (a different, unrelated company — claiming it would misrepresent
  // someone else's brand as ours) and "ParaTech Ltd/LLC" (not our actual
  // legal entity name, so not something structured data should assert).
  alternateNames: [
    "ParaTech Solutions",
    "Para Tech",
    "ParaTech Software Solutions",
    "ParraTech",
    "ParaTechs",
    "PraTech",
  ],
  // Search-intent terms for the `keywords` meta tag — ignored by Google's
  // ranking but still read by Bing and some directories, so worth the
  // one-line cost.
  keywords: [
    "ParaTech",
    "ParaTech Solutions",
    "ParaTech Software Solutions",
    "Para Tech",
    "AI automation agency",
    "digital growth partner",
    "custom software development",
    "AI & digital solutions",
  ],
} as const;
