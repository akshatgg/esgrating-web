"use client";

import { useEffect, useState } from "react";

type HeroVideoProps = {
  src: string;
  poster: string;
};

/** Autoplaying hero video. `preload` is set to "none" on small viewports
 * (matching a `md` breakpoint) since Next has no prop for conditional
 * preload, and to "metadata" otherwise. */
export default function HeroVideo({ src, poster }: HeroVideoProps) {
  const [preload, setPreload] = useState<"none" | "metadata">("none");

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setPreload(mql.matches ? "metadata" : "none");
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <video
      className="h-full w-full rounded-2xl object-cover shadow-[0_20px_50px_rgba(10,16,47,0.35)]"
      poster={poster}
      preload={preload}
      muted
      autoPlay
      loop
      playsInline
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
