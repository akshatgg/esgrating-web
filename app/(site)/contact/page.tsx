import type { Metadata } from "next";
import { Phone, MessageCircle, Mail } from "lucide-react";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import Card from "@/components/ui/Card";
import ContactForm from "./ContactForm";
import { CONTACT } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact Us",
  alternates: { canonical: "/contact" },
};

const CARDS = [
  {
    icon: Phone,
    title: "Give us a call",
    description: CONTACT.phone,
    href: CONTACT.phoneHref,
  },
  {
    icon: MessageCircle,
    title: "Chat with us",
    description: undefined,
    href: CONTACT.whatsapp,
  },
  {
    icon: Mail,
    title: "Email us",
    description: "Info@esgratings.co.in",
    href: `mailto:${CONTACT.email}`,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageBanner src="/images/banners/contact.webp" alt="" title="Contact Us" />

      <Section>
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CARDS.map((card) => (
            <a key={card.title} href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
              <Card lift className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <card.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="font-display text-lg font-semibold text-navy">{card.title}</h2>
                {card.description ? <p className="text-sm text-body">{card.description}</p> : null}
              </Card>
            </a>
          ))}
        </div>

        <ContactForm />
      </Section>
    </>
  );
}
