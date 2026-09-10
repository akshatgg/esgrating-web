import Image from "next/image";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pt-[76px] lg:pt-[101px]">
        <div className="container-site flex flex-col items-center gap-8 py-16 text-center md:py-24">
          <div className="relative w-full max-w-md">
            <Image
              src="/images/404/Image-6-1.png"
              alt=""
              width={1598}
              height={1650}
              priority
              className="mx-auto h-auto w-full max-w-xs md:max-w-sm"
            />
            <Image
              src="/images/404/Group-1000004562.svg"
              alt=""
              width={48}
              height={48}
              aria-hidden="true"
              className="reveal absolute top-2 left-2 h-10 w-10 md:h-12 md:w-12"
            />
            <Image
              src="/images/404/Group-1000004564.svg"
              alt=""
              width={40}
              height={40}
              aria-hidden="true"
              className="reveal absolute top-6 right-0 h-8 w-8 md:h-10 md:w-10"
            />
            <Image
              src="/images/404/Group-1000004565.svg"
              alt=""
              width={40}
              height={40}
              aria-hidden="true"
              className="reveal absolute bottom-4 left-0 h-8 w-8 md:h-10 md:w-10"
            />
            <Image
              src="/images/404/Group-1000004566.svg"
              alt=""
              width={44}
              height={44}
              aria-hidden="true"
              className="reveal absolute right-2 bottom-2 h-9 w-9 md:h-11 md:w-11"
            />
          </div>

          <h1 className="font-display text-3xl font-semibold text-navy md:text-4xl">
            Page not found
          </h1>
          <p className="max-w-md text-body">
            The requested URL you are looking for doesn&rsquo;t exist on this
            server.
          </p>
          <Button href="/" variant="primary">
            Back To Homepage
          </Button>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
