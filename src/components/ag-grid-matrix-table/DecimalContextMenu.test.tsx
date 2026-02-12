import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { DecimalContextMenu } from "./DecimalContextMenu";

describe("DecimalContextMenu", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    groupName: "Test Group",
    currentDecimal: 2,
    onDecimalChange: vi.fn(),
    position: { x: 100, y: 200 },
    onClose: vi.fn(),
  };

  it("renders group name and current decimal value", () => {
    render(<DecimalContextMenu {...defaultProps} />);
    
    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onDecimalChange with incremented value when + clicked", () => {
    render(<DecimalContextMenu {...defaultProps} />);
    
    const plusButton = screen.getByRole("button", { name: /increase/i });
    fireEvent.click(plusButton);
    
    expect(defaultProps.onDecimalChange).toHaveBeenCalledWith(3);
  });

  it("calls onDecimalChange with decremented value when - clicked", () => {
    render(<DecimalContextMenu {...defaultProps} />);
    
    const minusButton = screen.getByRole("button", { name: /decrease/i });
    fireEvent.click(minusButton);
    
    expect(defaultProps.onDecimalChange).toHaveBeenCalledWith(1);
  });

  it("disables - button when decimal is 0", () => {
    render(<DecimalContextMenu {...defaultProps} currentDecimal={0} />);
    
    const minusButton = screen.getByRole("button", { name: /decrease/i });
    expect(minusButton).toBeDisabled();
  });

  it("disables + button when decimal is 10", () => {
    render(<DecimalContextMenu {...defaultProps} currentDecimal={10} />);
    
    const plusButton = screen.getByRole("button", { name: /increase/i });
    expect(plusButton).toBeDisabled();
  });

  it("calls onClose when clicking outside menu", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <DecimalContextMenu {...defaultProps} />
      </div>
    );
    
    fireEvent.mouseDown(screen.getByTestId("outside"));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders at the correct position", () => {
    const { container } = render(<DecimalContextMenu {...defaultProps} />);
    
    // The fixed positioning is applied to the root element. 
    // We can check style, though testing-library focuses on accessibility/user-visible.
    const menu = container.firstChild as HTMLElement;
    expect(menu).toHaveClass("fixed");
    expect(menu.style.left).toBe("100px");
    expect(menu.style.top).toBe("200px");
  });
});
