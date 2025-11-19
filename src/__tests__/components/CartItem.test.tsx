// CartItem Component Tests
import { render, screen, fireEvent } from "@testing-library/react";
import { CartItem } from "@/components/features/cart/CartItem";

describe("CartItem", () => {
  const mockItem = {
    id: "item_123",
    productId: "prod_123",
    variantId: null,
    quantity: 2,
    price: 49.99,
    name: "Test Product",
    image: "/test.jpg",
    sku: "SKU001",
  };

  const mockOnUpdate = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render item name", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("should render item price", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    expect(screen.getByText(/49\.99/)).toBeInTheDocument();
  });

  it("should render item quantity", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const quantityInput = screen.getByDisplayValue("2");
    expect(quantityInput).toBeInTheDocument();
  });

  it("should render subtotal", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    // 49.99 * 2 = 99.98
    expect(screen.getByText(/99\.98/)).toBeInTheDocument();
  });

  it("should render product image", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const image = screen.getByAltText("Test Product");
    expect(image).toBeInTheDocument();
  });

  it("should call onUpdate when quantity changes", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const quantityInput = screen.getByDisplayValue("2");
    fireEvent.change(quantityInput, { target: { value: "3" } });

    expect(mockOnUpdate).toHaveBeenCalledWith("prod_123", 3, null);
  });

  it("should call onRemove when remove button clicked", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const removeButton = screen.getByRole("button", { name: /eliminar|remove/i });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith("prod_123", null);
  });

  it("should increment quantity", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const incrementButton = screen.getByRole("button", { name: /\+|increment/i });
    fireEvent.click(incrementButton);

    expect(mockOnUpdate).toHaveBeenCalledWith("prod_123", 3, null);
  });

  it("should decrement quantity", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const decrementButton = screen.getByRole("button", { name: /-|decrement/i });
    fireEvent.click(decrementButton);

    expect(mockOnUpdate).toHaveBeenCalledWith("prod_123", 1, null);
  });

  it("should not decrement below 1", () => {
    const singleItem = { ...mockItem, quantity: 1 };
    render(
      <CartItem item={singleItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const decrementButton = screen.getByRole("button", { name: /-|decrement/i });
    expect(decrementButton).toBeDisabled();
  });

  it("should display SKU", () => {
    render(
      <CartItem item={mockItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    expect(screen.getByText(/SKU001/)).toBeInTheDocument();
  });

  it("should display variant info when present", () => {
    const variantItem = {
      ...mockItem,
      variantId: "var_123",
      variantName: "Size: Large, Color: Blue",
    };
    render(
      <CartItem item={variantItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    expect(screen.getByText(/Large/)).toBeInTheDocument();
    expect(screen.getByText(/Blue/)).toBeInTheDocument();
  });

  it("should handle missing image", () => {
    const noImageItem = { ...mockItem, image: null };
    render(
      <CartItem item={noImageItem} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
    );

    const placeholder = screen.getByTestId("image-placeholder");
    expect(placeholder).toBeInTheDocument();
  });
});
