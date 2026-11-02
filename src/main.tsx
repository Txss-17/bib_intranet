import { ThemeProvider } from "@/components/VolatileThemeProvider";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    defaultTheme="dark"
  >
    <App />
  </ThemeProvider>,
);
