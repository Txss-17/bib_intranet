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
import EthicsModule from "./pages/EthicsModule";
import GatewayModule from "./pages/GatewayModule";
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
            <Route path="/pole/:poleId" element={<PoleDashboard />} />
            <Route path="/feed" element={<InternalFeed />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/modules/ethics" element={<EthicsModule />} />
            <Route path="/modules/gateway" element={<GatewayModule />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
