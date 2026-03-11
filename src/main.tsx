import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "ag-grid-community/styles/ag-theme-quartz.min.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store.ts";

async function enableMocking() {
  if (import.meta.env.VITE_MSW_ENABLED !== 'true') {
    return;
  }
  
  const { worker } = await import('./mocks/browser');
  
  return worker.start({
    onUnhandledRequest: 'error',
  });
}

enableMocking()
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <Provider store={store}>
          <App />
        </Provider>
      </StrictMode>
    );
  })
  .catch((error) => console.error("MSW initialization failed:", error));
