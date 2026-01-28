import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Smoke Tests", () => {
  it("renders a basic React component", () => {
    render(<div>Hello, World!</div>);
    expect(screen.getByText("Hello, World!")).toBeInTheDocument();
  });

  it("has jsdom globals available", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
    expect(typeof navigator).toBe("object");
  });

  it("resolves @/ path alias correctly", async () => {
    const { cn } = await import("@/lib/utils");
    expect(typeof cn).toBe("function");
  });
});
