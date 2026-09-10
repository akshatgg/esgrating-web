import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgratings.co.in";
const SITE_NAME = "ESG Ratings";
const OG_IMAGE = { url: "/images/banners/esg-rating.webp", alt: SITE_NAME };

// Open Graph and Twitter deliberately carry no title or description: Next
// fills both from each page's resolved `title` (with the "%s | ESG Ratings"
// template applied) and `description`. A default here would be inherited
// verbatim by every page that doesn't define its own `openGraph`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | ESG Ratings",
    default: "ESG Ratings — SEBI Registered ESG Rating Provider",
  },
  description:
    "Discover comprehensive ESG ratings and insights to evaluate sustainability performance, guiding responsible Investment decisions and promoting corporate accountability.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
