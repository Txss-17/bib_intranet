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

// Direction module pages
import ExecutiveDashboard from "./pages/modules/direction/ExecutiveDashboard";
import VisionRoadmap from "./pages/modules/direction/VisionRoadmap";
import DecisionArbitrage from "./pages/modules/direction/DecisionArbitrage";
import GroupGovernance from "./pages/modules/direction/GroupGovernance";
import ConsolidatedReports from "./pages/modules/direction/ConsolidatedReports";

// Lifecycle module pages
import LifecycleDashboard from "./pages/modules/lifecycle/LifecycleDashboard";
import UserAccounts from "./pages/modules/lifecycle/UserAccounts";
import RiskAlerts from "./pages/modules/lifecycle/RiskAlerts";
import EmailCampaigns from "./pages/modules/lifecycle/EmailCampaigns";
import TrustpilotAnalytics from "./pages/modules/lifecycle/TrustpilotAnalytics";
import SupportTickets from "./pages/modules/lifecycle/SupportTickets";

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
            
            {/* Direction module */}
            <Route path="/pole/direction" element={<ExecutiveDashboard />} />
            <Route path="/pole/direction/kpi" element={<ExecutiveDashboard />} />
            <Route path="/pole/direction/alerts" element={<ExecutiveDashboard />} />
            <Route path="/pole/direction/decisions" element={<DecisionArbitrage />} />
            <Route path="/pole/direction/vision" element={<VisionRoadmap />} />
            <Route path="/pole/direction/governance" element={<GroupGovernance />} />
            <Route path="/pole/direction/reports" element={<ConsolidatedReports />} />
            
            {/* Supplier module */}
            <Route path="/pole/supplier" element={<PoleDashboard />} />
            <Route path="/pole/supplier/pending" element={<PendingProducts />} />
            <Route path="/pole/supplier/validated" element={<ValidatedProducts />} />
            <Route path="/pole/supplier/suppliers" element={<SupplierFiles />} />
            <Route path="/pole/supplier/certifications" element={<Certifications />} />
            <Route path="/pole/supplier/decisions" element={<DecisionHistory />} />
            <Route path="/pole/supplier/alerts" element={<QualityAlerts />} />
            
            {/* Lifecycle (User Success & Risk) module */}
            <Route path="/pole/lifecycle" element={<LifecycleDashboard />} />
            <Route path="/pole/lifecycle/onboarding" element={<SubSectionPage />} />
            <Route path="/pole/lifecycle/monitoring" element={<UserAccounts />} />
            <Route path="/pole/lifecycle/user-accounts" element={<UserAccounts />} />
            <Route path="/pole/lifecycle/risk-alerts" element={<RiskAlerts />} />
            <Route path="/pole/lifecycle/emails" element={<EmailCampaigns />} />
            <Route path="/pole/lifecycle/trustpilot" element={<TrustpilotAnalytics />} />
            <Route path="/pole/lifecycle/support" element={<SupportTickets />} />
            <Route path="/pole/lifecycle/scoring" element={<RiskAlerts />} />
            <Route path="/pole/lifecycle/compliance" element={<SubSectionPage />} />
            
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
