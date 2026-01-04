import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import PoleDashboard from "./pages/PoleDashboard";
import SubSectionPage from "./pages/modules/SubSectionPage";
import InternalFeed from "./pages/InternalFeed";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            {/* Pole routes with dynamic sub-sections */}
            <Route path="/pole/:poleId" element={<PoleDashboard />} />
            <Route path="/pole/:poleId/:subSection" element={<SubSectionPage />} />
            {/* Transversal modules */}
            <Route path="/modules/gateway" element={<div>Gateway Module</div>} />
            <Route path="/modules/ethics" element={<div>Ethics Module</div>} />
            <Route path="/modules/packaging" element={<div>Packaging Module</div>} />
            <Route path="/modules/:moduleId/:subSection" element={<SubSectionPage />} />
            {/* Other routes */}
            <Route path="/feed" element={<InternalFeed />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
