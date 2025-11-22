// Review Card Component
// Displays individual review with voting, images, and seller response

"use client";

import { useState } from "react";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, BadgeCheck, MoreVertical } from "lucide-react";
import { RatingDisplay } from "./RatingStars";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
    verifiedPurchase?: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
    createdAt: Date | string;
    sellerResponse?: string | null;
    sellerResponseAt?: Date | string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  currentUserId?: string;
  onVote?: (reviewId: string, vote: "HELPFUL" | "NOT_HELPFUL") => Promise<void>;
  onDelete?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => void;
  showActions?: boolean;
}

export function ReviewCard({
  review,
  currentUserId,
  onVote,
  onDelete,
  onReport,
  showActions = true,
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(
    review.helpfulCount,
  );
  const [localNotHelpfulCount, setLocalNotHelpfulCount] = useState(
    review.notHelpfulCount,
  );
  const [userVote, setUserVote] = useState<"HELPFUL" | "NOT_HELPFUL" | null>(
    null,
  );

  const isOwnReview = currentUserId === review.user.id;

  const handleVote = async (vote: "HELPFUL" | "NOT_HELPFUL") => {
    if (!onVote || isVoting) return;

    setIsVoting(true);
    try {
      await onVote(review.id, vote);

      // Optimistic update
      if (userVote === vote) {
        // Remove vote
        if (vote === "HELPFUL") {
          setLocalHelpfulCount((prev) => Math.max(0, prev - 1));
        } else {
          setLocalNotHelpfulCount((prev) => Math.max(0, prev - 1));
        }
        setUserVote(null);
      } else {
        // Add or change vote
        if (userVote === "HELPFUL") {
          setLocalHelpfulCount((prev) => Math.max(0, prev - 1));
          setLocalNotHelpfulCount((prev) => prev + 1);
        } else if (userVote === "NOT_HELPFUL") {
          setLocalNotHelpfulCount((prev) => Math.max(0, prev - 1));
          setLocalHelpfulCount((prev) => prev + 1);
        } else {
          if (vote === "HELPFUL") {
            setLocalHelpfulCount((prev) => prev + 1);
          } else {
            setLocalNotHelpfulCount((prev) => prev + 1);
          }
        }
        setUserVote(vote);
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const createdDate =
    typeof review.createdAt === "string"
      ? new Date(review.createdAt)
      : review.createdAt;

  const sellerResponseDate =
    review.sellerResponseAt &&
    (typeof review.sellerResponseAt === "string"
      ? new Date(review.sellerResponseAt)
      : review.sellerResponseAt);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.image || undefined} />
            <AvatarFallback>
              {review.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">
                {review.user.name || "Usuario"}
              </p>
              {review.verifiedPurchase && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Compra verificada</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <RatingDisplay rating={review.rating} size="sm" />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(createdDate, {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnReview && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(review.id)}
                  className="text-red-600"
                >
                  Eliminar reseña
                </DropdownMenuItem>
              )}
              {!isOwnReview && onReport && (
                <DropdownMenuItem onClick={() => onReport(review.id)}>
                  Reportar reseña
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900">{review.title}</h4>

      {/* Content */}
      <p className="text-gray-700 leading-relaxed">{review.content}</p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg"
            >
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Helpful votes */}
      {onVote && (
        <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-600">¿Útil?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote("HELPFUL")}
            disabled={isVoting}
            className={cn(
              "gap-1",
              userVote === "HELPFUL" && "bg-green-50 border-green-300",
            )}
          >
            <ThumbsUp
              className={cn(
                "h-4 w-4",
                userVote === "HELPFUL" && "fill-green-600 text-green-600",
              )}
            />
            <span>{localHelpfulCount}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVote("NOT_HELPFUL")}
            disabled={isVoting}
            className={cn(
              "gap-1",
              userVote === "NOT_HELPFUL" && "bg-red-50 border-red-300",
            )}
          >
            <ThumbsDown
              className={cn(
                "h-4 w-4",
                userVote === "NOT_HELPFUL" && "fill-red-600 text-red-600",
              )}
            />
            <span>{localNotHelpfulCount}</span>
          </Button>
        </div>
      )}

      {/* Seller response */}
      {review.sellerResponse && (
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
          <p className="mb-1 text-sm font-semibold text-blue-900">
            Respuesta del vendedor
          </p>
          <p className="text-sm text-blue-800">{review.sellerResponse}</p>
          {sellerResponseDate && (
            <p className="mt-2 text-xs text-blue-600">
              {formatDistanceToNow(sellerResponseDate, {
                addSuffix: true,
                locale: es,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
