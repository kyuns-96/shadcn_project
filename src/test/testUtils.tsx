import type { PropsWithChildren } from "react";
import { render, type RenderOptions, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import graphReducer, { type GraphState } from "@/store/reducers/graphSlice";
import matrixReducer from "@/store/matrixSlice";
import doeRegistryReducer from "@/store/doeRegistry";
import datasetReducer from "@/store/reducers/datasetReducer";
import selectedReducer from "@/store/reducers/selectedReducer";
import { afterEach } from "vitest";

export interface TestRootState {
  graph: GraphState;
  matrix: ReturnType<typeof matrixReducer>;
  doeRegistry: ReturnType<typeof doeRegistryReducer>;
  dataset: ReturnType<typeof datasetReducer>;
  selected: ReturnType<typeof selectedReducer>;
}

const createTestStore = (preloadedState?: Partial<TestRootState>) => {
  return configureStore({
    reducer: {
      graph: graphReducer,
      matrix: matrixReducer,
      doeRegistry: doeRegistryReducer,
      dataset: datasetReducer,
      selected: selectedReducer,
    },
    preloadedState: preloadedState as TestRootState | undefined,
  });
};

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<TestRootState>;
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

afterEach(() => {
  cleanup();
});

export { renderWithProviders, createTestStore };

