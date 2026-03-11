import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  cleanup();
});

describe("ErrorBoundary", () => {
  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders fallback UI when child component throws an error", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getAllByText("Something went wrong")[0]).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
  });

  it("resets error state when retry button is clicked", () => {
    let shouldThrow = true;

    const ConditionalError = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>Success content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getAllByText("Something went wrong")[0]).toBeInTheDocument();

    shouldThrow = false;
    const retryButton = screen.getByRole("button", { name: /Try again/ });
    fireEvent.click(retryButton);

    rerender(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Success content")).toBeInTheDocument();
  });

  it("displays error details in a collapsible section", () => {
    const ThrowError = () => {
      throw new Error("Detailed test error message");
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const detailsSummaries = screen.getAllByText("Error details");
    expect(detailsSummaries[0]).toBeInTheDocument();
    expect(screen.getByText(/Detailed test error message/)).toBeInTheDocument();
  });
});
