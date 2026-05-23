import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  FileSearch,
  Map,
  Route,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Hartă ANCPI Cluj",
    description:
      "Parcele cadastrale reale din geoportalul ANCPI — selectați un imobil direct pe hartă.",
  },
  {
    icon: FileSearch,
    title: "Date centralizate",
    description:
      "Carte funciară, certificat de urbanism și autorizații existente într-un singur panou.",
  },
  {
    icon: Route,
    title: "Roadmap CAEN",
    description:
      "Alegeți activitatea (ex. cafenea, restaurant) și primiți pașii pentru autorizații.",
  },
  {
    icon: ShieldCheck,
    title: "Pregătit pentru viitor",
    description:
      "Notificări expirări, ROeID și integrări epay.ancpi — pe foaia de parcurs.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Cluj-Napoca for now, but national platform in the future.
          </p>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Înțelege imobilul înainte de investiție
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            eAvizat (sau nu?) centralizează informații de cadastru, urbanism și autorizații
            pentru antreprenorii care vor să cumpere sau să deschidă o afacere pe un
            imobil din Cluj.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/harta"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Deschide harta Cluj
            </Link>
            <Link
              href="/harta"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border-2 border-primary px-6 text-sm font-medium text-primary transition-colors hover:bg-secondary"
            >
              Explorează parcele
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            <Link href="/login" className="text-accent hover:underline">
              Autentificare ROeID
            </Link>
            {" · "}
            Date juridice demo în MVP
          </p>
        </section>

        <section className="border-t border-border bg-card/60 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card
                key={f.title}
                className="cursor-default border-border transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <f.icon className="size-5 text-primary" aria-hidden />
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Building2 className="mx-auto size-10 text-primary/50" aria-hidden />
          <h2 className="mt-4 font-heading text-2xl text-foreground">
            De la parcelă la autorizație de funcționare
          </h2>
          <p className="mt-2 text-muted-foreground">
            Click pe parcelă → detalii imobil → selectați codul CAEN → roadmap cu
            DSP, ISU, Primărie și documentele necesare.
          </p>
        </section>
      </main>
      <footer className="mt-auto border-t border-border py-6 text-center text-xs text-muted-foreground">
        eAvizat (sau nu?) · Geometrie ANCPI · Date juridice demonstrative în MVP
      </footer>
    </div>
  );
}
