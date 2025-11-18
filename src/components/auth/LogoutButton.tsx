"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full border-gray-600 text-white hover:bg-gray-800"
      onClick={handleLogout}
    >
      Cerrar Sesión
    </Button>
  );
}
