import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { MainLayout } from "./components/layout/MainLayout";
import { useAuthLogger } from "./hooks/useAuthLogger";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/AuthGuard";
import { SandboxProvider } from "@/hooks/useSandbox";

/* ============================================================
   AUTH / CORE
   ============================================================ */

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

import PoleDashboard from "./pages/PoleDashboard";
import SubSectionPage from "./pages/modules/SubSectionPage";

import InternalFeed from "./pages/InternalFeed";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";

import TestAccounts from "./pages/admin/TestAccounts";
import RolesPermissions from "@/pages/admin/RolesPermissions";

/* ============================================================
   COMPATIBILITY / GLOBAL AUDIT
   ============================================================ */

import ComplianceAudit from "./pages/ComplianceAudit";
import FinanceCompliance from "./pages/compliance/FinanceCompliance";
import OpsCompliance from "./pages/compliance/OpsCompliance";

/* ============================================================
   DIRECTION
   ============================================================ */

import ExecutiveDashboard from "./pages/modules/direction/ExecutiveDashboard";
import DirectionGlobal from "./pages/modules/direction/DirectionGlobal";
import StrategicKPIs from "./pages/modules/direction/StrategicKPIs";
import CriticalAlertsPage from "./pages/modules/direction/CriticalAlerts";
import DecisionArbitrage from "./pages/modules/direction/DecisionArbitrage";
import VisionRoadmap from "./pages/modules/direction/VisionRoadmap";
import GroupGovernance from "./pages/modules/direction/GroupGovernance";
import BoardReports from "./pages/modules/direction/BoardReports";

/* ============================================================
   FOURNISSEURS & PRODUITS
   ============================================================ */

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

/* ============================================================
   OPÉRATIONS & LOGISTIQUE
   ============================================================ */

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
import ShopsSupervision from "./pages/modules/ops/ShopsSupervision";


/* ============================================================
   FINANCE
   ============================================================ */

import FinanceDashboard from "./pages/modules/finance/FinanceDashboard";
import CashflowRealtime from "./pages/modules/finance/CashflowRealtime";
import Transactions from "./pages/modules/finance/Transactions";
import SupplierPayments from "./pages/modules/finance/SupplierPayments";
import Subscriptions from "./pages/modules/finance/Subscriptions";
import Salaries from "./pages/modules/finance/Salaries";
import CorporateCards from "./pages/modules/finance/CorporateCards";
import GuaranteeFund from "./pages/modules/finance/GuaranteeFund";

/* ============================================================
   MARKETPLACE & CUSTOMER
   ============================================================ */

import ActivityMonitoring from "./pages/modules/lifecycle/ActivityMonitoring";

/* ============================================================
   SUPPORT & CUSTOMER SUCCESS
   Implémentations historiques conservées temporairement
   derrière le nouveau pôle Support.
   ============================================================ */

import SupportTickets from "./pages/modules/lifecycle/SupportTickets";
import ManagedRiskAlerts from "./pages/modules/lifecycle/ManagedRiskAlerts";

/* ============================================================
   MARKETING & COMMUNICATION
   ============================================================ */

import MarketingDashboard from "./pages/modules/marketing/MarketingDashboard";
import Campaigns from "./pages/modules/marketing/Campaigns";
import Content from "./pages/modules/marketing/Content";
import Podcasts from "./pages/modules/marketing/Podcasts";
import Analytics from "./pages/modules/marketing/Analytics";

/* ============================================================
   RH
   ============================================================ */

import RHDashboard from "./pages/modules/rh/RHDashboard";
import Employees from "./pages/modules/rh/Employees";
import EmployeeFiles from "./pages/modules/rh/EmployeeFiles";
import HRAlerts from "./pages/modules/rh/HRAlerts";
import RHOnboarding from "./pages/modules/rh/Onboarding";
import Attendance from "./pages/modules/rh/Attendance";
import Leave from "./pages/modules/rh/Leave";
import Training from "./pages/modules/rh/Training";
import BusinessTrips from "./pages/modules/rh/BusinessTrips";
import Publications from "./pages/modules/rh/Publications";

