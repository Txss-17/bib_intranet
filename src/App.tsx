import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { useAuthLogger } from "./hooks/useAuthLogger";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/AuthGuard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";
import Index from "./pages/Index";
import PoleDashboard from "./pages/PoleDashboard";
import SubSectionPage from "./pages/modules/SubSectionPage";
import InternalFeed from "./pages/InternalFeed";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import PermissionsMatrix from "./pages/PermissionsMatrix";
import ComplianceAudit from "./pages/ComplianceAudit";
import FinanceCompliance from "./pages/compliance/FinanceCompliance";
import OpsCompliance from "./pages/compliance/OpsCompliance";
import TechCompliance from "./pages/compliance/TechCompliance";
import StrategicKPIs from "./pages/modules/direction/StrategicKPIs";
import CriticalAlertsPage from "./pages/modules/direction/CriticalAlerts";
import ActivityMonitoring from "./pages/modules/lifecycle/ActivityMonitoring";
import RiskScoring from "./pages/modules/lifecycle/RiskScoring";
import DataDashboard from "./pages/modules/data/DataDashboard";
import KPICatalog from "./pages/modules/data/KPICatalog";
import PublicationRequestsPage from "./pages/modules/data/PublicationRequests";
import TechBacklogPage from "./pages/modules/data/TechBacklog";
import KPIVersions from "./pages/modules/data/KPIVersions";
import BIOverview from "./pages/modules/data/bi/BIOverview";
import BIDashboardsList from "./pages/modules/data/bi/BIDashboardsList";
import BIDesigner from "./pages/modules/data/bi/BIDesigner";
import BITemplates from "./pages/modules/data/bi/BITemplates";
import BIDataSources from "./pages/modules/data/bi/BIDataSources";
import BIWidgetLibrary from "./pages/modules/data/bi/BIWidgetLibrary";
import BIHistory from "./pages/modules/data/bi/BIHistory";
// WhatsNew merged into InternalFeed (/feed?tab=news)
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import EthicsDashboard from "./pages/modules/ethics/EthicsDashboard";
import EthicsReport from "./pages/modules/ethics/EthicsReport";
import RDDashboard from "./pages/modules/rd/RDDashboard";
import RDProducts from "./pages/modules/rd/RDProducts";
import RDShops from "./pages/modules/rd/RDShops";
import RDSuppliers from "./pages/modules/rd/RDSuppliers";
import RDFrictions from "./pages/modules/rd/RDFrictions";
import RDReports from "./pages/modules/rd/RDReports";
import RDTicketDetail from "./pages/modules/rd/RDTicketDetail";
import GatewayDashboard from "./pages/modules/gateway/GatewayDashboard";
import PackagingDashboard from "./pages/modules/packaging/PackagingDashboard";
import ModuleAccess from "./pages/modules/direction/ModuleAccess";
import LifecycleOnboarding from "./pages/modules/lifecycle/Onboarding";
import ComplianceStatusPage from "./pages/modules/lifecycle/ComplianceStatus";

// Supplier module pages
import SupplierDashboard from "./pages/modules/supplier/SupplierDashboard";
import PendingProducts from "./pages/modules/supplier/PendingProducts";
import ValidatedProducts from "./pages/modules/supplier/ValidatedProducts";
import SupplierFiles from "./pages/modules/supplier/SupplierFiles";
import Certifications from "./pages/modules/supplier/Certifications";
import DecisionHistory from "./pages/modules/supplier/DecisionHistory";
import QualityAlerts from "./pages/modules/supplier/QualityAlerts";
import SupplierPortfolios from "./pages/modules/supplier/SupplierPortfolios";
import SupplierApplications from "./pages/modules/supplier/SupplierApplications";
import SupplierApplicationDetail from "./pages/modules/supplier/SupplierApplicationDetail";
import SupplierRestockOrders from "./pages/modules/supplier/SupplierRestockOrders";
import SupplierCatalogInbox from "./pages/modules/supplier/SupplierCatalogInbox";


