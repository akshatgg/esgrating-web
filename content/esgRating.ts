/** ESG Rating page copy, from ../docs/analysis/content.md §2.2 plus the spec. */

export const HERO_BG = "/images/esg-rating/bg.webp";

export const BADGE = {
  icon: "/images/esg-rating/certificate.svg",
  title: "SEBI Licensed",
  description: "ESG Rating Provider",
};

export const HEADING = "Keep a check on your ESG position";

export const CHECK_CARDS = [
  "Attract Investors: A strong ESG position boosts investor confidence and enhances stock market appeal.",
  "Compliance & Validation: Demonstrate sustainability efforts and meet regulatory requirements effectively.",
  "Proactive Risk Management: Understand your ESG position to identify risks early and implement timely mitigation strategies, leading to significant cost savings.",
];

export const CALCULATOR_CTAS = [
  { label: "BFSI Sector Calculator", href: "/bfsi-calculator", variant: "calcNavy" as const },
  {
    label: "All Other Sector Calculator",
    href: "/esg-rating-calculator",
    variant: "calcBlue" as const,
  },
];

export const GRADE_SCALE = {
  esgRating: [">90", "80-90", "71-79", "61-70", "40-60", "<40"],
  grade: ["A+", "A", "B+", "B", "C", "D"],
  category: ["Outstanding", "Excellent", "Very Good", "Good", "Average", "Poor"],
};

export const METHODOLOGY_PDF = {
  label: "ESG Ratings Methodology",
  href: "/docs/ESG-Ratings-Methodology.pdf",
};

export const RATING_LIST_HEADING = "ESG Rating List";
