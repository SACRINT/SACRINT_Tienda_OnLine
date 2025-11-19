// SearchBar Component Tests
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "@/components/features/search/SearchBar";

// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SearchBar", () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    expect(input).toBeInTheDocument();
  });

  it("should update input value on change", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "test query" } });

    expect(input).toHaveValue("test query");
  });

  it("should call onSearch when form submitted", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.submit(input);

    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("should call onSearch when Enter is pressed", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("should trim whitespace from query", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "  test  " } });
    fireEvent.submit(input);

    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("should not submit empty query", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.submit(input);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it("should clear input when clear button clicked", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "test" } });

    const clearButton = screen.getByRole("button", { name: /clear|limpiar/i });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("should show clear button when input has value", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);

    // Clear button should be hidden initially
    expect(screen.queryByRole("button", { name: /clear|limpiar/i })).not.toBeVisible();

    fireEvent.change(input, { target: { value: "test" } });

    // Clear button should appear
    expect(screen.getByRole("button", { name: /clear|limpiar/i })).toBeVisible();
  });

  it("should show suggestions when typing", async () => {
    const suggestions = ["suggestion 1", "suggestion 2"];
    render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "sug" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("suggestion 1")).toBeInTheDocument();
      expect(screen.getByText("suggestion 2")).toBeInTheDocument();
    });
  });

  it("should select suggestion on click", async () => {
    const suggestions = ["suggestion 1"];
    render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "sug" } });
    fireEvent.focus(input);

    await waitFor(() => {
      const suggestion = screen.getByText("suggestion 1");
      fireEvent.click(suggestion);
    });

    expect(input).toHaveValue("suggestion 1");
    expect(mockOnSearch).toHaveBeenCalledWith("suggestion 1");
  });

  it("should navigate suggestions with keyboard", async () => {
    const suggestions = ["suggestion 1", "suggestion 2"];
    render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "sug" } });
    fireEvent.focus(input);

    await waitFor(() => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(mockOnSearch).toHaveBeenCalledWith("suggestion 1");
  });

  it("should close suggestions on escape", async () => {
    const suggestions = ["suggestion 1"];
    render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);

    const input = screen.getByPlaceholderText(/buscar|search/i);
    fireEvent.change(input, { target: { value: "sug" } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("suggestion 1")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("suggestion 1")).not.toBeInTheDocument();
    });
  });

  it("should have accessible label", () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByRole("searchbox");
    expect(input).toHaveAccessibleName();
  });
});
