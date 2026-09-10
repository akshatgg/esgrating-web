import Image from "next/image";

type PageBannerProps = {
  src: string;
  alt: string;
  title: string;
};

/**
 * Page-header banner image. The visible caption is baked into the image
 * itself; `title` is exposed only to assistive tech as a visually hidden h1.
 */
export default function PageBanner({ src, alt, title }: PageBannerProps) {
  return (
    <div className="relative h-[150px] w-full overflow-hidden md:h-[300px]">
      <h1 className="sr-only">{title}</h1>
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />
    </div>
  );
}
