import type { PropsWithChildren } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import graphReducer, { type GraphState } from "@/store/reducers/graphSlice";

export type TestRootState = { graph: GraphState };

const createTestStore = (preloadedState?: { graph?: Partial<GraphState> }) => {
  return configureStore({
    reducer: {
      graph: graphReducer,
    },
    preloadedState: preloadedState as { graph: GraphState } | undefined,
  });
};

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: { graph?: Partial<GraphState> };
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
