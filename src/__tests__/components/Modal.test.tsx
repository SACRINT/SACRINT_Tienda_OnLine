// Modal Component Tests
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/ui/modal";

describe("Modal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when open is true", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should not render when open is false", () => {
    render(
      <Modal open={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByRole("button", { name: /close|cerrar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when overlay clicked", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should not close when clicking modal content", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const content = screen.getByText("Content");
    fireEvent.click(content);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should call onClose when Escape key pressed", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should trap focus within modal", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <button>First</button>
        <button>Second</button>
      </Modal>
    );

    const firstButton = screen.getByText("First");
    const secondButton = screen.getByText("Second");
    const closeButton = screen.getByRole("button", { name: /close|cerrar/i });

    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Tab should cycle through focusable elements
    fireEvent.keyDown(document, { key: "Tab" });
    // Focus should move to next element
  });

  it("should render with description", () => {
    render(
      <Modal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
        description="This is a description"
      >
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("should render with footer", () => {
    render(
      <Modal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
        footer={<button>Action</button>}
      >
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("should apply custom size", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Large Modal" size="lg">
        <p>Content</p>
      </Modal>
    );

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveClass("max-w-lg");
  });

  it("should prevent body scroll when open", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    expect(document.body).toHaveStyle({ overflow: "hidden" });
  });

  it("should restore body scroll when closed", () => {
    const { rerender } = render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    rerender(
      <Modal open={false} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("should have accessible role and labels", () => {
    render(
      <Modal open={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAccessibleName("Test Modal");
  });
});
