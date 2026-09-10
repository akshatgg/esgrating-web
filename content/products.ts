/** Products page copy, verbatim from ../docs/analysis/content.md §2.3. */

export const BANNER = {
  src: "/images/banners/products.webp",
  title: "Products",
};

export const INTRO =
  "Our ESG rating products suitably incorporate the ESG aspects that are contextual to the Indian market.The rating products will be assigned such that they must contain sector-agnostic ESG ratings and allow comparison with companies in other sectors.";

export const PRODUCT_CARDS = [
  { icon: "save-money" as const, title: "ESG RATING", href: "#dda" },
  { icon: "settings" as const, title: "CORE ESG RATING", href: "#ccb" },
];

export const ESG_RATING_SECTION = {
  id: "dda",
  heading: "ESG Rating",
  bg: "/images/shared/bg-img2.jpg",
  boxes: [
    {
      icon: "graph-2" as const,
      title: "ESG Ratings",
      description:
        "We assign ratings to companies based on their performance in various ESG categories. These ratings provide a quick overview of a company's sustainability practices, allowing investors and stakeholders to compare different companies' ESG performance.",
    },
    {
      icon: "graph" as const,
      title: "ESG Transition or Parivartan score",
      description:
        "The Transition or Parivartan score would reflect the incremental changes that the company has made in its transition story over recent years or concrete plans/targets to address the risk and opportunities involved compare different companies.",
    },
    {
      icon: "graphic-2" as const,
      title: "Combined Score",
      description:
        "Incorporating ESG rating and transition rating, i.e., measuring both the status and the ability to transition shall also be provided. A combined score shall be determined in the following manner:",
      formula: "ESG Score + Transition or Parivartan Score = Combined Score",
    },
  ],
};

export const PRODUCT_MARQUEE = [
  "/images/products/indian-bank.svg",
  "/images/products/race.svg",
];

export const CORE_ESG_RATING_SECTION = {
  id: "ccb",
  heading: "Core ESG Rating",
  bg: "/images/shared/bg-img2.jpg",
  boxes: [
    {
      icon: "money" as const,
      title: "CORE ESG Ratings",
      description:
        "We assign Core ESG ratings to companies based on their performance across environmental, social, and governance factors. These ratings provide a snapshot of a company's current sustainability practices, helping investors and stakeholders assess its overall ESG performance and commitment.",
    },
    {
      icon: "graph" as const,
      title: "Core Transition or Parivartan score",
      description:
        "We assign Core Transition or Parivartan scores to companies based on their ability to adapt and transition towards sustainable practices. These scores offer insights into a company's readiness for future sustainability, enabling investors and stakeholders to evaluate its potential for environmental success.",
    },
    {
      icon: "graphic-2" as const,
      title: "Core Combined score",
      description:
        "The Core Combined score evaluates both a company's current ESG performance and its capacity to transition towards greater sustainability. This score combines the Core ESG Score with the Core Transition or Parivartan Score, offering a comprehensive view of a company’s sustainability efforts.",
    },
  ],
};

export const CLOSING_NOTE =
  "The Core ESG Rating, Core Transition or Parivartan Score, and Core Combined Score will be provided based on the availability of the 'Business Responsibility and Sustainability Report (BRSR) Core' for the rated entity.";
