/**
 * ReviewForm Component Tests
 * Tests review submission form with validation and image upload
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewForm } from "../ReviewForm";

describe("ReviewForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders form title", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Escribe una reseña")).toBeInTheDocument();
    });

    it("renders all form fields", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Calificación *")).toBeInTheDocument();
      expect(screen.getByLabelText("Título de la reseña *")).toBeInTheDocument();
      expect(screen.getByLabelText("Tu reseña *")).toBeInTheDocument();
      expect(screen.getByText("Fotos (opcional)")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("button", { name: "Publicar reseña" })).toBeInTheDocument();
    });

    it("renders cancel button when onCancel provided", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    });

    it("does not render cancel button when onCancel not provided", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    });

    it("renders disclaimer text", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Tu reseña será revisada antes de publicarse/)).toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
      const { container } = render(
        <ReviewForm productId="prod-1" onSubmit={mockOnSubmit} className="custom-class" />,
      );

      expect(container.firstChild?.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Rating Selection", () => {
    it("allows rating selection", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]); // Click 4th star

      // RatingPicker should show hover feedback
      expect(screen.getByText("4 / 5")).toBeInTheDocument();
    });

    it("shows validation error when rating not selected", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Por favor selecciona una calificación")).toBeInTheDocument();
      });
    });
  });

  describe("Title Input", () => {
    it("allows title input", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText("Título de la reseña *");
      await user.type(titleInput, "Great product");

      expect(titleInput).toHaveValue("Great product");
    });

    it("shows validation error for empty title", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("El título es requerido")).toBeInTheDocument();
      });
    });

    it("enforces maximum title length of 200 characters", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText("Título de la reseña *") as HTMLInputElement;

      expect(titleInput.maxLength).toBe(200);
    });

    it("shows validation error when title exceeds 200 characters", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByLabelText("Título de la reseña *");
      const longTitle = "A".repeat(201);

      // Type and submit (since maxLength prevents typing, we test validation)
      Object.defineProperty(titleInput, "value", {
        writable: true,
        value: longTitle,
      });
      fireEvent.change(titleInput, { target: { value: longTitle } });

      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("El título debe tener máximo 200 caracteres")).toBeInTheDocument();
      });
    });
  });

  describe("Content Textarea", () => {
    it("allows content input", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByLabelText("Tu reseña *");
      await user.type(contentTextarea, "This is a great product!");

      expect(contentTextarea).toHaveValue("This is a great product!");
    });

    it("shows character count", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByLabelText("Tu reseña *");
      await user.type(contentTextarea, "Hello");

      expect(screen.getByText("5 / 5000")).toBeInTheDocument();
    });

    it("shows validation error for content less than 10 characters", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByLabelText("Tu reseña *");
      await user.type(contentTextarea, "Short");

      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("La reseña debe tener al menos 10 caracteres")).toBeInTheDocument();
      });
    });

    it("enforces maximum content length of 5000 characters", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const contentTextarea = screen.getByLabelText("Tu reseña *") as HTMLTextAreaElement;

      expect(contentTextarea.maxLength).toBe(5000);
    });

    it("shows minimum character requirement", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Mínimo 10 caracteres")).toBeInTheDocument();
    });
  });

  describe("Image Upload", () => {
    it("renders image upload section", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Sube hasta 5 foto/)).toBeInTheDocument();
    });

    it("shows upload area when no images uploaded", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Sube hasta 5 foto/)).toBeInTheDocument();
    });

    it("allows file input to accept only images", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      const fileInput = screen.getByLabelText(/Sube hasta 5 foto/)
        .previousElementSibling as HTMLInputElement;

      expect(fileInput.accept).toBe("image/*");
      expect(fileInput.multiple).toBe(true);
    });

    it("shows helper text about image formats and size", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Las fotos ayudan a otros compradores/)).toBeInTheDocument();
      expect(screen.getByText(/Formatos: JPG, PNG/)).toBeInTheDocument();
    });

    // Note: File upload testing requires mocking File API and URL.createObjectURL
    it("handles image file validation", () => {
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Component validates:
      // 1. Max 5 images
      // 2. Only image/* mime types
      // 3. Max 5MB per image
      expect(screen.getByText(/máx 5MB c\/u/)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Select rating
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[4]); // 5 stars

      // Fill title
      const titleInput = screen.getByLabelText("Título de la reseña *");
      await user.type(titleInput, "Excellent product!");

      // Fill content
      const contentTextarea = screen.getByLabelText("Tu reseña *");
      await user.type(
        contentTextarea,
        "This product exceeded my expectations. Highly recommended!",
      );

      // Submit
      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          rating: 5,
          title: "Excellent product!",
          content: "This product exceeded my expectations. Highly recommended!",
          images: [],
          productId: "prod-1",
          orderId: undefined,
        });
      });
    });

    it("includes orderId in submission when provided", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ReviewForm productId="prod-1" orderId="order-123" onSubmit={mockOnSubmit} />);

      // Fill form with valid data
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]);

      await user.type(screen.getByLabelText("Título de la reseña *"), "Good product");
      await user.type(
        screen.getByLabelText("Tu reseña *"),
        "Satisfied with my purchase. Good quality.",
      );

      await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: "order-123",
          }),
        );
      });
    });

    it("disables submit button while submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Fill form
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]);

      await user.type(screen.getByLabelText("Título de la reseña *"), "Title");
      await user.type(screen.getByLabelText("Tu reseña *"), "Long enough content for validation.");

      const submitButton = screen.getByRole("button", {
        name: "Publicar reseña",
      });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("shows loading state while submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Fill form
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]);

      await user.type(screen.getByLabelText("Título de la reseña *"), "Title");
      await user.type(screen.getByLabelText("Tu reseña *"), "Long enough content for validation.");

      await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

      expect(screen.getByText("Enviando...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText("Enviando...")).not.toBeInTheDocument();
      });
    });

    it("disables cancel button while submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill and submit form
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]);

      await user.type(screen.getByLabelText("Título de la reseña *"), "Title");
      await user.type(screen.getByLabelText("Tu reseña *"), "Long enough content.");

      await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

      const cancelButton = screen.getByRole("button", { name: "Cancelar" });
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it("does not submit when validation fails", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Submit without filling anything
      await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Cancel Functionality", () => {
    it("calls onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles submission error gracefully", async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error("Submission failed"));

      render(<ReviewForm productId="prod-1" onSubmit={mockOnSubmit} />);

      // Fill form
      const stars = screen.getAllByRole("button", {
        name: /Rate \d out of 5/,
      });
      await user.click(stars[3]);

      await user.type(screen.getByLabelText("Título de la reseña *"), "Title");
      await user.type(screen.getByLabelText("Tu reseña *"), "Long enough content.");

      await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
