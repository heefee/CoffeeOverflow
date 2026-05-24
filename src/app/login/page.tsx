import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Fingerprint,
  Map,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Autentificare ROeID — eAvizat (sau nu?)",
  description:
    "Conectează-te cu ROeID pentru acces complet la datele imobilului: proprietari, sarcini detaliate și istoric autorizații.",
};

const authErrors: Record<string, string> = {
  config:
    "Configurarea ROeID lipsește sau este incompletă. Pentru dezvoltare setează MOCK_ROEID=true.",
  callback: "ROeID nu a returnat un cod de autentificare valid.",
  state: "Sesiunea de autentificare a expirat sau nu mai este validă. Încearcă din nou.",
  roeid: "Nu am putut finaliza autentificarea ROeID. Încearcă din nou.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? authErrors[error] : null;

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
            Conectează-te cu ROeID pentru a te abona la notificările de autorizații care urmează să expire în viitorul apropiat și pentru a fi la curent cu starea autorizațiilor în curs de aprobare.
            </p>

            {errorMessage ? (
              <div className="mt-5 rounded-lg bg-destructive/10 px-4 py-3 text-left text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-6">
              <Link
                href="/api/auth/roeid/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-10 w-full cursor-pointer justify-center gap-2",
                )}
              >
                <Fingerprint className="size-4" aria-hidden />
                Conectare cu ROeID
              </Link>

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
            <CardContent className="space-y-2 pt-4 text-left text-sm leading-relaxed text-muted-foreground">
              <p>
                Vă recomandăm să folosiți aplicația{" "}
                <a
                  href="https://www.roeid.ro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  ROeID
                </a>{" "}
                pentru conectarea la eAvizat (sau nu?).
              </p>
              <p>
                ROeID este o aplicație pe telefonul mobil pusă la dispoziție de către{" "}
                <a
                  href="https://adr.gov.ro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  Autoritatea pentru Digitalizarea României
                </a>
                , notificată la{" "}
                <a
                  href="https://ec.europa.eu/digital-building-blocks/sites/display/EIDCOMMUNITY/Romania+-+ROeID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  Comisia Europeană
                </a>{" "}
                ca modalitate oficială de identificare electronică în România.
              </p>
            </CardContent>
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
