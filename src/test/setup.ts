import "@testing-library/jest-dom/vitest";

// ResizeObserver polyfill for Radix UI components
class ResizeObserverMock implements ResizeObserver {
  private callback: ResizeObserverCallback | undefined;
  private readonly observedElements = new Set<Element>();
  private readonly observedOptionsByElement = new Map<
    Element,
    ResizeObserverOptions | undefined
  >();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    if (this.callback) {
      this.observedElements.add(target);
      this.observedOptionsByElement.set(target, options);
    }
  }

  unobserve(target: Element): void {
    this.observedElements.delete(target);
    this.observedOptionsByElement.delete(target);
  }

  disconnect(): void {
    if (this.callback) {
      this.observedElements.clear();
      this.observedOptionsByElement.clear();
    }
  }
}

globalThis.ResizeObserver = ResizeObserverMock;
