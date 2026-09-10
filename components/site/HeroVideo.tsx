"use client";

import { useEffect, useState } from "react";

type HeroVideoProps = {
  src: string;
  poster: string;
};

const WIDE_QUERY = "(min-width: 768px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Autoplaying hero video. The server and the first client render are the
 * poster alone (no source, no autoplay), so small screens and reduced-motion
 * visitors never download the MP4. The source is attached client-side only
 * once the viewport is `md` or wider and motion is allowed. */
export default function HeroVideo({ src, poster }: HeroVideoProps) {
  const [playable, setPlayable] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(WIDE_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setPlayable(wide.matches && !reduced.matches);
    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return (
    <video
      className="h-full w-full rounded-2xl object-cover shadow-[0_20px_50px_rgba(10,16,47,0.35)]"
      poster={poster}
      src={playable ? src : undefined}
      preload={playable ? "metadata" : "none"}
      autoPlay={playable}
      muted
      loop
      playsInline
    />
  );
}
