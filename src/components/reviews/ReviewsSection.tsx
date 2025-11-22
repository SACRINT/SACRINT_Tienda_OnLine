// Reviews Section Component
// Main component integrating all review functionality

"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { RatingBreakdown } from "./RatingBreakdown";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Review {
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
}

interface ReviewsStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Array<{
    rating: number;
    count: number;
  }>;
}

interface ReviewsSectionProps {
  productId: string;
  orderId?: string; // If user purchased this product
  canWriteReview?: boolean; // User can write a review
  className?: string;
}

export function ReviewsSection({
  productId,
  orderId,
  canWriteReview = false,
  className,
}: ReviewsSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters and pagination
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating">("recent");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [showForm, setShowForm] = useState(false);

  // Fetch reviews
  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, filterRating, page]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        sortBy,
        page: page.toString(),
        limit: "10",
        status: "APPROVED",
      });

      if (filterRating) {
        params.append("rating", filterRating.toString());
      }

      const response = await fetch(`/api/reviews?${params}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (data: {
    rating: number;
    title: string;
    content: string;
    images: string[];
    productId: string;
    orderId?: string;
  }) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      // Success - close form and refresh
      setShowForm(false);
      await fetchReviews();

      // Show success message (you could use a toast notification here)
      alert("¡Reseña enviada! Será revisada antes de publicarse.");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert(error.message || "Error al enviar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, vote: "HELPFUL" | "NOT_HELPFUL") => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });

      if (!response.ok) throw new Error("Failed to vote");

      // Refresh reviews to get updated counts
      await fetchReviews();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta reseña?")) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete review");

      // Refresh reviews
      await fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error al eliminar la reseña");
    }
  };

  const handleReportReview = (reviewId: string) => {
    // In a real app, this would open a modal or send a report
    alert("Función de reporte en desarrollo. Gracias por ayudarnos a mantener la calidad.");
  };

  const handleFilterByRating = (rating: number | null) => {
    setFilterRating(rating);
    setPage(1); // Reset to first page
  };

  return (
    <div className={className}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <MessageSquare className="h-6 w-6" />
          Reseñas de clientes
        </h2>
        {canWriteReview && !showForm && (
          <Button onClick={() => setShowForm(true)}>Escribir reseña</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Rating breakdown */}
        <div className="lg:col-span-1">
          {stats && (
            <RatingBreakdown
              averageRating={stats.averageRating}
              totalReviews={stats.totalReviews}
              breakdown={stats.ratingBreakdown}
              onFilterByRating={handleFilterByRating}
              selectedRating={filterRating}
            />
          )}
        </div>

        {/* Right column: Reviews list */}
        <div className="space-y-6 lg:col-span-2">
          {/* Review form */}
          {showForm && (
            <ReviewForm
              productId={productId}
              orderId={orderId}
              onSubmit={handleSubmitReview}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Sort controls */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              {stats?.totalReviews || 0}{" "}
              {stats?.totalReviews === 1 ? "reseña" : "reseñas"}
            </p>
            <Select
              value={sortBy}
              onValueChange={(value: "recent" | "helpful" | "rating") =>
                setSortBy(value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="helpful">Más útiles</SelectItem>
                <SelectItem value="rating">Mayor calificación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews list */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
              <MessageSquare className="mb-3 h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                {filterRating
                  ? `No hay reseñas con ${filterRating} estrellas`
                  : "Aún no hay reseñas"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {canWriteReview && !showForm
                  ? "¡Sé el primero en escribir una!"
                  : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={session?.user?.id}
                  onVote={handleVote}
                  onDelete={handleDeleteReview}
                  onReport={handleReportReview}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
