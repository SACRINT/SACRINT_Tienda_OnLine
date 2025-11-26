/**
 * Tests de Integración - API de Duplicación de Productos
 * Semana 13: Testing & QA
 * Calidad Mundial: Cobertura completa de casos de uso y edge cases
 */

import { POST } from "@/app/api/products/[id]/duplicate/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

// Mock de dependencias
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db");
jest.mock("@/lib/db/tenant");
jest.mock("@/lib/monitoring/logger");

describe("API: POST /api/products/[id]/duplicate", () => {
  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      role: "STORE_OWNER",
      tenantId: "tenant-123",
    },
  };

  const mockProduct = {
    id: "product-123",
    tenantId: "tenant-123",
    name: "Producto Original",
    description: "Descripción del producto",
    slug: "producto-original",
    sku: "SKU-001",
    basePrice: 100,
    salePrice: 80,
    cost: 50,
    stock: 10,
    categoryId: "cat-123",
    published: true,
    featured: false,
    metaTitle: "Meta Title",
    metaDescription: "Meta Description",
    weight: 1.5,
    dimensions: { length: 10, width: 5, height: 3 },
    images: [
      { id: "img-1", url: "https://example.com/img1.jpg", alt: "Imagen 1", isPrimary: true },
      { id: "img-2", url: "https://example.com/img2.jpg", alt: "Imagen 2", isPrimary: false },
    ],
    variants: [
      {
        id: "var-1",
        name: "Talla M",
        sku: "SKU-001-M",
        price: 100,
        stock: 5,
        images: [{ id: "vimg-1", url: "https://example.com/var1.jpg", alt: "Variante 1" }],
        attributes: [{ name: "Talla", value: "M" }],
      },
    ],
    tags: [{ name: "nuevo" }, { name: "oferta" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("✅ Casos de Éxito", () => {
    it("debe duplicar un producto correctamente con todos sus datos", async () => {
      // Arrange
      const mockDuplicated = {
        ...mockProduct,
        id: "product-456",
        name: "Producto Original (Copia)",
        sku: "SKU-001-COPY-1234567890",
        slug: "producto-original-copy-1234567890",
        stock: 0,
        published: false,
      };

      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue(mockDuplicated);

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      // Act
      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.productId).toBe("product-456");
      expect(db.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: expect.stringContaining("(Copia)"),
            stock: 0,
            published: false,
          }),
        })
      );
    });

    it("debe generar SKU y slug únicos con timestamp", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({
        ...mockProduct,
        id: "new-id",
      });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.sku).toMatch(/^SKU-001-COPY-\d+$/);
      expect(createCall.data.slug).toMatch(/^producto-original-copy-\d+$/);
    });

    it("debe duplicar todas las imágenes del producto", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.images.create).toHaveLength(2);
      expect(createCall.data.images.create[0]).toMatchObject({
        url: "https://example.com/img1.jpg",
        alt: "Imagen 1",
        isPrimary: true,
      });
    });

    it("debe duplicar todas las variantes con sus atributos", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.variants.create).toHaveLength(1);
      expect(createCall.data.variants.create[0].stock).toBe(0);
      expect(createCall.data.variants.create[0].attributes.create).toHaveLength(1);
    });

    it("debe duplicar todos los tags del producto", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tags.create).toHaveLength(2);
    });

    it("debe resetear el stock a 0 por seguridad", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.stock).toBe(0);
      expect(createCall.data.variants.create[0].stock).toBe(0);
    });

    it("debe despublicar el producto duplicado por defecto", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.published).toBe(false);
      expect(createCall.data.featured).toBe(false);
    });
  });

  describe("❌ Casos de Error", () => {
    it("debe retornar 401 si el usuario no está autenticado", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("debe retornar 403 si el usuario no es STORE_OWNER o SUPER_ADMIN", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { ...mockSession.user, role: "CUSTOMER" },
      });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("debe retornar 400 si el usuario no tiene tenant asignado", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { ...mockSession.user, tenantId: null },
      });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No tenant assigned to user");
    });

    it("debe retornar 404 si el producto no existe", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("debe retornar 404 si el producto pertenece a otro tenant", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        tenantId: "different-tenant",
      });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("debe manejar errores de base de datos gracefully", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockRejectedValue(new Error("Database error"));

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to duplicate product");
    });
  });

  describe("🔍 Casos Edge", () => {
    it("debe manejar productos sin SKU correctamente", async () => {
      const productWithoutSku = { ...mockProduct, sku: null };
      (db.product.findUnique as jest.Mock).mockResolvedValue(productWithoutSku);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.sku).toMatch(/^COPY-\d+$/);
    });

    it("debe manejar productos sin variantes", async () => {
      const productWithoutVariants = { ...mockProduct, variants: [] };
      (db.product.findUnique as jest.Mock).mockResolvedValue(productWithoutVariants);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      await POST(req, { params: { id: "product-123" } });

      const createCall = (db.product.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.variants).toBeUndefined();
    });

    it("debe manejar productos sin imágenes", async () => {
      const productWithoutImages = { ...mockProduct, images: [] };
      (db.product.findUnique as jest.Mock).mockResolvedValue(productWithoutImages);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });

      expect(response.status).toBe(200);
    });

    it("debe manejar productos sin tags", async () => {
      const productWithoutTags = { ...mockProduct, tags: [] };
      (db.product.findUnique as jest.Mock).mockResolvedValue(productWithoutTags);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const response = await POST(req, { params: { id: "product-123" } });

      expect(response.status).toBe(200);
    });
  });

  describe("📊 Tests de Rendimiento", () => {
    it("debe completar la duplicación en menos de 2 segundos", async () => {
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.create as jest.Mock).mockResolvedValue({ id: "new-id" });

      const req = new NextRequest("http://localhost/api/products/product-123/duplicate", {
        method: "POST",
      });

      const startTime = Date.now();
      await POST(req, { params: { id: "product-123" } });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
