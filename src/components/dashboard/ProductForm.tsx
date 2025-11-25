"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Upload,
  X,
  GripVertical,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";


interface Category {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { name: string; value: string }[];
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string | null;
    basePrice: number | any;
    salePrice?: number | any | null;
    stock: number;
    sku: string | null;
    categoryId: string | null;
    published: boolean;
    featured?: boolean;
    variants?: ProductVariant[];
    images?: ProductImage[];
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
  };
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Basic info
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice || 0,
    salePrice: product?.salePrice || "",
    stock: product?.stock || 0,
    sku: product?.sku || "",
    categoryId: product?.categoryId || "",
    published: product?.published !== undefined ? product.published : false,
    featured: product?.featured !== undefined ? product.featured : false,
  });

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || [],
  );
  const [hasVariants, setHasVariants] = useState(
    (product?.variants?.length || 0) > 0,
  );

  // Images
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);

  // SEO
  const [seoData, setSeoData] = useState({
    metaTitle: product?.metaTitle || "",
    metaDescription: product?.metaDescription || "",
    tags: product?.tags || [],
  });
  const [tagInput, setTagInput] = useState("");

  // Shipping
  const [shippingData, setShippingData] = useState({
    weight: product?.weight || 0,
    length: product?.dimensions?.length || 0,
    width: product?.dimensions?.width || 0,
    height: product?.dimensions?.height || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      const payload = {
        ...formData,
        variants: hasVariants ? variants : [],
        images,
        ...seoData,
        weight: shippingData.weight,
        dimensions: {
          length: shippingData.length,
          width: shippingData.width,
          height: shippingData.height,
        },
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/dashboard/products");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || "Error al guardar el producto");
      }
    } catch (error) {
      alert("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value) || 0
          : type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  // Variant handlers
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}`,
      name: "",
      sku: "",
      price: formData.basePrice || 0,
      stock: 0,
      attributes: [{ name: "Talla", value: "" }],
    };
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addVariantAttribute = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].attributes.push({ name: "", value: "" });
    setVariants(updated);
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "name" | "value",
    value: string,
  ) => {
    const updated = [...variants];
    updated[variantIndex].attributes[attrIndex][field] = value;
    setVariants(updated);
  };

  const removeVariantAttribute = (variantIndex: number, attrIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].attributes = updated[variantIndex].attributes.filter(
      (_, i) => i !== attrIndex,
    );
    setVariants(updated);
  };

  // Image handlers
  const handleImageUpload = () => {
    // In production, this would open a file picker and upload to Cloudinary
    const mockImage: ProductImage = {
      id: `img-${Date.now()}`,
      url: `https://via.placeholder.com/400x400?text=Producto`,
      alt: formData.name || "Producto",
      isPrimary: images.length === 0,
    };
    setImages([...images, mockImage]);
  };

  const removeImage = (imageId: string) => {
    const updated = images.filter((img) => img.id !== imageId);
    // If we removed the primary, make the first one primary
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setImages(updated);
  };

  const setPrimaryImage = (imageId: string) => {
    setImages(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      })),
    );
  };

  // Tag handlers
  const addTag = () => {
    if (tagInput.trim() && !seoData.tags.includes(tagInput.trim())) {
      setSeoData({
        ...seoData,
        tags: [...seoData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setSeoData({
      ...seoData,
      tags: seoData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="shipping">Envío</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Camiseta Deportiva Premium"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Describe tu producto en detalle..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ej: CAM-DEP-001"
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">Categoría</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precios e Inventario</CardTitle>
              <CardDescription>
                Configura precios y disponibilidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Precio Base (MXN) *</Label>
                  <Input
                    id="basePrice"
                    name="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice">Precio de Oferta (MXN)</Label>
                  <Input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={handleChange}
                    placeholder="Dejar vacío si no hay descuento"
                  />
                </div>
              </div>

              {!hasVariants && (
                <div className="w-1/2">
                  <Label htmlFor="stock">Stock Disponible *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    placeholder="0"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">Publicado</Label>
                  <p className="text-sm text-muted-foreground">
                    El producto será visible en la tienda
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, published: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured">Destacado</Label>
                  <p className="text-sm text-muted-foreground">
                    Aparecerá en secciones destacadas
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Galería de Imágenes</CardTitle>
              <CardDescription>
                Sube hasta 10 imágenes del producto. La primera será la
                principal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group aspect-square rounded-lg border-2 overflow-hidden ${
                      image.isPrimary
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
<Image
                    src={image.url}
                    alt={image.alt}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={image.isPrimary}
                      >
                        Principal
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {image.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-primary">
                        Principal
                      </Badge>
                    )}
                  </div>
                ))}

                {images.length < 10 && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Subir imagen</span>
                  </button>
                )}
              </div>

              {images.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay imágenes. Sube al menos una imagen del producto.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variantes del Producto</CardTitle>
              <CardDescription>
                Agrega variaciones como tallas, colores, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>¿Este producto tiene variantes?</Label>
                  <p className="text-sm text-muted-foreground">
                    Activa para productos con diferentes tallas, colores, etc.
                  </p>
                </div>
                <Switch
                  checked={hasVariants}
                  onCheckedChange={setHasVariants}
                />
              </div>

              {hasVariants && (
                <>
                  <Separator />

                  {variants.map((variant, variantIndex) => (
                    <Card key={variant.id} className="bg-muted/50">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              Variante {variantIndex + 1}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVariant(variantIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Nombre</Label>
                            <Input
                              value={variant.name}
                              onChange={(e) =>
                                updateVariant(
                                  variantIndex,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Ej: Talla M - Azul"
                            />
                          </div>
                          <div>
                            <Label>SKU</Label>
                            <Input
                              value={variant.sku}
                              onChange={(e) =>
                                updateVariant(
                                  variantIndex,
                                  "sku",
                                  e.target.value,
                                )
                              }
                              placeholder="Ej: CAM-001-M-AZ"
                            />
                          </div>
                          <div>
                            <Label>Precio</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(
                                  variantIndex,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) =>
                                updateVariant(
                                  variantIndex,
                                  "stock",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Atributos</Label>
                          {variant.attributes.map((attr, attrIndex) => (
                            <div
                              key={attrIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={attr.name}
                                onChange={(e) =>
                                  updateVariantAttribute(
                                    variantIndex,
                                    attrIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ej: Talla"
                                className="w-1/3"
                              />
                              <Input
                                value={attr.value}
                                onChange={(e) =>
                                  updateVariantAttribute(
                                    variantIndex,
                                    attrIndex,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ej: M"
                                className="flex-1"
                              />
                              {variant.attributes.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeVariantAttribute(
                                      variantIndex,
                                      attrIndex,
                                    )
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addVariantAttribute(variantIndex)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar atributo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVariant}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Variante
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Envío</CardTitle>
              <CardDescription>
                Peso y dimensiones para calcular costos de envío
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-1/2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingData.weight}
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      weight: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <Separator />

              <div>
                <Label>Dimensiones (cm)</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label
                      htmlFor="length"
                      className="text-xs text-muted-foreground"
                    >
                      Largo
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.1"
                      min="0"
                      value={shippingData.length}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          length: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="width"
                      className="text-xs text-muted-foreground"
                    >
                      Ancho
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      min="0"
                      value={shippingData.width}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          width: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="height"
                      className="text-xs text-muted-foreground"
                    >
                      Alto
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      min="0"
                      value={shippingData.height}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          height: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO y Metadatos</CardTitle>
              <CardDescription>
                Optimiza tu producto para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Título Meta</Label>
                <Input
                  id="metaTitle"
                  value={seoData.metaTitle}
                  onChange={(e) =>
                    setSeoData({ ...seoData, metaTitle: e.target.value })
                  }
                  placeholder={formData.name || "Título para SEO"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seoData.metaTitle.length}/60 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Descripción Meta</Label>
                <textarea
                  id="metaDescription"
                  value={seoData.metaDescription}
                  onChange={(e) =>
                    setSeoData({ ...seoData, metaDescription: e.target.value })
                  }
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Breve descripción para resultados de búsqueda"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seoData.metaDescription.length}/160 caracteres
                </p>
              </div>

              <Separator />

              <div>
                <Label>Etiquetas</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Agregar etiqueta..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {seoData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {seoData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">
                  Vista previa en Google
                </p>
                <div className="space-y-1">
                  <p className="text-primary text-lg hover:underline cursor-pointer">
                    {seoData.metaTitle ||
                      formData.name ||
                      "Título del producto"}
                  </p>
                  <p className="text-sm text-success">
                    tutienda.com/productos/
                    {formData.sku?.toLowerCase() || "producto"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {seoData.metaDescription ||
                      formData.description?.slice(0, 160) ||
                      "Descripción del producto..."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons */}
      <div className="flex gap-4 sticky bottom-4 bg-background p-4 rounded-lg shadow-lg border">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading
            ? "Guardando..."
            : product
              ? "Actualizar Producto"
              : "Crear Producto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
