/** Home page copy, verbatim from ../docs/analysis/content.md §2.1. */

export const HERO = {
  bg: "/images/home/hero-bg.jpg",
  badgeLine1: "SEBI Registered",
  badgeLine2: "ESG Rating Provider",
  // Kept exactly as the source text — do not "fix" to "AI".
  tagline: "India's first Al enabled ESG Rating Provider",
  ctaLabel: "Free Consult",
  ctaHref: "/contact",
  video: {
    src: "/video/hero.mp4",
    poster: "/images/home/video-poster.webp",
  },
};

export const BRAND_MARQUEE = [
  "/images/brands/brand1.svg",
  "/images/brands/brand2.svg",
  "/images/brands/brand3.svg",
  "/images/brands/brand4.svg",
  "/images/brands/brand5.svg",
];

export const AI_DRIVEN_SECTION = {
  image: "/images/home/ai-esg.jpg",
  title: "AI-Driven ESG Ratings for Smarter Sustainable Decisions",
  paragraphs: [
    "Our AI-powered platform streamlines ESG assessments by providing precise, transparent ratings that empower informed decision-making. Through the integration of advanced analytics, we assist businesses in enhancing their ESG performance, ensuring they meet evolving regulatory requirements and stakeholder expectations. By leveraging artificial intelligence, our platform simplifies the complex process of ESG evaluation, delivering valuable insights that enable companies to improve their sustainability practices and strengthen their overall ESG ratings for better business outcomes.",
    "Empowering businesses to achieve sustainability excellence through AI-driven insights and enhanced ESG performance strategies.",
  ],
};

export type IconBoxKey =
  | "settings"
  | "bank"
  | "database"
  | "handshake"
  | "save-money"
  | "management";

export const AUTOMATED_RATING = {
  heading: "AI AUTOMATED ESG RATING",
  bg: "/images/shared/bg-img2.jpg",
  boxes: [
    {
      icon: "settings" as IconBoxKey,
      title: "Comprehensive Data Collection",
      description:
        "We gather data from disclosures, sources, and reports, aligning with SEBI's BRSR framework.",
    },
    {
      icon: "bank" as IconBoxKey,
      title: "Standardized Reporting",
      description:
        "We ensure companies meet SEBI's BRSR guidelines for transparent ESG disclosures.",
    },
    {
      icon: "database" as IconBoxKey,
      title: "ESG Risk Assessment",
      description:
        "We identify risks from weak ESG practices, highlighting concerns in sustainability, social and governance.",
    },
    {
      icon: "handshake" as IconBoxKey,
      title: "Benchmarking Against",
      description:
        "We provide benchmark performance against peers offering insights and highlighting improvement areas.",
    },
    {
      icon: "save-money" as IconBoxKey,
      title: "Data-Driven Insights",
      description:
        "Using AI and analytics, we offer insights to improve ESG practices and align with sustainability goals.",
    },
    {
      icon: "management" as IconBoxKey,
      title: "Investor and Stakeholder Communication",
      description:
        "We help companies communicate ESG performance which helps in boosting transparency.",
    },
  ],
};

export const RECENT_ARTICLES_HEADING = "Recent Article and News";