/* ============================================================
   QUALITÉ & AUDIT
   ============================================================ */

import AuditDashboard from "./pages/modules/audit/AuditDashboard";
import FieldAudits from "./pages/modules/audit/FieldAudits";
import SupplierAudits from "./pages/modules/audit/SupplierAudits";
import OpsAudits from "./pages/modules/audit/OpsAudits";
import AuditReports from "./pages/modules/audit/Reports";
import NonConformities from "./pages/modules/audit/NonConformities";
import Sanctions from "./pages/modules/audit/Sanctions";

/* ============================================================
   CONFORMITÉ & JURIDIQUE
   ============================================================ */

import ComplianceDashboard from "./pages/modules/compliance/ComplianceDashboard";
import Contracts from "./pages/modules/compliance/Contracts";
import Policies from "./pages/modules/compliance/Policies";
import Disputes from "./pages/modules/compliance/Disputes";
import ComplianceRiskRegister from "./pages/modules/compliance/RiskRegister";

/* ============================================================
   RSE & IMPACT
   ============================================================ */

import RSEDashboard from "./pages/modules/rse/RSEDashboard";
import ValidatedPackaging from "./pages/modules/rse/ValidatedPackaging";
import PackagingDashboard from "./pages/modules/packaging/PackagingDashboard";
import RecyclingStats from "./pages/modules/rse/RecyclingStats";
import CustomerPoints from "./pages/modules/rse/CustomerPoints";
import CO2Impact from "./pages/modules/rse/CO2Impact";
import ESGReports from "./pages/modules/rse/ESGReports";

/* ============================================================
   PRODUIT & ENGINEERING
   Les composants historiques Tech/R&D restent utilisés comme
   implémentations internes pendant la migration fonctionnelle.
   ============================================================ */

import {
  default as ProductEngineeringDashboard,
} from "./pages/modules/tech/TechDashboard";

import {
  default as ProductInfrastructure,
} from "./pages/modules/tech/Infrastructure";

import {
  default as ProductIntegrations,
} from "./pages/modules/tech/TechIntegrations";

import {
  default as ProductDocumentation,
} from "./pages/modules/tech/TechDocumentation";

import ProductStudio from "./pages/TechStudio";

import {
  default as ProductInnovation,
} from "./pages/modules/rd/RDDashboard";

/* ============================================================
   SECURITY & IT
   Les composants historiques Tech restent utilisés comme
   implémentations internes pendant la migration fonctionnelle.
   ============================================================ */

import SecurityAccess from "./pages/modules/tech/TechAccess";
import SecurityVPN from "./pages/modules/tech/TechVPN";
import SecurityLogs from "./pages/modules/tech/TechLogs";
import SecurityEnvironments from "./pages/modules/tech/TechEnvironments";
import SecurityOperations from "./pages/modules/tech/TechSecurity";
import SecurityInfrastructure from "./pages/modules/tech/Infrastructure";

/* ============================================================
   DATA & BI
   ============================================================ */

import DataDashboard from "./pages/modules/data/DataDashboard";
import KPICatalog from "./pages/modules/data/KPICatalog";
import PublicationRequestsPage from "./pages/modules/data/PublicationRequests";
import TechBacklogPage from "./pages/modules/data/TechBacklog";
import KPIVersions from "./pages/modules/data/KPIVersions";
import DataReports from "./pages/modules/data/Reports";

import BIOverview from "./pages/modules/data/bi/BIOverview";
import BIDashboardsList from "./pages/modules/data/bi/BIDashboardsList";
import BIDesigner from "./pages/modules/data/bi/BIDesigner";
import BITemplates from "./pages/modules/data/bi/BITemplates";
import BIDataSources from "./pages/modules/data/bi/BIDataSources";
import BIWidgetLibrary from "./pages/modules/data/bi/BIWidgetLibrary";
import BIHistory from "./pages/modules/data/bi/BIHistory";