// Ops module pages
import OpsDashboard from "./pages/modules/ops/OpsDashboard";
import Orders from "./pages/modules/ops/Orders";
import Shipments from "./pages/modules/ops/Shipments";
import LogisticsIncidents from "./pages/modules/ops/LogisticsIncidents";
import Partners from "./pages/modules/ops/Partners";
import DistributedStocks from "./pages/modules/ops/DistributedStocks";
import ProductCatalog from "./pages/modules/ops/ProductCatalog";
import SyncFlows from "./pages/modules/ops/SyncFlows";
import Replenishment from "./pages/modules/ops/Replenishment";
import OrderPipeline from "./pages/modules/ops/OrderPipeline";
import AuditLink from "./pages/modules/ops/AuditLink";
import DemandForecast from "./pages/modules/ops/DemandForecast";
import StockThresholds from "./pages/modules/ops/StockThresholds";
import SupplierLeadTimes from "./pages/modules/ops/SupplierLeadTimes";

// Direction module pages
import ExecutiveDashboard from "./pages/modules/direction/ExecutiveDashboard";
import VisionRoadmap from "./pages/modules/direction/VisionRoadmap";
import DecisionArbitrage from "./pages/modules/direction/DecisionArbitrage";
import GroupGovernance from "./pages/modules/direction/GroupGovernance";
import ConsolidatedReports from "./pages/modules/direction/ConsolidatedReports";
import BoardReports from "./pages/modules/direction/BoardReports";
import ManagedRiskAlerts from "./pages/modules/lifecycle/ManagedRiskAlerts";
import LifecycleEmailCampaignsPage from "./pages/modules/lifecycle/LifecycleEmailCampaigns";
import IndependentAuditDashboard from "./pages/modules/independent-audit/IndependentAuditDashboard";
import IncidentDeclaration from "./pages/modules/independent-audit/IncidentDeclaration";
import ResolutionTracking from "./pages/modules/independent-audit/ResolutionTracking";

// Lifecycle module pages
import LifecycleDashboard from "./pages/modules/lifecycle/LifecycleDashboard";
import UserAccounts from "./pages/modules/lifecycle/UserAccounts";
import RiskAlerts from "./pages/modules/lifecycle/RiskAlerts";
import EmailCampaigns from "./pages/modules/lifecycle/EmailCampaigns";
import TrustpilotAnalytics from "./pages/modules/lifecycle/TrustpilotAnalytics";
import SupportTickets from "./pages/modules/lifecycle/SupportTickets";

// Finance module pages
import FinanceDashboard from "./pages/modules/finance/FinanceDashboard";
import CashflowRealtime from "./pages/modules/finance/CashflowRealtime";
import Transactions from "./pages/modules/finance/Transactions";
import SupplierPayments from "./pages/modules/finance/SupplierPayments";
import Subscriptions from "./pages/modules/finance/Subscriptions";
import Salaries from "./pages/modules/finance/Salaries";
import GuaranteeFund from "./pages/modules/finance/GuaranteeFund";

// Tech module pages
import TechDashboard from "./pages/modules/tech/TechDashboard";
import Deployments from "./pages/modules/tech/Deployments";
import Infrastructure from "./pages/modules/tech/Infrastructure";
import Security from "./pages/modules/tech/Security";
import Catalog from "./pages/modules/tech/Catalog";
import ReceivedProducts from "./pages/modules/tech/ReceivedProducts";
import TechAccess from "./pages/modules/tech/TechAccess";
import TechVPN from "./pages/modules/tech/TechVPN";
import TechLogs from "./pages/modules/tech/TechLogs";
import TechEnvironments from "./pages/modules/tech/TechEnvironments";
import TechSecurity from "./pages/modules/tech/TechSecurity";
import TechDataFlow from "./pages/modules/tech/TechDataFlow";
import DirectionGlobal from "./pages/modules/direction/DirectionGlobal";
import BusinessTrips from "./pages/modules/rh/BusinessTrips";
import CorporateCards from "./pages/modules/finance/CorporateCards";

