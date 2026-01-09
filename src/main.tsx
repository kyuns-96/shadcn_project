import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "ag-grid-community/styles/ag-theme-quartz.min.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
