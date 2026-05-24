interface ClujHeroSectionProps {
  children: React.ReactNode;
}

export function ClujHeroSection({ children }: ClujHeroSectionProps) {
  return (
    <section className="relative isolate min-h-[min(72vh,680px)] overflow-hidden border-b border-border bg-[#0b1526]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cluj-map-hero.png"
          width={1024}
          height={428}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background/15 dark:bg-background/22"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background/45"
      />
      <div className="relative z-10 mx-auto flex min-h-[min(72vh,680px)] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center md:py-28">
        {children}
      </div>
    </section>
  );
}