// RH module pages
import RHDashboard from "./pages/modules/rh/RHDashboard";
import Employees from "./pages/modules/rh/Employees";
import RHOnboarding from "./pages/modules/rh/Onboarding";
import Attendance from "./pages/modules/rh/Attendance";
import Leave from "./pages/modules/rh/Leave";
import Training from "./pages/modules/rh/Training";
import Publications from "./pages/modules/rh/Publications";
import EmployeeFiles from "./pages/modules/rh/EmployeeFiles";
import HRAlerts from "./pages/modules/rh/HRAlerts";
import RHEthics from "./pages/modules/rh/RHEthics";

// Audit module pages
import AuditDashboard from "./pages/modules/audit/AuditDashboard";
import FieldAudits from "./pages/modules/audit/FieldAudits";
import SupplierAudits from "./pages/modules/audit/SupplierAudits";
import OpsAudits from "./pages/modules/audit/OpsAudits";
import AuditReports from "./pages/modules/audit/Reports";
import NonConformities from "./pages/modules/audit/NonConformities";
import Sanctions from "./pages/modules/audit/Sanctions";

// Compliance module pages
import ComplianceDashboard from "./pages/modules/compliance/ComplianceDashboard";
import Contracts from "./pages/modules/compliance/Contracts";
import Policies from "./pages/modules/compliance/Policies";
import Disputes from "./pages/modules/compliance/Disputes";
import ComplianceRiskRegister from "./pages/modules/compliance/RiskRegister";

// RSE module pages
import RSEDashboard from "./pages/modules/rse/RSEDashboard";
import ValidatedPackaging from "./pages/modules/rse/ValidatedPackaging";
import RecyclingStats from "./pages/modules/rse/RecyclingStats";
import CustomerPoints from "./pages/modules/rse/CustomerPoints";
import CO2Impact from "./pages/modules/rse/CO2Impact";
import ESGReports from "./pages/modules/rse/ESGReports";

// Marketing module pages
import MarketingDashboard from "./pages/modules/marketing/MarketingDashboard";
import Campaigns from "./pages/modules/marketing/Campaigns";
import Content from "./pages/modules/marketing/Content";
import Podcasts from "./pages/modules/marketing/Podcasts";
import Analytics from "./pages/modules/marketing/Analytics";


// Risk module removed

// Ethics sub-section pages
import EthicsReceived from "./pages/modules/ethics/EthicsReceived";
import EthicsOngoing from "./pages/modules/ethics/EthicsOngoing";
import EthicsClosed from "./pages/modules/ethics/EthicsClosed";
import EthicsStats from "./pages/modules/ethics/EthicsStats";

// Gateway sub-section pages
import GatewayInbox from "./pages/modules/gateway/GatewayInbox";
import GatewayValidation from "./pages/modules/gateway/GatewayValidation";
import GatewayRouting from "./pages/modules/gateway/GatewayRouting";
import GatewayResponses from "./pages/modules/gateway/GatewayResponses";
import GatewayCompose from "./pages/modules/gateway/GatewayCompose";
import GatewayJournal from "./pages/modules/gateway/GatewayJournal";
import GatewayMessageDetail from "./pages/modules/gateway/GatewayMessageDetail";

const queryClient = new QueryClient();

