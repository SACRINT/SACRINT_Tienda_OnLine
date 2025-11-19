import { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Tienda Online 2025",
  description: "Inicia sesión en tu cuenta de Tienda Online 2025",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Iniciar Sesión"
      description="Ingresa a tu cuenta para gestionar tu tienda"
    >
      <LoginForm />
    </AuthCard>
  );
}
