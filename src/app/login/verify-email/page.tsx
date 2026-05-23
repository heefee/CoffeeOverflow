import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";

export const metadata: Metadata = {
  title: "Verificare email — eAvizat (sau nu?)",
  description: "Primește un cod de verificare pe email înainte de autentificarea ROeID.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          <EmailVerificationForm returnTo={returnTo} />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-accent hover:underline">
              Înapoi la autentificare
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
