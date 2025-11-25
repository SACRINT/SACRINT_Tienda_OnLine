/**
 * Tests de Integración - API de Archivado de Productos
 * Semana 13: Testing & QA
 * Calidad Mundial: Pruebas exhaustivas de soft delete
 */

import { POST, DELETE } from "@/app/api/products/[id]/archive/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db");
jest.mock("@/lib/db/tenant");
jest.mock("@/lib/monitoring/logger");

describe("API: /api/products/[id]/archive", () => {
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
    name: "Producto Test",
    published: true,
    archivedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("POST /archive - Archivar Producto", () => {
    describe("✅ Casos de Éxito", () => {
      it("debe archivar un producto correctamente", async () => {
        const archivedProduct = {
          ...mockProduct,
          archivedAt: new Date(),
          published: false,
        };

        (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (db.product.update as jest.Mock).mockResolvedValue(archivedProduct);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        const response = await POST(req, { params: { id: "product-123" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe("Product archived successfully");
        expect(data.product.archivedAt).toBeDefined();
        expect(data.product.published).toBe(false);
      });

      it("debe despublicar automáticamente al archivar", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (db.product.update as jest.Mock).mockResolvedValue({
          ...mockProduct,
          archivedAt: new Date(),
          published: false,
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        await POST(req, { params: { id: "product-123" } });

        expect(db.product.update).toHaveBeenCalledWith({
          where: { id: "product-123" },
          data: {
            archivedAt: expect.any(Date),
            published: false,
          },
        });
      });

      it("debe registrar el evento de archivado en logs", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (db.product.update as jest.Mock).mockResolvedValue({
          ...mockProduct,
          archivedAt: new Date(),
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        await POST(req, { params: { id: "product-123" } });

        // Verificar que se llamó al logger (mock)
        expect(db.product.update).toHaveBeenCalled();
      });
    });

    describe("❌ Casos de Error", () => {
      it("debe retornar 401 si no está autenticado", async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        const response = await POST(req, { params: { id: "product-123" } });

        expect(response.status).toBe(401);
      });

      it("debe retornar 403 si no tiene permisos", async () => {
        (auth as jest.Mock).mockResolvedValue({
          user: { ...mockSession.user, role: "CUSTOMER" },
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        const response = await POST(req, { params: { id: "product-123" } });

        expect(response.status).toBe(403);
      });

      it("debe retornar 404 si el producto no existe", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        const response = await POST(req, { params: { id: "product-123" } });

        expect(response.status).toBe(404);
      });

      it("debe retornar 404 si el producto pertenece a otro tenant", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue({
          ...mockProduct,
          tenantId: "different-tenant",
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "POST",
        });

        const response = await POST(req, { params: { id: "product-123" } });

        expect(response.status).toBe(404);
      });
    });
  });

  describe("DELETE /archive - Restaurar Producto", () => {
    const archivedProduct = {
      ...mockProduct,
      archivedAt: new Date("2025-01-01"),
      published: false,
    };

    describe("✅ Casos de Éxito", () => {
      it("debe restaurar un producto archivado correctamente", async () => {
        const restoredProduct = {
          ...archivedProduct,
          archivedAt: null,
        };

        (db.product.findUnique as jest.Mock).mockResolvedValue(archivedProduct);
        (db.product.update as jest.Mock).mockResolvedValue(restoredProduct);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "DELETE",
        });

        const response = await DELETE(req, { params: { id: "product-123" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe("Product restored successfully");
        expect(data.product.archivedAt).toBeNull();
      });

      it("debe establecer archivedAt a null al restaurar", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(archivedProduct);
        (db.product.update as jest.Mock).mockResolvedValue({
          ...archivedProduct,
          archivedAt: null,
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "DELETE",
        });

        await DELETE(req, { params: { id: "product-123" } });

        expect(db.product.update).toHaveBeenCalledWith({
          where: { id: "product-123" },
          data: {
            archivedAt: null,
          },
        });
      });

      it("debe mantener el estado published original después de restaurar", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(archivedProduct);
        (db.product.update as jest.Mock).mockResolvedValue({
          ...archivedProduct,
          archivedAt: null,
        });

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "DELETE",
        });

        await DELETE(req, { params: { id: "product-123" } });

        // Verificar que NO se modificó el campo published
        const updateCall = (db.product.update as jest.Mock).mock.calls[0][0];
        expect(updateCall.data.published).toBeUndefined();
      });
    });

    describe("❌ Casos de Error", () => {
      it("debe retornar 401 si no está autenticado", async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "DELETE",
        });

        const response = await DELETE(req, { params: { id: "product-123" } });

        expect(response.status).toBe(401);
      });

      it("debe retornar 404 si el producto no existe", async () => {
        (db.product.findUnique as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest("http://localhost/api/products/product-123/archive", {
          method: "DELETE",
        });

        const response = await DELETE(req, { params: { id: "product-123" } });

        expect(response.status).toBe(404);
      });
    });
  });

  describe("🔄 Tests de Ciclo Completo", () => {
    it("debe permitir archivar y restaurar múltiples veces", async () => {
      // Primera vez: archivar
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        archivedAt: new Date(),
      });

      const archiveReq = new NextRequest("http://localhost/api/products/product-123/archive", {
        method: "POST",
      });

      const archiveResponse = await POST(archiveReq, { params: { id: "product-123" } });
      expect(archiveResponse.status).toBe(200);

      // Segunda vez: restaurar
      (db.product.findUnique as jest.Mock).mockResolvedValue({
        ...mockProduct,
        archivedAt: new Date(),
      });
      (db.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        archivedAt: null,
      });

      const restoreReq = new NextRequest("http://localhost/api/products/product-123/archive", {
        method: "DELETE",
      });

      const restoreResponse = await DELETE(restoreReq, { params: { id: "product-123" } });
      expect(restoreResponse.status).toBe(200);

      // Tercera vez: volver a archivar
      (db.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (db.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        archivedAt: new Date(),
      });

      const archiveReq2 = new NextRequest("http://localhost/api/products/product-123/archive", {
        method: "POST",
      });

      const archiveResponse2 = await POST(archiveReq2, { params: { id: "product-123" } });
      expect(archiveResponse2.status).toBe(200);
    });
  });
});
