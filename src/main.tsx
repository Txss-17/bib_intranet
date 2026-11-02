import { ThemeProvider } from "@/components/VolatileThemeProvider";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { purgeLegacyBrowserRecords } from "@/lib/purgeLegacyBrowserRecords";

purgeLegacyBrowserRecords();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    defaultTheme="dark"
  >
    <App />
  </ThemeProvider>,
);
