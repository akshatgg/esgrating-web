import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  CONTACT,
  COPYRIGHT,
  FOOTER_BLURB,
  QUICK_LINKS,
} from "@/content/site";

export default function Footer() {
  return (
    <footer className="bg-footer text-white">
      <div className="container-site py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Image
              src="/brand/logo.jpg"
              alt="ESG Ratings"
              width={115}
              height={66}
              className="h-auto w-[115px] rounded bg-white p-1"
            />
            <p className="mt-4 text-sm text-white/80">{FOOTER_BLURB}</p>
          </div>

          <div>
            <h2 className="mb-4 font-display text-lg font-semibold">
              Quick Links
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-display text-lg font-semibold">
              Contact Us
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={CONTACT.phoneHref} className="hover:text-white">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-display text-lg font-semibold">
              Address
            </h2>
            <p className="flex items-start gap-2 text-sm text-white/80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{CONTACT.address}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site py-4 text-center text-sm text-white/70">
          {COPYRIGHT}
        </div>
      </div>
    </footer>
  );
}
