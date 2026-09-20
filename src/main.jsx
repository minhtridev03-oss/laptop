import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import "./i18n.js";
import App from "./App.jsx";
import { CommerceProvider } from "./context/CommerceContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppErrorBoundary from "./components/system/AppErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <CommerceProvider>
            <App />
          </CommerceProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
