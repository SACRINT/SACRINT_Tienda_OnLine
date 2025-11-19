// ProductCard Component Tests
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "@/components/features/products/ProductCard";

// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ProductCard", () => {
  const mockProduct = {
    id: "prod_123",
    name: "Test Product",
    slug: "test-product",
    description: "A test product description",
    basePrice: 99.99,
    salePrice: null,
    stock: 100,
    images: [{ url: "/test-image.jpg", alt: "Test Product" }],
    category: { id: "cat_123", name: "Electronics", slug: "electronics" },
    reviewCount: 10,
    avgRating: 4.5,
  };

  it("should render product name", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("should render product price", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/99\.99/)).toBeInTheDocument();
  });

  it("should render sale price when available", () => {
    const saleProduct = { ...mockProduct, salePrice: 79.99 };
    render(<ProductCard product={saleProduct} />);

    expect(screen.getByText(/79\.99/)).toBeInTheDocument();
  });

  it("should show original price with strikethrough for sale", () => {
    const saleProduct = { ...mockProduct, salePrice: 79.99 };
    render(<ProductCard product={saleProduct} />);

    const originalPrice = screen.getByText(/99\.99/);
    expect(originalPrice).toHaveClass("line-through");
  });

  it("should render product image", () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText("Test Product");
    expect(image).toBeInTheDocument();
  });

  it("should render category name", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("should show rating when available", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/10.*reviews|reseñas/i)).toBeInTheDocument();
  });

  it("should show out of stock badge", () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText(/agotado|out of stock/i)).toBeInTheDocument();
  });

  it("should call onAddToCart when button clicked", () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    const addButton = screen.getByRole("button", { name: /agregar|add/i });
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it("should disable add to cart for out of stock", () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);

    const addButton = screen.getByRole("button", { name: /agregar|add/i });
    expect(addButton).toBeDisabled();
  });

  it("should have link to product detail", () => {
    render(<ProductCard product={mockProduct} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("test-product"));
  });

  it("should show discount percentage for sale", () => {
    const saleProduct = { ...mockProduct, basePrice: 100, salePrice: 80 };
    render(<ProductCard product={saleProduct} />);

    expect(screen.getByText(/-20%/)).toBeInTheDocument();
  });

  it("should handle missing image", () => {
    const noImageProduct = { ...mockProduct, images: [] };
    render(<ProductCard product={noImageProduct} />);

    // Should show placeholder
    const placeholder = screen.getByTestId("image-placeholder");
    expect(placeholder).toBeInTheDocument();
  });
});
