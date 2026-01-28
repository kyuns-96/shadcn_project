import type { PropsWithChildren } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      _placeholder: (state = null) => state,
    } as any,
    preloadedState: preloadedState as any,
  });
};

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof createTestStore>;
}

const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), store };
};

export { renderWithProviders, createTestStore };
