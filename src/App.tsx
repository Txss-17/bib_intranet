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

// Supplier module pages
import PendingProducts from "./pages/modules/supplier/PendingProducts";
import ValidatedProducts from "./pages/modules/supplier/ValidatedProducts";
import SupplierFiles from "./pages/modules/supplier/SupplierFiles";
import Certifications from "./pages/modules/supplier/Certifications";
import DecisionHistory from "./pages/modules/supplier/DecisionHistory";
import QualityAlerts from "./pages/modules/supplier/QualityAlerts";

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
            
            {/* Supplier module with specific pages */}
            <Route path="/pole/supplier" element={<PoleDashboard />} />
            <Route path="/pole/supplier/pending" element={<PendingProducts />} />
            <Route path="/pole/supplier/validated" element={<ValidatedProducts />} />
            <Route path="/pole/supplier/suppliers" element={<SupplierFiles />} />
            <Route path="/pole/supplier/certifications" element={<Certifications />} />
            <Route path="/pole/supplier/decisions" element={<DecisionHistory />} />
            <Route path="/pole/supplier/alerts" element={<QualityAlerts />} />
            
            {/* Other pole routes with generic sub-sections */}
            <Route path="/pole/:poleId" element={<PoleDashboard />} />
            <Route path="/pole/:poleId/:subSection" element={<SubSectionPage />} />
            
            {/* Transversal modules */}
            <Route path="/modules/gateway" element={<SubSectionPage />} />
            <Route path="/modules/ethics" element={<SubSectionPage />} />
            <Route path="/modules/packaging" element={<SubSectionPage />} />
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
