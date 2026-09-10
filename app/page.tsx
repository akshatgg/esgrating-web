export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-bg-soft px-6 text-center">
      <span className="reveal rounded-full bg-navy px-4 py-1.5 text-sm font-medium text-white">
        SEBI Registered
      </span>
      <h1 className="reveal max-w-2xl font-display text-4xl font-semibold text-navy md:text-5xl">
        ESG Ratings
      </h1>
      <p className="reveal max-w-xl text-body">
        Discover comprehensive ESG ratings and insights to evaluate
        sustainability performance, guiding responsible investment decisions
        and promoting corporate accountability.
      </p>
      <a
        href="/esg-rating"
        className="cta-sweep rounded-full bg-brand px-6 py-3 font-medium text-white"
      >
        Explore ESG Ratings
      </a>
    </main>
  );
}
