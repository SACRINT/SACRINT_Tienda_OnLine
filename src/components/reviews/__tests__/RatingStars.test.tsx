/**
 * RatingStars Component Tests
 * Tests display-only and interactive star rating functionality
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { RatingStars, RatingDisplay, RatingPicker } from "../RatingStars";

describe("RatingStars", () => {
  describe("Display Mode (Non-interactive)", () => {
    it("renders correct number of stars based on maxRating", () => {
      render(<RatingStars rating={3} maxRating={5} />);
      const stars = screen.getAllByRole("button");
      expect(stars).toHaveLength(5);
    });

    it("renders 5 stars by default when maxRating not specified", () => {
      render(<RatingStars rating={3} />);
      const stars = screen.getAllByRole("button");
      expect(stars).toHaveLength(5);
    });

    it("displays rating value correctly", () => {
      render(<RatingStars rating={4.2} />);
      expect(screen.getByText("4.2")).toBeInTheDocument();
    });

    it("displays review count when showCount is true", () => {
      render(<RatingStars rating={4.5} showCount count={123} />);
      expect(screen.getByText("(123)")).toBeInTheDocument();
    });

    it("formats large review counts with locale", () => {
      render(<RatingStars rating={4.5} showCount count={12345} />);
      expect(screen.getByText("(12,345)")).toBeInTheDocument();
    });

    it("does not display count when showCount is false", () => {
      render(<RatingStars rating={4.5} showCount={false} count={123} />);
      expect(screen.queryByText("(123)")).not.toBeInTheDocument();
    });

    it("renders with correct size class for small", () => {
      const { container } = render(<RatingStars rating={3} size="sm" />);
      const star = container.querySelector("svg");
      expect(star).toHaveClass("h-4", "w-4");
    });

    it("renders with correct size class for medium", () => {
      const { container } = render(<RatingStars rating={3} size="md" />);
      const star = container.querySelector("svg");
      expect(star).toHaveClass("h-5", "w-5");
    });

    it("renders with correct size class for large", () => {
      const { container } = render(<RatingStars rating={3} size="lg" />);
      const star = container.querySelector("svg");
      expect(star).toHaveClass("h-6", "w-6");
    });

    it("renders half stars correctly for decimal ratings", () => {
      render(<RatingStars rating={3.5} />);
      // Half star should be rendered for the 4th star (3.5 rounds up to 4)
      expect(screen.getByText("3.5")).toBeInTheDocument();
    });

    it("handles zero rating", () => {
      render(<RatingStars rating={0} />);
      expect(screen.getByText("0.0")).toBeInTheDocument();
    });

    it("handles maximum rating", () => {
      render(<RatingStars rating={5} />);
      expect(screen.getByText("5.0")).toBeInTheDocument();
    });
  });

  describe("Interactive Mode", () => {
    it("calls onChange when star is clicked", () => {
      const handleChange = jest.fn();
      render(<RatingStars rating={0} interactive onChange={handleChange} />);

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[2]); // Click 3rd star

      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it("does not call onChange when not interactive", () => {
      const handleChange = jest.fn();
      render(<RatingStars rating={0} onChange={handleChange} />);

      const stars = screen.getAllByRole("button");
      fireEvent.click(stars[2]);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it("shows hover feedback in interactive mode", () => {
      render(<RatingStars rating={2} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");
      fireEvent.mouseEnter(stars[3]); // Hover over 4th star

      expect(screen.getByText("4 / 5")).toBeInTheDocument();
    });

    it("clears hover feedback on mouse leave", () => {
      render(<RatingStars rating={2} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");
      fireEvent.mouseEnter(stars[3]);
      expect(screen.getByText("4 / 5")).toBeInTheDocument();

      fireEvent.mouseLeave(stars[3]);
      expect(screen.queryByText("4 / 5")).not.toBeInTheDocument();
    });

    it("does not show hover feedback when not interactive", () => {
      render(<RatingStars rating={2} />);

      const stars = screen.getAllByRole("button");
      fireEvent.mouseEnter(stars[3]);

      expect(screen.queryByText("4 / 5")).not.toBeInTheDocument();
    });

    it("disables stars when not interactive", () => {
      render(<RatingStars rating={3} />);

      const stars = screen.getAllByRole("button");
      stars.forEach((star) => {
        expect(star).toBeDisabled();
      });
    });

    it("enables stars when interactive", () => {
      render(<RatingStars rating={3} interactive onChange={jest.fn()} />);

      const stars = screen.getAllByRole("button");
      stars.forEach((star) => {
        expect(star).not.toBeDisabled();
      });
    });

    it("hides rating text in interactive mode", () => {
      render(<RatingStars rating={3.5} interactive onChange={jest.fn()} />);

      expect(screen.queryByText("3.5")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has correct aria-labels for each star", () => {
      render(<RatingStars rating={3} maxRating={5} />);

      expect(screen.getByRole("button", { name: "Rate 1 out of 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate 2 out of 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate 3 out of 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate 4 out of 5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate 5 out of 5" })).toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
      const { container } = render(<RatingStars rating={3} className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Edge Cases", () => {
    it("handles rating greater than maxRating", () => {
      render(<RatingStars rating={10} maxRating={5} />);
      expect(screen.getByText("10.0")).toBeInTheDocument();
    });

    it("handles negative rating", () => {
      render(<RatingStars rating={-1} />);
      expect(screen.getByText("-1.0")).toBeInTheDocument();
    });

    it("handles decimal maxRating", () => {
      render(<RatingStars rating={3} maxRating={4.5} />);
      const stars = screen.getAllByRole("button");
      expect(stars).toHaveLength(4); // Floor to 4
    });
  });
});

describe("RatingDisplay", () => {
  it("renders in display-only mode", () => {
    render(<RatingDisplay rating={4.5} />);

    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows count when provided", () => {
    render(<RatingDisplay rating={4.5} count={99} />);

    expect(screen.getByText("(99)")).toBeInTheDocument();
  });

  it("does not show count when not provided", () => {
    render(<RatingDisplay rating={4.5} />);

    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it("uses small size by default", () => {
    const { container } = render(<RatingDisplay rating={4.5} />);
    const star = container.querySelector("svg");
    expect(star).toHaveClass("h-4", "w-4");
  });

  it("all stars are disabled", () => {
    render(<RatingDisplay rating={4.5} />);

    const stars = screen.getAllByRole("button");
    stars.forEach((star) => {
      expect(star).toBeDisabled();
    });
  });
});

describe("RatingPicker", () => {
  it("renders in interactive mode", () => {
    const handleChange = jest.fn();
    render(<RatingPicker value={3} onChange={handleChange} />);

    const stars = screen.getAllByRole("button");
    stars.forEach((star) => {
      expect(star).not.toBeDisabled();
    });
  });

  it("calls onChange when clicked", () => {
    const handleChange = jest.fn();
    render(<RatingPicker value={3} onChange={handleChange} />);

    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[4]); // Click 5th star

    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it("shows hover feedback", () => {
    const handleChange = jest.fn();
    render(<RatingPicker value={2} onChange={handleChange} />);

    const stars = screen.getAllByRole("button");
    fireEvent.mouseEnter(stars[3]);

    expect(screen.getByText("4 / 5")).toBeInTheDocument();
  });

  it("uses large size by default", () => {
    const { container } = render(<RatingPicker value={3} onChange={jest.fn()} />);
    const star = container.querySelector("svg");
    expect(star).toHaveClass("h-6", "w-6");
  });

  it("does not show rating text", () => {
    render(<RatingPicker value={3.5} onChange={jest.fn()} />);

    expect(screen.queryByText("3.5")).not.toBeInTheDocument();
  });
});
