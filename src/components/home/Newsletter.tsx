"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewsletterProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  className?: string;
}

export function Newsletter({
  title = "Suscríbete a Nuestro Newsletter",
  subtitle = "Recibe ofertas exclusivas, novedades y descuentos directamente en tu correo",
  buttonText = "Suscribirse",
  className,
}: NewsletterProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    // Simular llamada a API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setStatus("success");
    setEmail("");

    // Reset después de 3 segundos
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <section className={cn("py-16 bg-accent/10", className)}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <Mail className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
            disabled={status === "loading" || status === "success"}
          />
          <Button
            type="submit"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading"
              ? "Enviando..."
              : status === "success"
                ? "¡Suscrito!"
                : buttonText}
          </Button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-sm text-success">
            ¡Gracias por suscribirte! Revisa tu correo para confirmar.
          </p>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Al suscribirte, aceptas recibir correos de marketing. Puedes darte de
          baja en cualquier momento.
        </p>
      </div>
    </section>
  );
}
