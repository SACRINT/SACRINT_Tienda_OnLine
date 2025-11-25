"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  isFavorite: boolean; // Prop to indicate initial state
}

export function WishlistButton({ productId, isFavorite: initialIsFavorite }: WishlistButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const router = useRouter();

  const handleToggleFavorite = () => {
    // Placeholder for actual login check
    const isLoggedIn = true; // Assume user is logged in for now

    if (!isLoggedIn) {
      router.push("/login"); // Redirect to login if not logged in
      return;
    }

    setIsFavorite(!isFavorite);
    // TODO: Add/remove from wishlist in DB or client-side store (e.g., Zustand)
    if (isFavorite) {
      console.log(`Removed product ${productId} from wishlist`);
      // Call API to remove from wishlist
    } else {
      console.log(`Added product ${productId} to wishlist`);
      // Call API to add to wishlist
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className={`rounded-full p-2 transition-colors ${
        isFavorite
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
      }`}
      aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
    </button>
  );
}
