export type NavItem = {
  label: string;
  href: string;
};

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "ESG Rating", href: "/esg-rating" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact Us", href: "/contact" },
];

export const QUICK_LINKS: NavItem[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Blogs", href: "/blogs" },
  { label: "Job Openings", href: "/careers/automation-developer" },
  { label: "Policies", href: "/policy" },
  { label: "FAQ", href: "/faq" },
];

export const CONTACT = {
  phone: "+91 8587898484",
  phoneHref: "tel:+918587898484",
  email: "info@esgratings.co.in",
  address:
    "A-204, 2nd Floor, Vikas Tower, PVR Complex, Vikaspuri, New Delhi-110018, India",
  whatsapp: "https://wa.link/4g9nfk",
};

export const FOOTER_BLURB =
  "Discover comprehensive ESG ratings and insights to evaluate sustainability performance, guiding responsible Investment decisions and promoting corporate accountability.";

export const COPYRIGHT = "Copyright @2024 Esgratings.co.in";

export const WHATSAPP_FLOAT_URL =
  "https://wa.me/918587898484?text=Hello%20can%20I%20get%20more%20information%20about%20this.";
