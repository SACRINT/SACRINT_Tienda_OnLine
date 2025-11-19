"use client";

import * as React from "react";
import { Mail, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewsletterFormProps {
  variant?: "inline" | "card" | "footer";
  title?: string;
  description?: string;
  className?: string;
  onSubscribe?: (email: string) => Promise<void>;
}

export function NewsletterForm({
  variant = "inline",
  title = "Suscríbete a nuestro newsletter",
  description = "Recibe ofertas exclusivas y novedades directo en tu correo",
  className,
  onSubscribe,
}: NewsletterFormProps) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (onSubscribe) {
        await onSubscribe(email);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setSuccess(true);
      setEmail("");
    } catch {
      setError("Error al suscribirse. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={cn(
          "text-center p-4",
          variant === "card" && "bg-success/10 rounded-lg",
          className,
        )}
      >
        <Check className="h-8 w-8 text-success mx-auto mb-2" />
        <p className="font-medium">¡Gracias por suscribirte!</p>
        <p className="text-sm text-muted-foreground">
          Pronto recibirás nuestras ofertas exclusivas
        </p>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </form>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("bg-primary/5 rounded-lg p-6", className)}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Suscribirme
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
        </form>
      </div>
    );
  }

  // Footer variant
  return (
    <div className={className}>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" variant="secondary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
        </Button>
      </form>
      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
}
