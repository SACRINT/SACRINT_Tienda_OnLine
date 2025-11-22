// Review Form Component
// Submit new product reviews with rating, title, content, and images

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RatingPicker } from "./RatingStars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Por favor selecciona una calificación").max(5),
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(200, "El título debe tener máximo 200 caracteres"),
  content: z
    .string()
    .min(10, "La reseña debe tener al menos 10 caracteres")
    .max(5000, "La reseña debe tener máximo 5000 caracteres"),
  images: z.array(z.string().url()).max(5, "Máximo 5 imágenes permitidas"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  orderId?: string;
  onSubmit: (data: ReviewFormData & { productId: string; orderId?: string }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({ productId, orderId, onSubmit, onCancel, className }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: "",
      content: "",
      images: [],
    },
  });

  const rating = watch("rating");

  const handleRatingChange = (newRating: number) => {
    setValue("rating", newRating, { shouldValidate: true });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate image count
    if (imageUrls.length + files.length > 5) {
      setImageUploadError("Máximo 5 imágenes permitidas");
      return;
    }

    setImageUploadError(null);

    // In a real implementation, you would upload to a storage service (S3, Cloudinary, etc.)
    // For now, we'll create temporary URLs (this is just a placeholder)
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          setImageUploadError("Solo se permiten archivos de imagen");
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setImageUploadError("Las imágenes deben ser menores a 5MB");
          continue;
        }

        // Create temporary URL (in production, upload to storage)
        const tempUrl = URL.createObjectURL(file);
        newUrls.push(tempUrl);
      }

      const updatedUrls = [...imageUrls, ...newUrls];
      setImageUrls(updatedUrls);
      setValue("images", updatedUrls);
    } catch (error) {
      setImageUploadError("Error al subir imágenes");
    }
  };

  const removeImage = (index: number) => {
    const updatedUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedUrls);
    setValue("images", updatedUrls);
    setImageUploadError(null);
  };

  const onSubmitForm = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        productId,
        orderId,
      });
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className={cn("space-y-6 rounded-lg border border-gray-200 bg-white p-6", className)}
    >
      <h3 className="text-lg font-semibold text-gray-900">Escribe una reseña</h3>

      {/* Rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Calificación *</Label>
        <RatingPicker value={rating} onChange={handleRatingChange} />
        {errors.rating && <p className="text-sm text-red-600">{errors.rating.message}</p>}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Título de la reseña *
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Resumen tu experiencia"
          maxLength={200}
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium text-gray-700">
          Tu reseña *
        </Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="Cuéntanos sobre tu experiencia con este producto. ¿Qué te gustó? ¿Qué mejorarías?"
          rows={6}
          maxLength={5000}
          className={cn(errors.content && "border-red-500")}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Mínimo 10 caracteres</span>
          <span>{watch("content")?.length || 0} / 5000</span>
        </div>
        {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Fotos (opcional)</Label>
        <div className="space-y-3">
          {/* Image preview */}
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {imageUrls.length < 5 && (
            <div>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Label
                htmlFor="images"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-100"
              >
                <Upload className="h-5 w-5" />
                <span>Sube hasta {5 - imageUrls.length} foto(s) más (máx 5MB c/u)</span>
              </Label>
            </div>
          )}

          {imageUploadError && <p className="text-sm text-red-600">{imageUploadError}</p>}
          <p className="text-xs text-gray-500">
            Las fotos ayudan a otros compradores. Formatos: JPG, PNG
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p>Tu reseña será revisada antes de publicarse. Por favor, sé honesto y respetuoso.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Publicar reseña"
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
