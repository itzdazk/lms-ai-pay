import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure dark mode is applied
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

// Simple test without AuthProvider
createRoot(document.getElementById("root")!).render(
  <App />
);