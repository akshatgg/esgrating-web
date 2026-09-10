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
      <main className="pt-[76px] lg:pt-[101px]">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
