// Reviews Moderation Client Component
// Interactive UI for managing reviews

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  verifiedPurchase?: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
  sellerResponse?: string | null;
  sellerResponseAt?: Date | string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string | null;
    images: string[];
  };
}

interface ReviewsModerationClientProps {
  initialReviews: Review[];
  statusCounts: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
  initialStatus: string;
}

export function ReviewsModerationClient({
  initialReviews,
  statusCounts,
  initialStatus,
}: ReviewsModerationClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (
    reviewId: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Update local state
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r)),
      );

      // Refresh to update counts
      router.refresh();
    } catch (error) {
      console.error("Error updating review status:", error);
      alert("Error al actualizar el estado de la reseña");
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!response.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerResponse: response }),
      });

      if (!res.ok) throw new Error("Failed to submit response");

      const updated = await res.json();

      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                sellerResponse: updated.sellerResponse,
                sellerResponseAt: updated.sellerResponseAt,
              }
            : r,
        ),
      );

      setRespondingTo(null);
      setResponse("");
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Error al enviar la respuesta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta reseña?")) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      // Remove from local state
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      router.refresh();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error al eliminar la reseña");
    }
  };

  const filteredReviews =
    activeTab === "ALL"
      ? reviews
      : reviews.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Moderación de Reseñas
        </h1>
        <p className="mt-2 text-gray-600">
          Administra las reseñas de tus productos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PENDING}</div>
            <p className="text-xs text-muted-foreground">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.APPROVED}</div>
            <p className="text-xs text-muted-foreground">Publicadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.REJECTED}</div>
            <p className="text-xs text-muted-foreground">No publicadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          router.push(`/dashboard/reviews?status=${value}`);
        }}
      >
        <TabsList>
          <TabsTrigger value="ALL">
            Todas ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            Pendientes ({statusCounts.PENDING})
          </TabsTrigger>
          <TabsTrigger value="APPROVED">
            Aprobadas ({statusCounts.APPROVED})
          </TabsTrigger>
          <TabsTrigger value="REJECTED">
            Rechazadas ({statusCounts.REJECTED})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600">
                    No hay reseñas {activeTab.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const createdDate =
                typeof review.createdAt === "string"
                  ? new Date(review.createdAt)
                  : review.createdAt;

              return (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.user.image || undefined} />
                            <AvatarFallback>
                              {review.user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-medium text-gray-900">
                              {review.user.name || "Usuario"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>
                                {formatDistanceToNow(createdDate, {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                              {review.verifiedPurchase && (
                                <Badge variant="outline" className="gap-1">
                                  <Package className="h-3 w-3" />
                                  Compra verificada
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={
                            review.status === "APPROVED"
                              ? "default"
                              : review.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {review.status === "APPROVED"
                            ? "Aprobada"
                            : review.status === "PENDING"
                              ? "Pendiente"
                              : "Rechazada"}
                        </Badge>
                      </div>

                      {/* Product info */}
                      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        {review.product.images[0] && (
                          <div className="relative h-12 w-12 overflow-hidden rounded">
                            <Image
                              src={review.product.images[0]}
                              alt={review.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/shop/${review.product.slug || review.product.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {review.product.name}
                          </Link>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Review content */}
                      <div>
                        <h4 className="mb-2 font-semibold text-gray-900">
                          {review.title}
                        </h4>
                        <p className="text-gray-700">{review.content}</p>
                      </div>

                      {/* Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2">
                          {review.images.map((img, i) => (
                            <div
                              key={i}
                              className="relative h-20 w-20 overflow-hidden rounded-lg"
                            >
                              <Image
                                src={img}
                                alt={`Review image ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {review.helpfulCount} útil
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="h-4 w-4" />
                          {review.notHelpfulCount} no útil
                        </span>
                      </div>

                      {/* Seller response */}
                      {review.sellerResponse ? (
                        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                          <p className="mb-1 text-sm font-semibold text-blue-900">
                            Tu respuesta
                          </p>
                          <p className="text-sm text-blue-800">
                            {review.sellerResponse}
                          </p>
                        </div>
                      ) : respondingTo === review.id ? (
                        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={3}
                            maxLength={1000}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitResponse(review.id)}
                              disabled={isSubmitting || !response.trim()}
                            >
                              {isSubmitting ? "Enviando..." : "Enviar respuesta"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponse("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                        {review.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(review.id, "APPROVED")
                              }
                              className="gap-1 text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(review.id, "REJECTED")
                              }
                              className="gap-1 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </>
                        )}

                        {review.status === "APPROVED" &&
                          !review.sellerResponse &&
                          respondingTo !== review.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRespondingTo(review.id)}
                              className="gap-1"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Responder
                            </Button>
                          )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReview(review.id)}
                          className="gap-1 text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
