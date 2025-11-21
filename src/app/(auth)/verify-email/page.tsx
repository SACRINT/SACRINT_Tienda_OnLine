"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link. Missing token or email.");
      return;
    }

    verifyEmail();
  }, [token, email]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email || "")}`,
        { method: "GET" },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during verification");
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Verification email sent!");
      } else {
        setMessage(data.error || "Failed to resend email");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Verificando email...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras verificamos tu dirección de correo.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              ¡Email verificado!
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirigiendo a la página de inicio de sesión...
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full text-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión ahora
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Verificación fallida
          </h2>
          <p className="mt-2 text-gray-600">{message}</p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Si tu enlace expiró o es inválido, puedes solicitar uno nuevo.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Reenviar email de verificación"
            )}
          </Button>

          <Link
            href="/login"
            className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
