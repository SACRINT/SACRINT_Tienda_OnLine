"use client";

import { Star, ChevronDown, Camera } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

// Dummy Data
const dummyReviews = [
  {
    id: "1",
    author: "Juan Pérez",
    date: "15/11/2025",
    rating: 5,
    title: "¡Impresionante!",
    content: "La mejor laptop que he tenido, corre todo sin problemas. La pantalla es una locura. Muy feliz con la compra.",
    helpful: 5,
    photos: ["https://picsum.photos/100/100?random=21", "https://picsum.photos/100/100?random=22"],
  },
  {
    id: "2",
    author: "María López",
    date: "10/11/2025",
    rating: 4,
    title: "Muy buena, pero pesada",
    content: "Excelente rendimiento, pero es un poco más pesada de lo que esperaba para transportar. Aun así, la recomiendo.",
    helpful: 3,
    photos: [],
  },
  {
    id: "3",
    author: "Pedro Gómez",
    date: "01/11/2025",
    rating: 5,
    title: "Perfecta para diseño",
    content: "Uso software de diseño 3D y esta máquina no me decepciona. Rápida y eficiente. La duración de la batería es buena.",
    helpful: 7,
    photos: ["https://picsum.photos/100/100?random=23"],
  },
  {
    id: "4",
    author: "Laura Fernández",
    date: "28/10/2025",
    rating: 3,
    title: "Cumple, pero podría mejorar",
    content: "Buena en general, pero el ventilador hace algo de ruido bajo carga. Esperaba más silencio por el precio.",
    helpful: 1,
    photos: [],
  },
  {
    id: "5",
    author: "Roberto Sánchez",
    date: "20/10/2025",
    rating: 5,
    title: "Servicio al cliente excelente",
    content: "Más allá del producto, el servicio al cliente fue de primera. Me ayudaron a resolver unas dudas rápidamente.",
    helpful: 8,
    photos: [],
  },
];

const ratingDistribution = {
  5: 60, // 60%
  4: 25, // 25%
  3: 10, // 10%
  2: 3,  // 3%
  1: 2,  // 2%
};

export function ReviewsSection() {
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]); // Placeholder for photo URLs

  const totalReviews = dummyReviews.length;
  const averageRating =
    totalReviews > 0
      ? dummyReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  const filteredReviews = selectedRatingFilter
    ? dummyReviews.filter((review) => review.rating === selectedRatingFilter)
    : dummyReviews;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ reviewTitle, reviewContent, reviewRating, reviewPhotos });
    // In a real app, send this to an API
    alert("Review submitted (simulated)");
    setReviewTitle("");
    setReviewContent("");
    setReviewRating(0);
    setReviewPhotos([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Simulate upload and get URLs
      const files = Array.from(e.target.files);
      const newPhotos = files.map(file => URL.createObjectURL(file)); // Create object URLs for preview
      setReviewPhotos(prev => [...prev, ...newPhotos].slice(0,3)); // Limit to 3 photos
    }
  }

  return (
    <section id="reviews" className="bg-white py-12">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900">Opiniones de Clientes</h2>

        {/* Summary and Distribution */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-5xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex flex-col">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.floor(averageRating) ? "fill-current" : ""
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">{totalReviews} Opiniones</p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{star} estrellas</span>
                  <div className="relative h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-blue-500"
                      style={{ width: `${ratingDistribution[star as keyof typeof ratingDistribution]}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-700">
                    {ratingDistribution[star as keyof typeof ratingDistribution]}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-4">Filtrar Opiniones</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRatingFilter === null ? "default" : "outline"}
                onClick={() => setSelectedRatingFilter(null)}
              >
                Todas ({totalReviews})
              </Button>
              {[5, 4, 3, 2, 1].map((star) => (
                <Button
                  key={star}
                  variant={selectedRatingFilter === star ? "default" : "outline"}
                  onClick={() => setSelectedRatingFilter(star)}
                >
                  {star} Estrellas
                </Button>
              ))}
            </div>
            {/* Placeholder for negative reviews filter */}
            <Button variant="outline" className="mt-2">Solo Negativas</Button>
          </div>
        </div>

        {/* Review List */}
        <div className="mt-12">
          {filteredReviews.length === 0 ? (
            <p className="text-center text-gray-600">No hay opiniones que coincidan con los filtros.</p>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 py-8 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900">{review.author}</span>
                    <span className="mx-2 text-gray-400">-</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-current" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">{review.title}</h3>
                <p className="mt-1 text-gray-700">{review.content}</p>
                {review.photos && review.photos.length > 0 && (
                    <div className="mt-4 flex gap-2">
                        {review.photos.map((photo, i) => (
                            <Image key={i} src={photo} alt={`Review photo ${i+1}`} width={80} height={80} className="rounded-md object-cover" />
                        ))}
                    </div>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  ¿Fue útil esta opinión? ({review.helpful})
                  <Button variant="link" className="ml-2 p-0 text-blue-600 hover:no-underline">Sí</Button>
                  <Button variant="link" className="ml-2 p-0 text-blue-600 hover:no-underline">No</Button>
                </div>
                {/* Placeholder for seller response */}
                {/* <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                    <p className="font-semibold text-gray-900">Respuesta del Vendedor:</p>
                    <p className="text-gray-700">Gracias por tu opinión...</p>
                </div> */}
              </div>
            ))
          )}
        </div>

        {/* Review Form */}
        <div id="submit-review" className="mt-12 border-t border-gray-200 pt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Deja tu Opinión</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-lg mx-auto p-6 border rounded-lg shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tu Calificación</label>
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-8 w-8 cursor-pointer ${
                                    star <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                                }`}
                                onClick={() => setReviewRating(star)}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="reviewTitle" className="block text-sm font-medium text-gray-700 mb-2">Título de la Opinión</label>
                    <Input
                        id="reviewTitle"
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Resume tu experiencia..."
                        required
                    />
                </div>
                <div>
                    <label htmlFor="reviewContent" className="block text-sm font-medium text-gray-700 mb-2">Tu Opinión</label>
                    <Textarea
                        id="reviewContent"
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        placeholder="¿Qué te gustó o no te gustó del producto?"
                        rows={5}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="reviewPhotos" className="block text-sm font-medium text-gray-700 mb-2">Fotos (máx. 3)</label>
                    <Input
                        id="reviewPhotos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        disabled={reviewPhotos.length >= 3}
                    />
                    {reviewPhotos.length > 0 && (
                        <div className="mt-2 flex gap-2">
                            {reviewPhotos.map((photoUrl, i) => (
                                <div key={i} className="relative w-20 h-20">
                                    <Image src={photoUrl} alt={`Preview ${i+1}`} layout="fill" objectFit="cover" className="rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                    {reviewPhotos.length < 3 && (
                        <p className="text-xs text-gray-500 mt-1">Puedes subir hasta {3 - reviewPhotos.length} fotos más.</p>
                    )}
                </div>
                <Button type="submit" className="w-full">Enviar Opinión</Button>
            </form>
        </div>
      </div>
    </section>
  );
}
