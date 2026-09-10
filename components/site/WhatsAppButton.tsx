import { MessageCircle } from "lucide-react";
import { WHATSAPP_FLOAT_URL } from "@/content/site";

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_FLOAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp us"
      className="fixed right-[10px] bottom-[10px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105 md:right-[15px] md:bottom-[15px]"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" strokeWidth={2} />
    </a>
  );
}