const AppInner = () => {
  useAuthLogger();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppInner />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
            <Route path="/" element={<Index />} />
            
            {/* Direction module */}
            <Route path="/pole/direction" element={<ExecutiveDashboard />} />
            <Route path="/pole/direction/global" element={<DirectionGlobal />} />
            <Route path="/pole/direction/kpi" element={<StrategicKPIs />} />
            <Route path="/pole/direction/alerts" element={<CriticalAlertsPage />} />
            <Route path="/pole/direction/decisions" element={<DecisionArbitrage />} />
            <Route path="/pole/direction/vision" element={<VisionRoadmap />} />
            <Route path="/pole/direction/governance" element={<GroupGovernance />} />
            <Route path="/pole/direction/reports" element={<BoardReports />} />
            <Route path="/pole/direction/reports-legacy" element={<ConsolidatedReports />} />
            <Route path="/pole/direction/access" element={<ModuleAccess />} />
            
            {/* Supplier module */}
            <Route path="/pole/supplier" element={<SupplierDashboard />} />
            <Route path="/pole/supplier/pending" element={<PendingProducts />} />
            <Route path="/pole/supplier/validated" element={<ValidatedProducts />} />
            <Route path="/pole/supplier/suppliers" element={<SupplierFiles />} />
            <Route path="/pole/supplier/certifications" element={<Certifications />} />
            <Route path="/pole/supplier/decisions" element={<DecisionHistory />} />
            <Route path="/pole/supplier/alerts" element={<QualityAlerts />} />
            <Route path="/pole/supplier/portfolios" element={<SupplierPortfolios />} />
            <Route path="/pole/supplier/applications" element={<SupplierApplications />} />
            <Route path="/pole/supplier/applications/:id" element={<SupplierApplicationDetail />} />
            <Route path="/pole/supplier/restock-orders" element={<SupplierRestockOrders />} />
            <Route path="/pole/supplier/catalog-inbox" element={<SupplierCatalogInbox />} />

            
            {/* Lifecycle (User Success & Risk) module */}
            <Route path="/pole/lifecycle" element={<LifecycleDashboard />} />
            <Route path="/pole/lifecycle/onboarding" element={<LifecycleOnboarding />} />
            <Route path="/pole/lifecycle/monitoring" element={<ActivityMonitoring />} />
            <Route path="/pole/lifecycle/user-accounts" element={<UserAccounts />} />
            <Route path="/pole/lifecycle/risk-alerts" element={<ManagedRiskAlerts />} />
            <Route path="/pole/lifecycle/risk-alerts-legacy" element={<RiskAlerts />} />
            <Route path="/pole/lifecycle/emails" element={<LifecycleEmailCampaignsPage />} />
            <Route path="/pole/lifecycle/emails-legacy" element={<EmailCampaigns />} />
            <Route path="/pole/lifecycle/trustpilot" element={<TrustpilotAnalytics />} />
            <Route path="/pole/lifecycle/support" element={<SupportTickets />} />
            <Route path="/pole/lifecycle/scoring" element={<RiskScoring />} />
            <Route path="/pole/lifecycle/compliance" element={<ComplianceStatusPage />} />
            
            {/* Finance module */}
            <Route path="/pole/finance" element={<FinanceDashboard />} />
            <Route path="/pole/finance/cashflow" element={<CashflowRealtime />} />
            <Route path="/pole/finance/transactions" element={<Transactions />} />
            <Route path="/pole/finance/supplier-payments" element={<SupplierPayments />} />
            <Route path="/pole/finance/subscriptions" element={<Subscriptions />} />
            <Route path="/pole/finance/salaries" element={<Salaries />} />
            <Route path="/pole/finance/cards" element={<CorporateCards />} />
            <Route path="/pole/finance/guarantee" element={<GuaranteeFund />} />
            
            {/* Ops Control Tower */}
            <Route path="/pole/ops" element={<OpsDashboard />} />
            <Route path="/pole/ops/pipeline" element={<OrderPipeline />} />
            <Route path="/pole/ops/stocks" element={<DistributedStocks />} />
            <Route path="/pole/ops/catalog" element={<ProductCatalog />} />
            <Route path="/pole/ops/partners" element={<Partners />} />
            <Route path="/pole/ops/flows" element={<SyncFlows />} />
            <Route path="/pole/ops/incidents" element={<LogisticsIncidents />} />
            <Route path="/pole/ops/replenishment" element={<Replenishment />} />
            <Route path="/pole/ops/forecast" element={<DemandForecast />} />
            <Route path="/pole/ops/thresholds" element={<StockThresholds />} />
            <Route path="/pole/ops/suppliers-lead-times" element={<SupplierLeadTimes />} />
            <Route path="/pole/ops/audit-link" element={<AuditLink />} />
            {/* Legacy routes (rétro-compat) */}
            <Route path="/pole/ops/orders" element={<Orders />} />
            <Route path="/pole/ops/shipments" element={<Shipments />} />
            
            {/* Tech module */}
            <Route path="/pole/tech" element={<TechDashboard />} />
            <Route path="/pole/tech/access" element={<TechAccess />} />
            <Route path="/pole/tech/vpn" element={<TechVPN />} />
            <Route path="/pole/tech/logs" element={<TechLogs />} />
            <Route path="/pole/tech/deployments" element={<Deployments />} />
            <Route path="/pole/tech/environments" element={<TechEnvironments />} />
            <Route path="/pole/tech/security" element={<TechSecurity />} />
            <Route path="/pole/tech/dataflow" element={<TechDataFlow />} />
            <Route path="/pole/tech/infrastructure" element={<Infrastructure />} />
            <Route path="/pole/tech/catalog" element={<Catalog />} />
            <Route path="/pole/tech/received-products" element={<ReceivedProducts />} />
            
            {/* RH module */}
            <Route path="/pole/rh" element={<RHDashboard />} />
            <Route path="/pole/rh/employees" element={<Employees />} />
            <Route path="/pole/rh/files" element={<EmployeeFiles />} />
            <Route path="/pole/rh/alerts" element={<HRAlerts />} />
            <Route path="/pole/rh/onboarding" element={<RHOnboarding />} />
            <Route path="/pole/rh/attendance" element={<Attendance />} />
            <Route path="/pole/rh/leave" element={<Leave />} />
            <Route path="/pole/rh/training" element={<Training />} />
            <Route path="/pole/rh/trips" element={<BusinessTrips />} />
            <Route path="/pole/rh/publications" element={<Publications />} />
            <Route path="/pole/rh/ethics" element={<RHEthics />} />
            
            {/* Audit module */}
            <Route path="/pole/audit" element={<AuditDashboard />} />
            <Route path="/pole/audit/field" element={<FieldAudits />} />
            <Route path="/pole/audit/supplier" element={<SupplierAudits />} />
            <Route path="/pole/audit/ops" element={<OpsAudits />} />
            <Route path="/pole/audit/reports" element={<AuditReports />} />
            <Route path="/pole/audit/nonconformities" element={<NonConformities />} />
            <Route path="/pole/audit/sanctions" element={<Sanctions />} />
            
            {/* Compliance module */}
            <Route path="/pole/compliance" element={<ComplianceDashboard />} />
            <Route path="/pole/compliance/contracts" element={<Contracts />} />
            <Route path="/pole/compliance/policies" element={<Policies />} />
            <Route path="/pole/compliance/disputes" element={<Disputes />} />
            <Route path="/pole/compliance/risks" element={<ComplianceRiskRegister />} />
            
            {/* RSE module */}
            <Route path="/pole/rse" element={<RSEDashboard />} />
            <Route path="/pole/rse/packaging" element={<ValidatedPackaging />} />
            <Route path="/pole/rse/packaging-lifecycle" element={<PackagingDashboard />} />
            <Route path="/pole/rse/recycling" element={<RecyclingStats />} />
            <Route path="/pole/rse/points" element={<CustomerPoints />} />
            <Route path="/pole/rse/co2" element={<CO2Impact />} />
            <Route path="/pole/rse/esg" element={<ESGReports />} />
            
            {/* Marketing module */}
            <Route path="/pole/marketing" element={<MarketingDashboard />} />
            
            <Route path="/pole/marketing/campaigns" element={<Campaigns />} />
            <Route path="/pole/marketing/content" element={<Content />} />
            <Route path="/pole/marketing/podcasts" element={<Podcasts />} />
            <Route path="/pole/marketing/analytics" element={<Analytics />} />
            
            
            {/* Other pole routes with generic sub-sections */}
            <Route path="/pole/:poleId" element={<PoleDashboard />} />
            <Route path="/pole/:poleId/:subSection" element={<SubSectionPage />} />
            
            {/* R&D pole */}
            <Route path="/pole/rd" element={<RDDashboard />} />
            <Route path="/pole/rd/products" element={<RDProducts />} />
            <Route path="/pole/rd/shops" element={<RDShops />} />
            <Route path="/pole/rd/suppliers" element={<RDSuppliers />} />
            <Route path="/pole/rd/frictions" element={<RDFrictions />} />
            <Route path="/pole/rd/reports" element={<RDReports />} />
            <Route path="/pole/rd/tickets/:id" element={<RDTicketDetail />} />
            
            {/* Transversal modules */}
            <Route path="/modules/gateway" element={<GatewayDashboard />} />
            <Route path="/modules/gateway/inbox" element={<GatewayInbox />} />
            <Route path="/modules/gateway/validation" element={<GatewayValidation />} />
            <Route path="/modules/gateway/routing" element={<GatewayRouting />} />
            <Route path="/modules/gateway/responses" element={<GatewayResponses />} />
            <Route path="/modules/gateway/compose" element={<GatewayCompose />} />
            <Route path="/modules/gateway/journal" element={<GatewayJournal />} />
            <Route path="/modules/gateway/message/:messageId" element={<GatewayMessageDetail />} />
            <Route path="/modules/gateway/:subSection" element={<GatewayDashboard />} />
            <Route path="/modules/ethics" element={<EthicsReport />} />
            <Route path="/modules/ethics/dashboard" element={<EthicsDashboard />} />
            <Route path="/modules/ethics/received" element={<EthicsReceived />} />
            <Route path="/modules/ethics/ongoing" element={<EthicsOngoing />} />
            <Route path="/modules/ethics/closed" element={<EthicsClosed />} />
            <Route path="/modules/ethics/stats" element={<EthicsStats />} />
            <Route path="/modules/ethics/:subSection" element={<EthicsDashboard />} />
            <Route path="/modules/independent-audit" element={<IndependentAuditDashboard />} />
            <Route path="/modules/independent-audit/declare" element={<IncidentDeclaration />} />
            <Route path="/modules/independent-audit/resolution" element={<ResolutionTracking />} />
            <Route path="/modules/:moduleId/:subSection" element={<SubSectionPage />} />
            
            {/* Other routes */}
            <Route path="/feed" element={<InternalFeed />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/permissions" element={<PermissionsMatrix />} />
            <Route path="/compliance-audit" element={<ComplianceAudit />} />
            <Route path="/compliance-audit/finance" element={<FinanceCompliance />} />
            <Route path="/compliance-audit/ops" element={<OpsCompliance />} />
            <Route path="/compliance-audit/tech" element={<TechCompliance />} />
            <Route path="/pole/data" element={<DataDashboard />} />
            <Route path="/pole/data/kpi" element={<KPICatalog />} />
            <Route path="/pole/data/requests" element={<PublicationRequestsPage />} />
            <Route path="/pole/data/backlog" element={<TechBacklogPage />} />
            <Route path="/pole/data/versions" element={<KPIVersions />} />
            <Route path="/pole/data/bi" element={<BIOverview />} />
            <Route path="/pole/data/bi/dashboards" element={<BIDashboardsList />} />
            <Route path="/pole/data/bi/designer/:id" element={<BIDesigner />} />
            <Route path="/pole/data/bi/templates" element={<BITemplates />} />
            <Route path="/pole/data/bi/sources" element={<BIDataSources />} />
            <Route path="/pole/data/bi/library" element={<BIWidgetLibrary />} />
            <Route path="/pole/data/bi/history/:id" element={<BIHistory />} />
            <Route path="/whats-new" element={<Navigate to="/feed?tab=news" replace />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
