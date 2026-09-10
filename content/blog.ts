export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type Post = {
  slug: string;
  title: string;
  date: string; // ISO date
  author: string;
  /** Whether the author should be rendered with a "By " prefix. Defaults to true. */
  authorPrefix?: boolean;
  image: string;
  keywords: string;
  body: Block[];
};

/**
 * The four WordPress blog posts, word for word from
 * ../docs/analysis/content.md §2.12. Bylines are split out into `author`;
 * everything else is preserved verbatim, only grouped into h2/p/ul blocks.
 */
export const POSTS: Post[] = [
  {
    slug: "esg-ratings-future-proof-your-business-today",
    title: "ESG Ratings : Future-Proof Your Business Today!",
    date: "2025-05-04",
    author:
      "Shavi Chawla, Chief Ratings Officer -CFC, SEBI Licensed ESG Ratings Provider | www.esgratings.co.in",
    image: "/images/blog/esg.webp",
    keywords: "ESG Ratings,ESG,BRSR",
    body: [
      {
        type: "p",
        text: "In today’s dynamic business environment, sustainability isn’t just a choice—it’s a necessity. Companies across sectors are now being evaluated not only on financial performance but also on their Environmental, Social, and Governance (ESG) impact. Implementing strong ESG practices helps businesses manage risks, attract responsible investors, and stay compliant with evolving regulations.",
      },
      { type: "h2", text: "What is ESG Rating?" },
      {
        type: "p",
        text: "An ESG Rating measures a company’s performance on environmental impact, social responsibility, and governance standards. It provides stakeholders—including investors, customers, regulators, and partners—with insights into the sustainability and ethical conduct of a business.",
      },
      { type: "p", text: "High ESG Ratings can:" },
      {
        type: "ul",
        items: [
          "Attract long-term investors",
          "Lower cost of capital",
          "Improve brand reputation",
          "Ensure regulatory compliance",
          "Enhance operational resilience",
        ],
      },
      { type: "h2", text: "Why ESG Matters More Than Ever" },
      {
        type: "p",
        text: "With increasing climate risks, regulatory mandates like SEBI’s BRSR (Business Responsibility and Sustainability Reporting) in India, and rising stakeholder expectations, ESG adoption is no longer optional. Businesses that fail to adapt risk being left behind—both competitively and financially.",
      },
      { type: "h2", text: "How ESG Ratings Can Future-Proof Your Business" },
      {
        type: "ul",
        items: [
          "Risk Management: Identify and mitigate ESG-related risks across your value chain.",
          "Capital Access: Investors now prefer companies with strong ESG scores and disclosures.",
          "Regulatory Readiness: ESG-aligned firms are better prepared for compliance with local and global sustainability regulations.",
          "Market Positioning: Demonstrating ESG commitment builds trust with consumers and partners.",
        ],
      },
      { type: "h2", text: "Why Choose ESGRatings.co.in?" },
      {
        type: "p",
        text: "At ESGRatings.co.in, we specialize in ESG Ratings in India, offering:",
      },
      {
        type: "ul",
        items: [
          "Sector-specific ESG assessments",
          "AI-powered ESG risk identification",
          "BRSR compliance solutions",
          "Real-time ESG scorecards and benchmarking tools",
        ],
      },
      {
        type: "p",
        text: "Whether you're a listed company, SME, or startup, we help you strengthen ESG performance and unlock sustainable growth.",
      },
      { type: "h2", text: "Start Your ESG Journey Today" },
      {
        type: "p",
        text: "Future-proof your business with trusted, data-driven ESG Ratings.",
      },
      {
        type: "p",
        text: "Visit www.esgratings.co.in or call us at 8587898484 to learn how we can support your ESG goals.",
      },
    ],
  },
  {
    slug: "esg-rating-sebi-licensed-brsr",
    title: "SEBI Grants ESG Rating Provider License to CFC",
    date: "2025-05-05",
    author: "RPB, Compliance Officer , CFC - SEBI Licensed ESG Rating Provider",
    image: "/images/blog/sebi.webp",
    keywords:
      "SEBI ESG Rating Provider License,ESG Ratings in India,CFC ESG Rating,SEBI ERP License,ESG score India",
    body: [
      {
        type: "p",
        text: "In a landmark development for India’s sustainability landscape, the Securities and Exchange Board of India (SEBI) has officially granted an ESG Rating Provider (ERP) license to CFC (CFC Finlease Private Limited). This recognition positions CFC among the select group of SEBI-regulated entities authorized to assess and rate companies based on their Environmental, Social, and Governance (ESG) performance.",
      },
      { type: "h2", text: "A Leap Forward for ESG in India" },
      {
        type: "p",
        text: "As ESG regulations gain momentum across the globe, India is stepping up efforts to bring transparency, credibility, and standardization to the sustainability reporting ecosystem. SEBI’s move to license ESG Rating Providers is a game-changer, ensuring that ESG ratings in India are backed by robust methodologies and regulatory oversight.",
      },
      { type: "h2", text: "Why CFC’s SEBI License Matters" },
      {
        type: "p",
        text: "With this license, CFC becomes a trusted authority to provide ESG ratings for companies across sectors, aiding:",
      },
      {
        type: "ul",
        items: [
          "Investors in making informed, responsible investment decisions",
          "Corporates in improving sustainability disclosures and performance",
          "Regulators in promoting accountability and transparency",
        ],
      },
      {
        type: "p",
        text: "The license validates CFC’s commitment to high-quality ESG analysis, data integrity, and sector-specific ESG risk mapping aligned with global standards.",
      },
      { type: "h2", text: "What This Means for Businesses" },
      {
        type: "p",
        text: "Companies in India can now rely on CFC’s SEBI-approved ESG ratings to:",
      },
      {
        type: "ul",
        items: [
          "Benchmark their ESG performance",
          "Prepare for BRSR and global disclosures",
          "Access ESG-linked financing and green investment",
          "Strengthen brand reputation and stakeholder trust",
        ],
      },
      { type: "h2", text: "ESG Ratings : Powered by CFC’s Expertise" },
      {
        type: "p",
        text: "As the digital platform powered by CFC’s rating methodology, www.esgratings.co.in offers:",
      },
      {
        type: "ul",
        items: [
          "AI-enabled ESG risk intelligence",
          "Sector-specific ESG scorecards",
          "ESG benchmarking and reporting tools",
          "Personalized ESG rating services for businesses",
        ],
      },
      {
        type: "p",
        text: "Whether you're preparing for your first BRSR or aiming to lead in sustainable finance, we offer the tools and guidance to help you succeed.",
      },
      { type: "h2", text: "Ready to Get Rated?" },
      {
        type: "p",
        text: "Get your company’s ESG Rating from a SEBI-licensed provider.",
      },
      {
        type: "p",
        text: "Visit www.esgratings.co.in or contact us at 8587898484 to learn more.",
      },
    ],
  },
  {
    slug: "esg-ratings-future-proof-your-business-today-2",
    title: "ESG Ratings : Future-Proof Your Business Today!",
    date: "2025-05-05",
    author:
      "Divya, ESG Expert -CFC, SEBI Licensed ESG Ratings Provider | www.esgratings.co.in",
    authorPrefix: false,
    image: "/images/blog/bb.webp",
    keywords: "bbbb",
    body: [
      {
        type: "p",
        text: "Today’s dynamic business environment, sustainability isn’t just a choice—it’s a necessity. Companies across sectors are now being evaluated not only on financial performance but also on their Environmental, Social, and Governance (ESG) impact. Implementing strong ESG practices helps businesses manage risks, attract responsible investors, and stay compliant with evolving regulations.",
      },
      { type: "h2", text: "What is ESG Rating?" },
      {
        type: "p",
        text: "An ESG Rating measures a company’s performance on environmental impact, social responsibility, and governance standards. It provides stakeholders—including investors, customers, regulators, and partners—with insights into the sustainability and ethical conduct of a business.",
      },
      { type: "p", text: "High ESG Ratings can:" },
      {
        type: "ul",
        items: [
          "Attract long-term investors",
          "Lower cost of capital",
          "Improve brand reputation",
          "Ensure regulatory compliance",
          "Enhance operational resilience",
        ],
      },
      { type: "h2", text: "Why ESG Matters More Than Ever" },
      {
        type: "p",
        text: "With increasing climate risks, regulatory mandates like SEBI’s BRSR (Business Responsibility and Sustainability Reporting) in India, and rising stakeholder expectations, ESG adoption is no longer optional. Businesses that fail to adapt risk being left behind—both competitively and financially.",
      },
      { type: "h2", text: "How ESG Ratings Can Future-Proof Your Business" },
      {
        type: "ul",
        items: [
          "Risk Management: Identify and mitigate ESG-related risks across your value chain.",
          "Capital Access: Investors now prefer companies with strong ESG scores and disclosures.",
          "Regulatory Readiness: ESG-aligned firms are better prepared for compliance with local and global sustainability regulations.",
          "Market Positioning: Demonstrating ESG commitment builds trust with consumers and partners.",
        ],
      },
      { type: "h2", text: "Why Choose ESGRatings.co.in?" },
      {
        type: "p",
        text: "At ESGRatings.co.in, we specialize in ESG Ratings in India, offering:",
      },
      {
        type: "ul",
        items: [
          "Sector-specific ESG assessments",
          "AI-powered ESG risk identification",
          "BRSR compliance solutions",
          "Real-time ESG scorecards and benchmarking tools",
        ],
      },
      {
        type: "p",
        text: "Whether you're a listed company, SME, or startup, we help you strengthen ESG performance and unlock sustainable growth.",
      },
      { type: "h2", text: "Start Your ESG Journey Today" },
      {
        type: "p",
        text: "Future-proof your business with trusted, data-driven ESG Ratings.",
      },
      {
        type: "p",
        text: "Visit www.esgratings.co.in or call us at 8587898484 to learn how we can support your ESG Goals.",
      },
    ],
  },
  {
    slug: "how-social-initiatives-drive-employee-retention-and-customer-loyalty",
    title: "How Social Initiatives Drive Employee Retention and Customer Loyalty",
    date: "2024-12-06",
    author: "",
    image: "/images/blog/social.webp",
    keywords: "",
    body: [
      {
        type: "p",
        text: "Social initiatives are no longer optional for businesses—they’re essential for fostering strong employee and customer relationships. Here’s how they make a difference:",
      },
      {
        type: "ul",
        items: [
          "✨ Stronger Company Culture: Employees feel proud to work for organizations committed to meaningful causes. This alignment with company values boosts morale, engagement, and retention.",
          "🌱 Attracting Top Talent: Millennials and Gen Z actively seek employers who prioritize social impact. Companies known for volunteer programs or charitable donations become magnets for high-performing candidates.",
          "💡 Enhancing Customer Loyalty: Customers are drawn to brands that support causes they care about. By aligning with a purpose, businesses retain loyal customers who resonate with their mission.",
          "🔒 Fostering Trust and Transparency: Genuine, measurable social efforts build trust. Employees and customers are more likely to remain loyal to brands that deliver on their promises.",
          "💼 Boosting Employee Engagement: Purpose-driven employees are more productive, engaged, and likely to act as brand ambassadors. This enhances both internal culture and external reputation.",
          "📈 Driving Long-Term Growth: Companies like Patagonia and TOMS have proven that integrating social initiatives leads to stronger customer relationships, increased retention, and sustained growth.",
        ],
      },
    ],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first. */
export function postsByDateDesc(): Post[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
