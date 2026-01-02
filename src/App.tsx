import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import PoleDashboard from "./pages/PoleDashboard";
import InternalFeed from "./pages/InternalFeed";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FinanceModule from "./pages/modules/FinanceModule";
import AuditModule from "./pages/modules/AuditModule";
import RSEModule from "./pages/modules/RSEModule";
import OpsModule from "./pages/modules/OpsModule";
import SupplierModule from "./pages/modules/SupplierModule";
import ComplianceModule from "./pages/modules/ComplianceModule";
import LifecycleModule from "./pages/modules/LifecycleModule";
import EthicsModule from "./pages/modules/EthicsModule";
import MarketingModule from "./pages/modules/MarketingModule";
import HRModule from "./pages/modules/HRModule";
import TechModule from "./pages/modules/TechModule";
import SupportModule from "./pages/modules/SupportModule";
import DirectionModule from "./pages/modules/DirectionModule";

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
            <Route path="/pole/:poleId" element={<PoleDashboard />} />
            <Route path="/feed" element={<InternalFeed />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/modules/finance" element={<FinanceModule />} />
            <Route path="/modules/audit" element={<AuditModule />} />
            <Route path="/modules/rse" element={<RSEModule />} />
            <Route path="/modules/ops" element={<OpsModule />} />
            <Route path="/modules/supplier" element={<SupplierModule />} />
            <Route path="/modules/compliance" element={<ComplianceModule />} />
            <Route path="/modules/lifecycle" element={<LifecycleModule />} />
            <Route path="/modules/ethics" element={<EthicsModule />} />
            <Route path="/modules/marketing" element={<MarketingModule />} />
            <Route path="/modules/hr" element={<HRModule />} />
            <Route path="/modules/tech" element={<TechModule />} />
            <Route path="/modules/support" element={<SupportModule />} />
            <Route path="/modules/direction" element={<DirectionModule />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
