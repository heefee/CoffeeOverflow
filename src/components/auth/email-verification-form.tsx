"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailVerificationFormProps {
  returnTo?: string;
}

export function EmailVerificationForm({ returnTo = "/harta" }: EmailVerificationFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Nu am putut trimite codul.");

      setCodeSent(true);
      setMessage("Ți-am trimis un cod de verificare pe email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut trimite codul.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, returnTo }),
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) throw new Error(data.error ?? "Codul nu a putut fi verificat.");

      window.location.assign(data.redirectTo ?? returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codul nu a putut fi verificat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border p-8 shadow-sm">
      <CardContent className="space-y-6 p-0">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Verificare email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Introdu adresa de email. Îți trimitem un cod de verificare înainte de
            autentificarea ROeID.
          </p>
        </div>

        {message ? (
          <div className="flex gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!codeSent ? (
          <form className="space-y-4" onSubmit={sendCode}>
            <div className="space-y-2">
              <Label htmlFor="email">Adresa de email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-10 pl-9"
                  placeholder="nume@exemplu.ro"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="h-10 w-full cursor-pointer" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Trimite codul
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyCode}>
            <div className="space-y-2">
              <Label htmlFor="code">Cod de verificare</Label>
              <Input
                id="code"
                inputMode="numeric"
                required
                maxLength={6}
                className="h-10 text-center font-mono text-lg tracking-[0.4em]"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" className="h-10 w-full cursor-pointer" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Verifică și continuă
            </Button>
            <button
              type="button"
              className="w-full cursor-pointer text-sm text-muted-foreground hover:text-accent"
              onClick={() => {
                setCodeSent(false);
                setCode("");
              }}
            >
              Schimbă adresa de email
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
