import "@testing-library/jest-dom/vitest";

// ResizeObserver polyfill for Radix UI components
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
