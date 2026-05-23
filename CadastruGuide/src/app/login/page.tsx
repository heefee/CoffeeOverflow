import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Fingerprint,
  Map,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Autentificare ROeID — CadastruGuide",
  description:
    "Conectează-te cu ROeID pentru acces complet la datele imobilului: proprietari, sarcini detaliate și istoric autorizații.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          <Card className="border-border p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Fingerprint className="size-7 text-primary" aria-hidden />
            </div>

            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Autentificare ROeID
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Accesul complet la datele imobilului — inclusiv proprietari, sarcini
              detaliate și istoric autorizații — este disponibil doar pentru utilizatori
              verificați prin ROeID.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                disabled
                className="h-10 w-full cursor-not-allowed justify-between gap-2 opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Fingerprint className="size-4" aria-hidden />
                  Conectează-te cu ROeID
                </span>
                <Badge className="border-warning/30 bg-warning/15 font-mono text-[9px] uppercase tracking-wider text-warning">
                  Curând
                </Badge>
              </Button>

              <a
                href="https://www.roeid.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                Află mai multe despre ROeID
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-card px-3 text-muted-foreground">sau</span>
              </div>
            </div>

            <Link
              href="/harta"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 w-full cursor-pointer gap-2",
              )}
            >
              <Map className="size-4" aria-hidden />
              Continuă ca vizitator
            </Link>
          </Card>

          <Card className="border-border bg-secondary/40 shadow-none">
            <CardContent className="flex gap-3 pt-4">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-success"
                aria-hidden
              />
              <p className="text-left text-sm leading-relaxed text-muted-foreground">
                Ca vizitator poți explora harta, datele cadastrale și informațiile de
                urbanism. Datele despre proprietari și sarcini detaliate rămân mascate
                până la autentificarea ROeID.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
