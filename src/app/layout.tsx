import type { Metadata } from "next";
import { Syne, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

// Display face for headlines — wide, high-contrast geometric grotesque.
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body face: more readable at small sizes than the display face.
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Homepage-only title — every other page sets its own full title directly
// (the `%s` template below is an identity, not a suffix), so this string
// only ever surfaces on "/". Uses the full legal-style name, matching
// og:site_name and the WebSite schema below, to give Google a consistent
// brand signal instead of the bare domain in the search snippet.
const HOME_TITLE = `${SITE.legalName} | Digital Growth & AI`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: HOME_TITLE,
    template: `%s`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.legalName,
    url: SITE.url,
    title: HOME_TITLE,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Placeholder social links ("#") are left out rather than published as
// broken/misleading sameAs entries — this list fills in on its own once
// SITE.social carries real URLs.
const sameAs = Object.values(SITE.social).filter((url) => !url.startsWith("#"));

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  alternateName: [...SITE.alternateNames],
  url: SITE.url,
  logo: `${SITE.url}/icon.png`,
  email: SITE.email,
  description: SITE.description,
  areaServed: "Worldwide",
  serviceType: [
    "AI Automation",
    "Web Development",
    "Custom Software Development",
    "Search Engine Optimization",
    "Google Ads Management",
    "Data Analytics",
  ],
  ...(sameAs.length > 0 ? { sameAs } : {}),
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  // Full legal-style name at the WebSite level, matching og:site_name —
  // the ProfessionalService entity below (and its `publisher` reference
  // here) intentionally keeps the short "ParaTech" brand name.
  name: SITE.legalName,
  url: SITE.url,
  description: SITE.description,
  publisher: { "@type": "ProfessionalService", name: SITE.name },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* Without JS, scroll-reveal wrappers would stay at opacity 0. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-obsidian font-sans text-cloud">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-copper focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-obsidian"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
