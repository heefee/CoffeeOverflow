import Link from "next/link";
import { Fingerprint } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-20 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex flex-col font-heading text-[32px] font-semibold leading-none tracking-tight text-primary"
        >
          <span>eAvizat</span>
          <span className="mt-1.5 font-mono text-[18px] font-normal tracking-normal text-muted-foreground">
            (sau nu?)
          </span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <Link
            href="/harta"
            className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Hartă Cluj
          </Link>
          <Link
            href="/roadmap-caen"
            className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Roadmap CAEN
          </Link>
          <Link
            href="/login"
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Fingerprint className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Autentificare ROeID</span>
            <span className="sm:hidden">ROeID</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