/* ============================================================
   TRANSVERSAL — ETHICS
   ============================================================ */

import EthicsDashboard from "./pages/modules/ethics/EthicsDashboard";
import EthicsReport from "./pages/modules/ethics/EthicsReport";
import EthicsReceived from "./pages/modules/ethics/EthicsReceived";
import EthicsOngoing from "./pages/modules/ethics/EthicsOngoing";
import EthicsClosed from "./pages/modules/ethics/EthicsClosed";
import EthicsStats from "./pages/modules/ethics/EthicsStats";

/* ============================================================
   TRANSVERSAL — GATEWAY
   ============================================================ */

import GatewayDashboard from "./pages/modules/gateway/GatewayDashboard";
import GatewayInbox from "./pages/modules/gateway/GatewayInbox";
import GatewayValidation from "./pages/modules/gateway/GatewayValidation";
import GatewayRouting from "./pages/modules/gateway/GatewayRouting";
import GatewayResponses from "./pages/modules/gateway/GatewayResponses";
import GatewayCompose from "./pages/modules/gateway/GatewayCompose";
import GatewayJournal from "./pages/modules/gateway/GatewayJournal";
import GatewayMessageDetail from "./pages/modules/gateway/GatewayMessageDetail";

/* ============================================================
   TRANSVERSAL — AUDIT INDÉPENDANT
   ============================================================ */

import IndependentAuditDashboard from "./pages/modules/independent-audit/IndependentAuditDashboard";
import IncidentDeclaration from "./pages/modules/independent-audit/IncidentDeclaration";
import ResolutionTracking from "./pages/modules/independent-audit/ResolutionTracking";

const queryClient = new QueryClient();

