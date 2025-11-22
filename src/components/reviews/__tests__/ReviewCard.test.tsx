/**
 * ReviewCard Component Tests
 * Tests review display, voting, and actions functionality
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewCard } from "../ReviewCard";

const mockReview = {
  id: "review-1",
  rating: 4.5,
  title: "Great product!",
  content: "This is an excellent product. Highly recommend it to everyone.",
  images: [],
  verifiedPurchase: true,
  helpfulCount: 10,
  notHelpfulCount: 2,
  createdAt: new Date("2024-01-15"),
  sellerResponse: null,
  sellerResponseAt: null,
  user: {
    id: "user-1",
    name: "John Doe",
    image: "https://example.com/avatar.jpg",
  },
};

describe("ReviewCard", () => {
  describe("Basic Rendering", () => {
    it("renders review title and content", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText("Great product!")).toBeInTheDocument();
      expect(
        screen.getByText("This is an excellent product. Highly recommend it to everyone."),
      ).toBeInTheDocument();
    });

    it("renders user name", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders user avatar with correct src", () => {
      render(<ReviewCard review={mockReview} />);

      const avatar = screen.getByRole("img", { hidden: true });
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });

    it("renders fallback initial when user has no image", () => {
      const reviewWithoutImage = {
        ...mockReview,
        user: { ...mockReview.user, image: null },
      };

      render(<ReviewCard review={reviewWithoutImage} />);

      expect(screen.getByText("J")).toBeInTheDocument(); // First letter of name
    });

    it("renders default user name when name is null", () => {
      const reviewWithoutName = {
        ...mockReview,
        user: { ...mockReview.user, name: null },
      };

      render(<ReviewCard review={reviewWithoutName} />);

      expect(screen.getByText("Usuario")).toBeInTheDocument();
    });

    it("renders verified purchase badge when verified", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText("Compra verificada")).toBeInTheDocument();
    });

    it("does not render verified purchase badge when not verified", () => {
      const unverifiedReview = {
        ...mockReview,
        verifiedPurchase: false,
      };

      render(<ReviewCard review={unverifiedReview} />);

      expect(screen.queryByText("Compra verificada")).not.toBeInTheDocument();
    });

    it("renders rating stars", () => {
      render(<ReviewCard review={mockReview} />);

      // RatingDisplay should show the rating value
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("renders relative time", () => {
      render(<ReviewCard review={mockReview} />);

      // Should render "hace X tiempo" in Spanish
      expect(screen.getByText(/hace/)).toBeInTheDocument();
    });
  });

  describe("Review Images", () => {
    it("renders review images when present", () => {
      const reviewWithImages = {
        ...mockReview,
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      };

      render(<ReviewCard review={reviewWithImages} />);

      const images = screen.getAllByRole("img", { hidden: true });
      // Filter out avatar image
      const reviewImages = images.filter((img) =>
        img.getAttribute("alt")?.includes("Review image"),
      );

      expect(reviewImages).toHaveLength(2);
    });

    it("does not render image section when no images", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.queryByAltText(/Review image/)).not.toBeInTheDocument();
    });

    it("renders correct number of images", () => {
      const reviewWithImages = {
        ...mockReview,
        images: ["img1.jpg", "img2.jpg", "img3.jpg"],
      };

      render(<ReviewCard review={reviewWithImages} />);

      expect(screen.getByAltText("Review image 1")).toBeInTheDocument();
      expect(screen.getByAltText("Review image 2")).toBeInTheDocument();
      expect(screen.getByAltText("Review image 3")).toBeInTheDocument();
    });
  });

  describe("Voting Functionality", () => {
    it("renders helpful and not helpful buttons with counts", () => {
      const onVote = jest.fn();
      render(<ReviewCard review={mockReview} onVote={onVote} />);

      expect(screen.getByText("¿Útil?")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Helpful count
      expect(screen.getByText("2")).toBeInTheDocument(); // Not helpful count
    });

    it("calls onVote with HELPFUL when helpful button clicked", async () => {
      const onVote = jest.fn().mockResolvedValue(undefined);
      render(<ReviewCard review={mockReview} onVote={onVote} />);

      const buttons = screen.getAllByRole("button");
      const helpfulButton = buttons.find((btn) => btn.textContent?.includes("10"));

      fireEvent.click(helpfulButton!);

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith("review-1", "HELPFUL");
      });
    });

    it("calls onVote with NOT_HELPFUL when not helpful button clicked", async () => {
      const onVote = jest.fn().mockResolvedValue(undefined);
      render(<ReviewCard review={mockReview} onVote={onVote} />);

      const buttons = screen.getAllByRole("button");
      const notHelpfulButton = buttons.find((btn) => btn.textContent?.includes("2"));

      fireEvent.click(notHelpfulButton!);

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith("review-1", "NOT_HELPFUL");
      });
    });

    it("updates helpful count optimistically after voting", async () => {
      const onVote = jest.fn().mockResolvedValue(undefined);
      render(<ReviewCard review={mockReview} onVote={onVote} />);

      const buttons = screen.getAllByRole("button");
      const helpfulButton = buttons.find((btn) => btn.textContent?.includes("10"));

      fireEvent.click(helpfulButton!);

      await waitFor(() => {
        expect(screen.getByText("11")).toBeInTheDocument(); // Incremented
      });
    });

    it("disables voting buttons while voting is in progress", async () => {
      const onVote = jest
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<ReviewCard review={mockReview} onVote={onVote} />);

      const buttons = screen.getAllByRole("button");
      const helpfulButton = buttons.find((btn) => btn.textContent?.includes("10"));

      fireEvent.click(helpfulButton!);

      expect(helpfulButton).toBeDisabled();

      await waitFor(() => {
        expect(helpfulButton).not.toBeDisabled();
      });
    });

    it("does not render voting section when onVote not provided", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.queryByText("¿Útil?")).not.toBeInTheDocument();
    });
  });

  describe("Actions Menu", () => {
    it("renders actions menu when showActions is true", () => {
      render(<ReviewCard review={mockReview} showActions />);

      const menuButton = screen.getByRole("button", { name: "" });
      expect(menuButton).toBeInTheDocument();
    });

    it("does not render actions menu when showActions is false", () => {
      render(<ReviewCard review={mockReview} showActions={false} />);

      // Should not find the MoreVertical button
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(0); // No actions, no vote buttons
    });

    it("shows delete option for own review", async () => {
      const onDelete = jest.fn();
      render(
        <ReviewCard review={mockReview} currentUserId="user-1" onDelete={onDelete} showActions />,
      );

      const menuButton = screen.getByRole("button", { name: "" });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText("Eliminar reseña")).toBeInTheDocument();
      });
    });

    it("shows report option for other users reviews", async () => {
      const onReport = jest.fn();
      render(
        <ReviewCard review={mockReview} currentUserId="user-2" onReport={onReport} showActions />,
      );

      const menuButton = screen.getByRole("button", { name: "" });
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText("Reportar reseña")).toBeInTheDocument();
      });
    });

    it("calls onDelete when delete menu item clicked", async () => {
      const onDelete = jest.fn();
      render(
        <ReviewCard review={mockReview} currentUserId="user-1" onDelete={onDelete} showActions />,
      );

      const menuButton = screen.getByRole("button", { name: "" });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const deleteItem = screen.getByText("Eliminar reseña");
        fireEvent.click(deleteItem);
      });

      expect(onDelete).toHaveBeenCalledWith("review-1");
    });

    it("calls onReport when report menu item clicked", async () => {
      const onReport = jest.fn();
      render(
        <ReviewCard review={mockReview} currentUserId="user-2" onReport={onReport} showActions />,
      );

      const menuButton = screen.getByRole("button", { name: "" });
      fireEvent.click(menuButton);

      await waitFor(() => {
        const reportItem = screen.getByText("Reportar reseña");
        fireEvent.click(reportItem);
      });

      expect(onReport).toHaveBeenCalledWith("review-1");
    });
  });

  describe("Seller Response", () => {
    it("renders seller response when present", () => {
      const reviewWithResponse = {
        ...mockReview,
        sellerResponse: "Thank you for your feedback!",
        sellerResponseAt: new Date("2024-01-20"),
      };

      render(<ReviewCard review={reviewWithResponse} />);

      expect(screen.getByText("Respuesta del vendedor")).toBeInTheDocument();
      expect(screen.getByText("Thank you for your feedback!")).toBeInTheDocument();
    });

    it("does not render seller response section when not present", () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.queryByText("Respuesta del vendedor")).not.toBeInTheDocument();
    });

    it("renders seller response timestamp", () => {
      const reviewWithResponse = {
        ...mockReview,
        sellerResponse: "Thank you!",
        sellerResponseAt: new Date("2024-01-20"),
      };

      render(<ReviewCard review={reviewWithResponse} />);

      // Should render relative time for seller response
      const timeElements = screen.getAllByText(/hace/);
      expect(timeElements.length).toBeGreaterThan(1); // Review time + response time
    });
  });

  describe("Date Handling", () => {
    it("handles createdAt as Date object", () => {
      const review = {
        ...mockReview,
        createdAt: new Date("2024-01-15"),
      };

      render(<ReviewCard review={review} />);

      expect(screen.getByText(/hace/)).toBeInTheDocument();
    });

    it("handles createdAt as string", () => {
      const review = {
        ...mockReview,
        createdAt: "2024-01-15T00:00:00.000Z",
      };

      render(<ReviewCard review={review} />);

      expect(screen.getByText(/hace/)).toBeInTheDocument();
    });

    it("handles sellerResponseAt as Date object", () => {
      const review = {
        ...mockReview,
        sellerResponse: "Thanks!",
        sellerResponseAt: new Date("2024-01-20"),
      };

      render(<ReviewCard review={review} />);

      const timeElements = screen.getAllByText(/hace/);
      expect(timeElements.length).toBe(2);
    });

    it("handles sellerResponseAt as string", () => {
      const review = {
        ...mockReview,
        sellerResponse: "Thanks!",
        sellerResponseAt: "2024-01-20T00:00:00.000Z",
      };

      render(<ReviewCard review={review} />);

      const timeElements = screen.getAllByText(/hace/);
      expect(timeElements.length).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles review with empty images array", () => {
      const review = {
        ...mockReview,
        images: [],
      };

      render(<ReviewCard review={review} />);

      expect(screen.queryByAltText(/Review image/)).not.toBeInTheDocument();
    });

    it("handles review with no user image", () => {
      const review = {
        ...mockReview,
        user: {
          ...mockReview.user,
          image: null,
        },
      };

      render(<ReviewCard review={review} />);

      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("handles zero helpful and not helpful counts", () => {
      const onVote = jest.fn();
      const review = {
        ...mockReview,
        helpfulCount: 0,
        notHelpfulCount: 0,
      };

      render(<ReviewCard review={review} onVote={onVote} />);

      const zeroCountElements = screen.getAllByText("0");
      expect(zeroCountElements.length).toBe(2);
    });

    it("handles very long review content", () => {
      const longContent = "A".repeat(5000);
      const review = {
        ...mockReview,
        content: longContent,
      };

      render(<ReviewCard review={review} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("handles special characters in title and content", () => {
      const review = {
        ...mockReview,
        title: "Great product! 🎉 100% satisfied",
        content: "Amazing quality & fast shipping. 5/5 stars ⭐",
      };

      render(<ReviewCard review={review} />);

      expect(screen.getByText("Great product! 🎉 100% satisfied")).toBeInTheDocument();
      expect(screen.getByText("Amazing quality & fast shipping. 5/5 stars ⭐")).toBeInTheDocument();
    });
  });
});
