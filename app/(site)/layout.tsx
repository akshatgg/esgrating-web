import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-20 md:pt-[88px] lg:pt-24">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