const AppInner = () => {
  useAuthLogger();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SandboxProvider>
          <AppInner />

          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              {/* ======================================================
                  PUBLIC
                  ====================================================== */}

              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* ======================================================
                  APPLICATION AUTHENTIFIÉE
                  ====================================================== */}

              <Route
                element={
                  <AuthGuard>
                    <MainLayout />
                  </AuthGuard>
                }
              >
                {/* ====================================================
                    ACCUEIL
                    ==================================================== */}

                <Route path="/" element={<Index />} />

                {/* ====================================================
                    1. DIRECTION
                    ==================================================== */}

                <Route
                  path="/pole/direction"
                  element={<ExecutiveDashboard />}
                />

                <Route
                  path="/pole/direction/global"
                  element={<DirectionGlobal />}
                />

                <Route
                  path="/pole/direction/kpi"
                  element={<StrategicKPIs />}
                />

                <Route
                  path="/pole/direction/strategic-kpis"
                  element={<StrategicKPIs />}
                />

                <Route
                  path="/pole/direction/alerts"
                  element={<CriticalAlertsPage />}
                />

                <Route
                  path="/pole/direction/critical-alerts"
                  element={<CriticalAlertsPage />}
                />

                <Route
                  path="/pole/direction/decisions"
                  element={<DecisionArbitrage />}
                />

                <Route
                  path="/pole/direction/decision-arbitrage"
                  element={<DecisionArbitrage />}
                />

                <Route
                  path="/pole/direction/vision"
                  element={<VisionRoadmap />}
                />

                <Route
                  path="/pole/direction/vision-roadmap"
                  element={<VisionRoadmap />}
                />

                <Route
                  path="/pole/direction/governance"
                  element={<GroupGovernance />}
                />

                <Route
                  path="/pole/direction/group-governance"
                  element={<GroupGovernance />}
                />

                <Route
                  path="/pole/direction/reports"
                  element={<BoardReports />}
                />

                <Route
                  path="/pole/direction/board-reports"
                  element={<BoardReports />}
                />

                <Route
                  path="/pole/direction/access"
                  element={
                    <Navigate
                      to="/admin/roles-permissions"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    2. FINANCE
                    ==================================================== */}

                <Route
                  path="/pole/finance"
                  element={<FinanceDashboard />}
                />

                <Route
                  path="/pole/finance/cashflow"
                  element={<CashflowRealtime />}
                />

                <Route
                  path="/pole/finance/transactions"
                  element={<Transactions />}
                />

                <Route
                  path="/pole/finance/supplier-payments"
                  element={<SupplierPayments />}
                />

                <Route
                  path="/pole/finance/subscriptions"
                  element={<Subscriptions />}
                />

                <Route
                  path="/pole/finance/salaries"
                  element={<Salaries />}
                />

                <Route
                  path="/pole/finance/cards"
                  element={<CorporateCards />}
                />

                <Route
                  path="/pole/finance/guarantee"
                  element={<GuaranteeFund />}
                />

                <Route
                  path="/pole/finance/billing"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/finance/payouts"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/finance/reconciliation"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    3. OPÉRATIONS & LOGISTIQUE
                    ==================================================== */}

                <Route
                  path="/pole/ops"
                  element={<OpsDashboard />}
                />

                <Route
                  path="/pole/ops/shops"
                  element={<ShopsSupervision />}
                />

                <Route
                  path="/pole/ops/pipeline"
                  element={<OrderPipeline />}
                />


                <Route
                  path="/pole/ops/orders"
                  element={<Orders />}
                />

                <Route
                  path="/pole/ops/shipments"
                  element={<Shipments />}
                />

                <Route
                  path="/pole/ops/stocks"
                  element={<DistributedStocks />}
                />

                <Route
                  path="/pole/ops/catalog"
                  element={<ProductCatalog />}
                />

                <Route
                  path="/pole/ops/partners"
                  element={<Partners />}
                />

                <Route
                  path="/pole/ops/flows"
                  element={<SyncFlows />}
                />

                <Route
                  path="/pole/ops/incidents"
                  element={<LogisticsIncidents />}
                />

                <Route
                  path="/pole/ops/replenishment"
                  element={<Replenishment />}
                />

                <Route
                  path="/pole/ops/forecast"
                  element={<DemandForecast />}
                />

                <Route
                  path="/pole/ops/thresholds"
                  element={<StockThresholds />}
                />

                <Route
                  path="/pole/ops/suppliers-lead-times"
                  element={<SupplierLeadTimes />}
                />

                <Route
                  path="/pole/ops/suppliers-lt"
                  element={<SupplierLeadTimes />}
                />

                <Route
                  path="/pole/ops/audit-link"
                  element={<AuditLink />}
                />

                {/* ====================================================
                    4. FOURNISSEURS & PRODUITS
                    ==================================================== */}

                <Route
                  path="/pole/supplier"
                  element={<SupplierDashboard />}
                />

                <Route
                  path="/pole/supplier/pending"
                  element={<PendingProducts />}
                />

                <Route
                  path="/pole/supplier/validated"
                  element={<ValidatedProducts />}
                />

                <Route
                  path="/pole/supplier/suppliers"
                  element={<SupplierFiles />}
                />

                <Route
                  path="/pole/supplier/certifications"
                  element={<Certifications />}
                />

                <Route
                  path="/pole/supplier/decisions"
                  element={<DecisionHistory />}
                />

                <Route
                  path="/pole/supplier/alerts"
                  element={<QualityAlerts />}
                />

                <Route
                  path="/pole/supplier/portfolios"
                  element={<SupplierPortfolios />}
                />

                <Route
                  path="/pole/supplier/applications"
                  element={<SupplierApplications />}
                />

                <Route
                  path="/pole/supplier/applications/:id"
                  element={<SupplierApplicationDetail />}
                />

                <Route
                  path="/pole/supplier/restock-orders"
                  element={<SupplierRestockOrders />}
                />

                <Route
                  path="/pole/supplier/catalog-inbox"
                  element={<SupplierCatalogInbox />}
                />

                {/* ====================================================
                    5. MARKETPLACE & CUSTOMER
                    ==================================================== */}

                <Route
                  path="/pole/marketplace"
                  element={<PoleDashboard />}
                />

                <Route
                  path="/pole/marketplace/products"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/stores"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/customers"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/orders"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/subscribers"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/favorites"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/rewards"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketplace/recycling"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    6. SUPPORT & CUSTOMER SUCCESS
                    ==================================================== */}

                <Route
                  path="/pole/support"
                  element={<PoleDashboard />}
                />

                <Route
                  path="/pole/support/tickets"
                  element={<SupportTickets />}
                />

                <Route
                  path="/pole/support/customer-success"
                  element={<ActivityMonitoring />}
                />

                <Route
                  path="/pole/support/monitoring"
                  element={<ActivityMonitoring />}
                />

                <Route
                  path="/pole/support/escalations"
                  element={<ManagedRiskAlerts />}
                />

                {/* ====================================================
                    7. MARKETING & COMMUNICATION
                    ==================================================== */}

                <Route
                  path="/pole/marketing"
                  element={<MarketingDashboard />}
                />

                <Route
                  path="/pole/marketing/campaigns"
                  element={<Campaigns />}
                />

                <Route
                  path="/pole/marketing/content"
                  element={<Content />}
                />

                <Route
                  path="/pole/marketing/podcasts"
                  element={<Podcasts />}
                />

                <Route
                  path="/pole/marketing/analytics"
                  element={<Analytics />}
                />

                <Route
                  path="/pole/marketing/crm"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketing/journeys"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/marketing/reputation"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    8. RH
                    ==================================================== */}

                <Route
                  path="/pole/rh"
                  element={<RHDashboard />}
                />

                <Route
                  path="/pole/rh/employees"
                  element={<Employees />}
                />

                <Route
                  path="/pole/rh/files"
                  element={<EmployeeFiles />}
                />

                <Route
                  path="/pole/rh/alerts"
                  element={<HRAlerts />}
                />

                <Route
                  path="/pole/rh/onboarding"
                  element={<RHOnboarding />}
                />

                <Route
                  path="/pole/rh/attendance"
                  element={<Attendance />}
                />

                <Route
                  path="/pole/rh/leave"
                  element={<Leave />}
                />

                <Route
                  path="/pole/rh/training"
                  element={<Training />}
                />

                <Route
                  path="/pole/rh/trips"
                  element={<BusinessTrips />}
                />

                <Route
                  path="/pole/rh/publications"
                  element={<Publications />}
                />

                <Route
                  path="/pole/rh/ethics"
                  element={
                    <Navigate
                      to="/modules/ethics"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rh/recruitment"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    9. QUALITÉ & AUDIT
                    ==================================================== */}

                <Route
                  path="/pole/audit"
                  element={<AuditDashboard />}
                />

                <Route
                  path="/pole/audit/field"
                  element={<FieldAudits />}
                />

                <Route
                  path="/pole/audit/supplier"
                  element={<SupplierAudits />}
                />

                <Route
                  path="/pole/audit/ops"
                  element={<OpsAudits />}
                />

                <Route
                  path="/pole/audit/reports"
                  element={<AuditReports />}
                />

                <Route
                  path="/pole/audit/nonconformities"
                  element={<NonConformities />}
                />

                <Route
                  path="/pole/audit/sanctions"
                  element={<Sanctions />}
                />

                <Route
                  path="/pole/audit/corrective-actions"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    10. CONFORMITÉ & JURIDIQUE
                    ==================================================== */}

                <Route
                  path="/pole/compliance"
                  element={<ComplianceDashboard />}
                />

                <Route
                  path="/pole/compliance/contracts"
                  element={<Contracts />}
                />

                <Route
                  path="/pole/compliance/policies"
                  element={<Policies />}
                />

                <Route
                  path="/pole/compliance/disputes"
                  element={<Disputes />}
                />

                <Route
                  path="/pole/compliance/risks"
                  element={<ComplianceRiskRegister />}
                />

                {/* ====================================================
                    11. RSE & IMPACT
                    ==================================================== */}

                <Route
                  path="/pole/rse"
                  element={<RSEDashboard />}
                />

                <Route
                  path="/pole/rse/packaging"
                  element={<ValidatedPackaging />}
                />

                <Route
                  path="/pole/rse/packaging-lifecycle"
                  element={<PackagingDashboard />}
                />

                <Route
                  path="/pole/rse/recycling"
                  element={<RecyclingStats />}
                />

                <Route
                  path="/pole/rse/points"
                  element={<CustomerPoints />}
                />

                <Route
                  path="/pole/rse/co2"
                  element={<CO2Impact />}
                />

                <Route
                  path="/pole/rse/esg"
                  element={<ESGReports />}
                />

                {/* ====================================================
                    12. PRODUIT & ENGINEERING
                    ==================================================== */}

                <Route
                  path="/pole/product"
                  element={<PoleDashboard />}
                />

                <Route
                  path="/pole/product/product"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/product/roadmap"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/product/backlog"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/pole/product/engineering"
                  element={<ProductEngineeringDashboard />}
                />

                <Route
                  path="/pole/product/studio"
                  element={<ProductStudio />}
                />

                <Route
                  path="/pole/product/integrations"
                  element={<ProductIntegrations />}
                />

                <Route
                  path="/pole/product/documentation"
                  element={<ProductDocumentation />}
                />

                <Route
                  path="/pole/product/innovation"
                  element={<ProductInnovation />}
                />

                {/* ====================================================
                    13. DATA & BI
                    ==================================================== */}

                <Route
                  path="/pole/data"
                  element={<DataDashboard />}
                />

                <Route
                  path="/pole/data/kpi"
                  element={<KPICatalog />}
                />

                <Route
                  path="/pole/data/requests"
                  element={<PublicationRequestsPage />}
                />

                <Route
                  path="/pole/data/backlog"
                  element={<TechBacklogPage />}
                />

                <Route
                  path="/pole/data/versions"
                  element={<KPIVersions />}
                />

                <Route
                  path="/pole/data/reports"
                  element={<DataReports />}
                />

                <Route
                  path="/pole/data/bi"
                  element={<BIOverview />}
                />

                <Route
                  path="/pole/data/bi/dashboards"
                  element={<BIDashboardsList />}
                />

                <Route
                  path="/pole/data/bi/designer/:id"
                  element={<BIDesigner />}
                />

                <Route
                  path="/pole/data/bi/templates"
                  element={<BITemplates />}
                />

                <Route
                  path="/pole/data/bi/sources"
                  element={<BIDataSources />}
                />

                <Route
                  path="/pole/data/bi/library"
                  element={<BIWidgetLibrary />}
                />

                <Route
                  path="/pole/data/bi/history/:id"
                  element={<BIHistory />}
                />

                {/* ====================================================
                    14. SECURITY & IT
                    ==================================================== */}

                <Route
                  path="/pole/security"
                  element={<SecurityOperations />}
                />

                <Route
                  path="/pole/security/access"
                  element={<SecurityAccess />}
                />

                <Route
                  path="/pole/security/security"
                  element={<SecurityOperations />}
                />

                <Route
                  path="/pole/security/infrastructure"
                  element={<SecurityInfrastructure />}
                />

                <Route
                  path="/pole/security/environments"
                  element={<SecurityEnvironments />}
                />

                <Route
                  path="/pole/security/vpn"
                  element={<SecurityVPN />}
                />

                <Route
                  path="/pole/security/logs"
                  element={<SecurityLogs />}
                />

                {/* ====================================================
                    COMPATIBILITÉ — ANCIEN PÔLE TECH
                    Les anciennes URL ne constituent plus un pôle.
                    Elles redirigent vers l'architecture cible.
                    ==================================================== */}

                <Route
                  path="/pole/tech"
                  element={
                    <Navigate
                      to="/pole/product"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/access"
                  element={
                    <Navigate
                      to="/pole/security/access"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/vpn"
                  element={
                    <Navigate
                      to="/pole/security/vpn"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/logs"
                  element={
                    <Navigate
                      to="/pole/security/logs"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/deployments"
                  element={
                    <Navigate
                      to="/pole/security/environments"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/environments"
                  element={
                    <Navigate
                      to="/pole/security/environments"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/security"
                  element={
                    <Navigate
                      to="/pole/security/security"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/infrastructure"
                  element={
                    <Navigate
                      to="/pole/security/infrastructure"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/catalog"
                  element={
                    <Navigate
                      to="/pole/product"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/received-products"
                  element={
                    <Navigate
                      to="/pole/product"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/dataflow"
                  element={
                    <Navigate
                      to="/pole/data"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/sandbox"
                  element={
                    <Navigate
                      to="/pole/product/studio"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/test-accounts"
                  element={
                    <Navigate
                      to="/pole/security/access"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/integrations"
                  element={
                    <Navigate
                      to="/pole/product/integrations"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/code"
                  element={
                    <Navigate
                      to="/pole/product/engineering"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/supervision"
                  element={
                    <Navigate
                      to="/pole/security"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/documentation"
                  element={
                    <Navigate
                      to="/pole/product/documentation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/console"
                  element={
                    <Navigate
                      to="/pole/security"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/tech/studio"
                  element={
                    <Navigate
                      to="/pole/product/studio"
                      replace
                    />
                  }
                />

                <Route
                  path="/tech-studio"
                  element={
                    <Navigate
                      to="/pole/product/studio"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    COMPATIBILITÉ — ANCIEN PÔLE LIFECYCLE
                    ==================================================== */}

                <Route
                  path="/pole/lifecycle"
                  element={
                    <Navigate
                      to="/pole/support"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/onboarding"
                  element={
                    <Navigate
                      to="/pole/rh/onboarding"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/monitoring"
                  element={
                    <Navigate
                      to="/pole/support/monitoring"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/user-accounts"
                  element={
                    <Navigate
                      to="/pole/marketplace/customers"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/risk-alerts"
                  element={
                    <Navigate
                      to="/pole/support/escalations"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/emails"
                  element={
                    <Navigate
                      to="/pole/marketing/journeys"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/trustpilot"
                  element={
                    <Navigate
                      to="/pole/marketing/reputation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/support"
                  element={
                    <Navigate
                      to="/pole/support/tickets"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/scoring"
                  element={
                    <Navigate
                      to="/pole/support/customer-success"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/lifecycle/compliance"
                  element={
                    <Navigate
                      to="/pole/compliance"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    COMPATIBILITÉ — ANCIEN PÔLE R&D
                    ==================================================== */}

                <Route
                  path="/pole/rd"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/products"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/shops"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/suppliers"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/frictions"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/reports"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                <Route
                  path="/pole/rd/tickets/:id"
                  element={
                    <Navigate
                      to="/pole/product/innovation"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    TRANSVERSAL — GATEWAY
                    ==================================================== */}

                <Route
                  path="/modules/gateway"
                  element={<GatewayDashboard />}
                />

                <Route
                  path="/modules/gateway/inbox"
                  element={<GatewayInbox />}
                />

                <Route
                  path="/modules/gateway/validation"
                  element={<GatewayValidation />}
                />

                <Route
                  path="/modules/gateway/routing"
                  element={<GatewayRouting />}
                />

                <Route
                  path="/modules/gateway/responses"
                  element={<GatewayResponses />}
                />

                <Route
                  path="/modules/gateway/compose"
                  element={<GatewayCompose />}
                />

                <Route
                  path="/modules/gateway/journal"
                  element={<GatewayJournal />}
                />

                <Route
                  path="/modules/gateway/message/:messageId"
                  element={<GatewayMessageDetail />}
                />

                <Route
                  path="/modules/gateway/:subSection"
                  element={<GatewayDashboard />}
                />

                {/* ====================================================
                    TRANSVERSAL — ÉTHIQUE
                    ==================================================== */}

                <Route
                  path="/modules/ethics"
                  element={<EthicsDashboard />}
                />

                <Route
                  path="/modules/ethics/report"
                  element={<EthicsReport />}
                />

                <Route
                  path="/modules/ethics/dashboard"
                  element={<EthicsDashboard />}
                />

                <Route
                  path="/modules/ethics/received"
                  element={<EthicsReceived />}
                />

                <Route
                  path="/modules/ethics/ongoing"
                  element={<EthicsOngoing />}
                />

                <Route
                  path="/modules/ethics/closed"
                  element={<EthicsClosed />}
                />

                <Route
                  path="/modules/ethics/stats"
                  element={<EthicsStats />}
                />

                <Route
                  path="/modules/ethics/:subSection"
                  element={<EthicsDashboard />}
                />

                {/* ====================================================
                    TRANSVERSAL — AUDIT INDÉPENDANT
                    ==================================================== */}

                <Route
                  path="/modules/independent-audit"
                  element={<IndependentAuditDashboard />}
                />

                <Route
                  path="/modules/independent-audit/declare"
                  element={<IncidentDeclaration />}
                />

                <Route
                  path="/modules/independent-audit/resolution"
                  element={<ResolutionTracking />}
                />

                {/* ====================================================
                    TRANSVERSAL — WORK
                    ==================================================== */}

                <Route
                  path="/work/tasks"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/work/projects"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/work/processes"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/work/validations"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/work/escalations"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/work/activities"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/notifications"
                  element={<SubSectionPage />}
                />

                {/* ====================================================
                    CORE TRANSVERSAL
                    ==================================================== */}

                <Route
                  path="/feed"
                  element={<InternalFeed />}
                />

                <Route
                  path="/documents"
                  element={<Documents />}
                />

                <Route
                  path="/settings"
                  element={<Settings />}
                />

                <Route
                  path="/profile"
                  element={<Profile />}
                />

                {/* ====================================================
                    ADMINISTRATION
                    ==================================================== */}

                <Route
                  path="/admin/test-accounts"
                  element={
                    <Navigate
                      to="/pole/security/access"
                      replace
                    />
                  }
                />

                <Route
                  path="/admin/roles-permissions"
                  element={<RolesPermissions />}
                />

                <Route
                  path="/permissions"
                  element={
                    <Navigate
                      to="/admin/roles-permissions"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    COMPATIBILITÉ — AUDIT GLOBAL
                    ==================================================== */}

                <Route
                  path="/compliance-audit"
                  element={<ComplianceAudit />}
                />

                <Route
                  path="/compliance-audit/finance"
                  element={<FinanceCompliance />}
                />

                <Route
                  path="/compliance-audit/ops"
                  element={<OpsCompliance />}
                />

                <Route
                  path="/compliance-audit/tech"
                  element={
                    <Navigate
                      to="/pole/security"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    COMPATIBILITÉ — WHAT'S NEW
                    ==================================================== */}

                <Route
                  path="/whats-new"
                  element={
                    <Navigate
                      to="/feed?tab=news"
                      replace
                    />
                  }
                />

                {/* ====================================================
                    ROUTES GÉNÉRIQUES
                    ==================================================== */}

                <Route
                  path="/pole/:poleId"
                  element={<PoleDashboard />}
                />

                <Route
                  path="/pole/:poleId/:subSection"
                  element={<SubSectionPage />}
                />

                <Route
                  path="/modules/:moduleId/:subSection"
                  element={<SubSectionPage />}
                />
              </Route>

              {/* ======================================================
                  404
                  ====================================================== */}

              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </BrowserRouter>
        </SandboxProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
