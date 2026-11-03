import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { MainLayout } from "./components/layout/MainLayout";
import { AuthGuard } from "./components/AuthGuard";
import { useAuthLogger } from "./hooks/useAuthLogger";
import { AuthProvider } from "./hooks/useAuth";
import { SandboxProvider } from "@/hooks/useSandbox";
import { ProtectedPage } from "./components/PermissionGate";

/* ============================================================
   CORE / AUTH
   ============================================================ */

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const PoleDashboard = lazy(() => import("./pages/PoleDashboard"));
const SubSectionPage = lazy(() => import("./pages/modules/SubSectionPage"));

const InternalFeed = lazy(() => import("./pages/InternalFeed"));
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';
const Documents = lazy(() => import("./pages/Documents"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));

const RolesPermissions = lazy(() => import("@/pages/admin/RolesPermissions"));

/* ============================================================
   GLOBAL AUDIT
   ============================================================ */

const ComplianceAudit = lazy(() => import("./pages/ComplianceAudit"));
const FinanceCompliance = lazy(() => import("./pages/compliance/FinanceCompliance"));
const OpsCompliance = lazy(() => import("./pages/compliance/OpsCompliance"));

/* ============================================================
   1. DIRECTION
   ============================================================ */

const ExecutiveDashboard = lazy(() => import("./pages/modules/direction/ExecutiveDashboard"));
const DirectionGlobal = lazy(() => import("./pages/modules/direction/DirectionGlobal"));
const StrategicKPIs = lazy(() => import("./pages/modules/direction/StrategicKPIs"));
const CriticalAlertsPage = lazy(() => import("./pages/modules/direction/CriticalAlerts"));
const DecisionArbitrage = lazy(() => import("./pages/modules/direction/DecisionArbitrage"));
const VisionRoadmap = lazy(() => import("./pages/modules/direction/VisionRoadmap"));
const GroupGovernance = lazy(() => import("./pages/modules/direction/GroupGovernance"));
const BoardReports = lazy(() => import("./pages/modules/direction/BoardReports"));

/* ============================================================
   2. FINANCE
   ============================================================ */

const FinanceDashboard = lazy(() => import("./pages/modules/finance/FinanceDashboard"));
const CashflowRealtime = lazy(() => import("./pages/modules/finance/CashflowRealtime"));
const Transactions = lazy(() => import("./pages/modules/finance/Transactions"));
const SupplierPayments = lazy(() => import("./pages/modules/finance/SupplierPayments"));
const Subscriptions = lazy(() => import("./pages/modules/finance/Subscriptions"));
const Salaries = lazy(() => import("./pages/modules/finance/Salaries"));
const CorporateCards = lazy(() => import("./pages/modules/finance/CorporateCards"));
const GuaranteeFund = lazy(() => import("./pages/modules/finance/GuaranteeFund"));
const Reconciliation = lazy(() => import("./pages/modules/finance/Reconciliation"));

/* ============================================================
   3. OPÉRATIONS & LOGISTIQUE
   ============================================================ */

const OpsDashboard = lazy(() => import("./pages/modules/ops/OpsDashboard"));
const Orders = lazy(() => import("./pages/modules/ops/Orders"));
const Shipments = lazy(() => import("./pages/modules/ops/Shipments"));
const LogisticsIncidents = lazy(() => import("./pages/modules/ops/LogisticsIncidents"));
const Partners = lazy(() => import("./pages/modules/ops/Partners"));
const DistributedStocks = lazy(() => import("./pages/modules/ops/DistributedStocks"));
const ProductCatalog = lazy(() => import("./pages/modules/ops/ProductCatalog"));
const ProductLifecycle = lazy(() => import("./pages/modules/ops/ProductLifecycle"));
const SyncFlows = lazy(() => import("./pages/modules/ops/SyncFlows"));
const Replenishment = lazy(() => import("./pages/modules/ops/Replenishment"));
const OrderPipeline = lazy(() => import("./pages/modules/ops/OrderPipeline"));
const AuditLink = lazy(() => import("./pages/modules/ops/AuditLink"));
const DemandForecast = lazy(() => import("./pages/modules/ops/DemandForecast"));
const StockThresholds = lazy(() => import("./pages/modules/ops/StockThresholds"));
const SupplierLeadTimes = lazy(() => import("./pages/modules/ops/SupplierLeadTimes"));
const ShopsSupervision = lazy(() => import("./pages/modules/ops/ShopsSupervision"));
const Anomalies = lazy(() => import("./pages/modules/ops/Anomalies"));
const ShopDetail = lazy(() => import("./pages/modules/ops/ShopDetail"));

/* ============================================================
   WORK / TRANSVERSAL OPERATIONS
   ============================================================ */

const WorkTasks = lazy(() => import("./pages/modules/work/WorkTasks"));
const WorkProjects = lazy(() => import("./pages/modules/work/WorkProjects"));
const WorkProcesses = lazy(() => import("./pages/modules/work/WorkProcesses"));
const WorkValidations = lazy(() => import("./pages/modules/work/WorkValidations"));
const WorkEscalations = lazy(() => import("./pages/modules/work/WorkEscalations"));
const WorkActivities = lazy(() => import("./pages/modules/work/WorkActivities"));

/* ============================================================
   4. FOURNISSEURS & PRODUITS
   ============================================================ */

const SupplierDashboard = lazy(() => import("./pages/modules/supplier/SupplierDashboard"));
const PendingProducts = lazy(() => import("./pages/modules/supplier/PendingProducts"));
const ValidatedProducts = lazy(() => import("./pages/modules/supplier/ValidatedProducts"));
const SupplierFiles = lazy(() => import("./pages/modules/supplier/SupplierFiles"));
const Certifications = lazy(() => import("./pages/modules/supplier/Certifications"));
const DecisionHistory = lazy(() => import("./pages/modules/supplier/DecisionHistory"));
const QualityAlerts = lazy(() => import("./pages/modules/supplier/QualityAlerts"));
const SupplierPortfolios = lazy(() => import("./pages/modules/supplier/SupplierPortfolios"));
const SupplierApplications = lazy(() => import("./pages/modules/supplier/SupplierApplications"));
const SupplierApplicationDetail = lazy(() => import("./pages/modules/supplier/SupplierApplicationDetail"));
const SupplierRestockOrders = lazy(() => import("./pages/modules/supplier/SupplierRestockOrders"));
const SupplierCatalogInbox = lazy(() => import("./pages/modules/supplier/SupplierCatalogInbox"));

/* ============================================================
   5. MARKETPLACE & CUSTOMER
   ============================================================ */

const MarketplaceDashboard = lazy(() => import("./pages/modules/marketplace/MarketplaceDashboard"));
const MerchantPortfolio = lazy(() => import("./pages/modules/marketplace/MerchantPortfolio"));
const MerchantDetail = lazy(() => import("./pages/modules/marketplace/MerchantDetail"));
const MarketplaceStoreDetail = lazy(() => import("./pages/modules/marketplace/MarketplaceStoreDetail"));
const MarketplaceStores = lazy(() => import("./pages/modules/marketplace/MarketplaceStores"));
const MarketplaceOpportunities = lazy(() => import("./pages/modules/marketplace/MarketplaceOpportunities"));
const MarketplaceAnalytics = lazy(() => import("./pages/modules/marketplace/MarketplaceAnalytics"));
const MarketplaceProducts = lazy(() => import("./pages/modules/marketplace/MarketplaceProducts"));
const MarketplaceCustomers = lazy(() => import("./pages/modules/marketplace/MarketplaceCustomers"));
const MarketplaceSubscriptions = lazy(() => import("./pages/modules/marketplace/MarketplaceSubscriptions"));
const MarketplaceFavorites = lazy(() => import("./pages/modules/marketplace/MarketplaceFavorites"));
const MarketplaceOrders = lazy(() => import("./pages/modules/marketplace/MarketplaceOrders"));
const MarketplaceSubscribers = lazy(() => import("./pages/modules/marketplace/MarketplaceSubscribers"));

/* ============================================================
   6. SUPPORT & CUSTOMER SUCCESS
   ============================================================ */

const SupportTickets = lazy(() => import("./pages/modules/support/SupportTickets"));
const CustomerSuccess = lazy(() => import("./pages/modules/support/CustomerSucces"));
const SupportMonitoring = lazy(() => import("./pages/modules/support/SupportMonitoring"));
const SupportEscalations = lazy(() => import("./pages/modules/support/SupportEscalations"));

/* ============================================================
   7. MARKETING & COMMUNICATION
   ============================================================ */

const MarketingDashboard = lazy(() => import("./pages/modules/marketing/MarketingDashboard"));
const Campaigns = lazy(() => import("./pages/modules/marketing/Campaigns"));
const Content = lazy(() => import("./pages/modules/marketing/Content"));
const Podcasts = lazy(() => import("./pages/modules/marketing/Podcasts"));
const Analytics = lazy(() => import("./pages/modules/marketing/Analytics"));

/* ============================================================
   8. RH
   ============================================================ */

const RHDashboard = lazy(() => import("./pages/modules/rh/RHDashboard"));
const Employees = lazy(() => import("./pages/modules/rh/Employees"));
const EmployeeFiles = lazy(() => import("./pages/modules/rh/EmployeeFiles"));
const HRAlerts = lazy(() => import("./pages/modules/rh/HRAlerts"));
const RHOnboarding = lazy(() => import("./pages/modules/rh/Onboarding"));
const Billing = lazy(() => import("./pages/modules/finance/Billing"));
const Attendance = lazy(() => import("./pages/modules/rh/Attendance"));
const Leave = lazy(() => import("./pages/modules/rh/Leave"));
const Training = lazy(() => import("./pages/modules/rh/Training"));
const BusinessTrips = lazy(() => import("./pages/modules/rh/BusinessTrips"));
const Publications = lazy(() => import("./pages/modules/rh/Publications"));
const RHPortfolio = lazy(() => import("./pages/modules/rh/RHPortfolio"));
const Organization = lazy(() => import("./pages/modules/rh/Oraganization"));
const RHAccess = lazy(() => import("./pages/modules/rh/RHAccess"));
const Recruitment = lazy(() => import("./pages/modules/rh/Recruitment"));

/* ============================================================
   9. QUALITÉ & AUDIT
   ============================================================ */

const AuditDashboard = lazy(() => import("./pages/modules/audit/AuditDashboard"));
const FieldAudits = lazy(() => import("./pages/modules/audit/FieldAudits"));
const AuditMissions = lazy(() => import("./pages/modules/audit/AuditMissions"));
const SupplierAudits = lazy(() => import("./pages/modules/audit/SupplierAudits"));
const OpsAudits = lazy(() => import("./pages/modules/audit/OpsAudits"));
const AuditReports = lazy(() => import("./pages/modules/audit/Reports"));
const NonConformities = lazy(() => import("./pages/modules/audit/NonConformities"));
const Sanctions = lazy(() => import("./pages/modules/audit/Sanctions"));

/* ============================================================
   10. CONFORMITÉ & JURIDIQUE
   ============================================================ */

const ComplianceDashboard = lazy(() => import("./pages/modules/compliance/ComplianceDashboard"));
const Contracts = lazy(() => import("./pages/modules/compliance/Contracts"));
const Policies = lazy(() => import("./pages/modules/compliance/Policies"));
const Disputes = lazy(() => import("./pages/modules/compliance/Disputes"));
const ComplianceRiskRegister = lazy(() => import("./pages/modules/compliance/RiskRegister"));

/* ============================================================
   11. RSE & IMPACT
   ============================================================ */

const RSEDashboard = lazy(() => import("./pages/modules/rse/RSEDashboard"));
const ValidatedPackaging = lazy(() => import("./pages/modules/rse/ValidatedPackaging"));
const PackagingDashboard = lazy(() => import("./pages/modules/packaging/PackagingDashboard"));
const RecyclingStats = lazy(() => import("./pages/modules/rse/RecyclingStats"));
const CustomerPoints = lazy(() => import("./pages/modules/rse/CustomerPoints"));
const CO2Impact = lazy(() => import("./pages/modules/rse/CO2Impact"));
const ESGReports = lazy(() => import("./pages/modules/rse/ESGReports"));

/* ============================================================
   12. PRODUIT & ENGINEERING
   ============================================================ */

const ProductEngineeringDashboard = lazy(() => import("./pages/modules/product/ProductEngineeringDashboard"));
const ProductReleases = lazy(() => import("./pages/modules/product/ProductReleases"));
const ProductTestingCenter = lazy(() => import("./pages/modules/product/ProductTestingCenter"));
import ProductPlanningWorkspace from "./components/product/ProductPlanningWorkspace";
import ProductFunctionWorkspace from "./components/product/ProductFunctionWorkspace";
import MarketingWorkflowPage from "./components/marketing/MarketingWorkflowPage";
const CorrectiveActions = lazy(() => import("./pages/modules/audit/CorrectiveActions"));
import SupportCoordinationPage from "./components/support/SupportCoordinationPage";
const PartnerPayouts = lazy(() => import("./pages/modules/finance/PartnerPayouts"));
const ProductStudio = lazy(() => import("./pages/modules/product/ProductStudio"));
const ProductIntegrations = lazy(() => import("./pages/modules/product/ProductIntegrations"));
const ProductDocumentation = lazy(() => import("./pages/modules/product/ProductDocumention"));
const ProductInnovation = lazy(() => import("./pages/modules/product/ProductInnovation"));
const ProductPerformance = lazy(() => import("./pages/modules/product/ProductPerformance"));
const SupplierPerformance = lazy(() => import("./pages/modules/product/SupplierPerformance"));
const ProductFrictions = lazy(() => import("./pages/modules/product/ProductFrictions"));
const ProductReports = lazy(() => import("./pages/modules/product/ProductReports"));
const ProductTicketDetail = lazy(() => import("./pages/modules/product/ProductTicketDetail"));

/* ============================================================
   13. DATA & BI
   ============================================================ */

const DataDashboard = lazy(() => import("./pages/modules/data/DataDashboard"));
const KPICatalog = lazy(() => import("./pages/modules/data/KPICatalog"));
const PublicationRequestsPage = lazy(() => import("./pages/modules/data/PublicationRequests"));
const TechBacklogPage = lazy(() => import("./pages/modules/data/TechBacklog"));
const KPIVersions = lazy(() => import("./pages/modules/data/KPIVersions"));
const DataReports = lazy(() => import("./pages/modules/data/Reports"));

const BIOverview = lazy(() => import("./pages/modules/data/bi/BIOverview"));
const BIDashboardsList = lazy(() => import("./pages/modules/data/bi/BIDashboardsList"));
const BIDesigner = lazy(() => import("./pages/modules/data/bi/BIDesigner"));
const BITemplates = lazy(() => import("./pages/modules/data/bi/BITemplates"));
const BIDataSources = lazy(() => import("./pages/modules/data/bi/BIDataSources"));
const BIWidgetLibrary = lazy(() => import("./pages/modules/data/bi/BIWidgetLibrary"));
const BIHistory = lazy(() => import("./pages/modules/data/bi/BIHistory"));

/* ============================================================
   14. SECURITY & IT
   ============================================================ */

const SecurityDashboard = lazy(() => import("./pages/modules/security/SecurityDashboard"));
const SecurityOperations = lazy(() => import("./pages/modules/security/Security"));
const SecurityAccess = lazy(() => import("./pages/modules/security/SecurityAccess"));
const SecurityInfrastructure = lazy(() => import("./pages/modules/security/SecurityInfrastructure"));
const SecurityEnvironments = lazy(() => import("./pages/modules/security/SecurityEnvironments"));
const SecurityVPN = lazy(() => import("./pages/modules/security/SecurityVPN"));
const SecurityLogs = lazy(() => import("./pages/modules/security/SecurityLogs"));
const SecurityCode = lazy(() => import("./pages/modules/security/SecurityCode"));
const SecurityConsole = lazy(() => import("./pages/modules/security/SecurityConsole"));
const SecurityDocumentation = lazy(() => import("./pages/modules/security/SecurityDocumentation"));
const SecuritySandbox = lazy(() => import("./pages/modules/security/SecuritySandbox"));
const SecuritySupervision = lazy(() => import("./pages/modules/security/SecuritySupervision"));
const SecurityDataFlow = lazy(() => import("./pages/modules/security/SecurityDataFlow"));
const SecurityPlatform = lazy(() => import("./pages/modules/security/SecurityPlatform"));



/* ============================================================
   TRANSVERSAL — ÉTHIQUE
   ============================================================ */

const EthicsDashboard = lazy(() => import("./pages/modules/ethics/EthicsDashboard"));
const EthicsReport = lazy(() => import("./pages/modules/ethics/EthicsReport"));
const EthicsReceived = lazy(() => import("./pages/modules/ethics/EthicsReceived"));
const EthicsOngoing = lazy(() => import("./pages/modules/ethics/EthicsOngoing"));
const EthicsClosed = lazy(() => import("./pages/modules/ethics/EthicsClosed"));
const EthicsStats = lazy(() => import("./pages/modules/ethics/EthicsStats"));

/* ============================================================
   TRANSVERSAL — GATEWAY
   ============================================================ */

const GatewayDashboard = lazy(() => import("./pages/modules/gateway/GatewayDashboard"));
const GatewayInbox = lazy(() => import("./pages/modules/gateway/GatewayInbox"));
const GatewayValidation = lazy(() => import("./pages/modules/gateway/GatewayValidation"));
const GatewayRouting = lazy(() => import("./pages/modules/gateway/GatewayRouting"));
const GatewayResponses = lazy(() => import("./pages/modules/gateway/GatewayResponses"));
const GatewayCompose = lazy(() => import("./pages/modules/gateway/GatewayCompose"));
const GatewayJournal = lazy(() => import("./pages/modules/gateway/GatewayJournal"));
const GatewayMessageDetail = lazy(() => import("./pages/modules/gateway/GatewayMessageDetail"));

/* ============================================================
   TRANSVERSAL — AUDIT INDÉPENDANT
   ============================================================ */

const IndependentAuditDashboard = lazy(() => import("./pages/modules/independent-audit/IndependentAuditDashboard"));
const IncidentDeclaration = lazy(() => import("./pages/modules/independent-audit/IncidentDeclaration"));
const ResolutionTracking = lazy(() => import("./pages/modules/independent-audit/ResolutionTracking"));

/* ============================================================
   TRANSVERSAL — WORK
   ============================================================ */

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
            <Suspense fallback={<div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Chargement du module…</div>}>
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

                <Route path="/pole/direction" element={<ExecutiveDashboard />} />
                <Route path="/pole/direction/global" element={<DirectionGlobal />} />
                <Route path="/pole/direction/kpi" element={<StrategicKPIs />} />
                <Route
                  path="/pole/direction/strategic-kpis"
                  element={<StrategicKPIs />}
                />
                <Route path="/pole/direction/alerts" element={<CriticalAlertsPage />} />
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
                <Route path="/pole/direction/vision" element={<VisionRoadmap />} />
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
                <Route path="/pole/direction/reports" element={<BoardReports />} />
                <Route
                  path="/pole/direction/board-reports"
                  element={<BoardReports />}
                />
                <Route
                  path="/pole/direction/access"
                  element={<Navigate to="/admin/roles-permissions" replace />}
                />

                {/* ====================================================
                    2. FINANCE
                    ==================================================== */}

                <Route path="/pole/finance" element={<FinanceDashboard />} />
                <Route path="/pole/finance/cashflow" element={<CashflowRealtime />} />
                <Route path="/pole/finance/transactions" element={<Transactions />} />
                <Route
                  path="/pole/finance/supplier-payments"
                  element={<SupplierPayments />}
                />
                <Route
                  path="/pole/finance/subscriptions"
                  element={<Subscriptions />}
                />
                <Route path="/pole/finance/salaries" element={<Salaries />} />
                <Route path="/pole/finance/cards" element={<CorporateCards />} />
                <Route path="/pole/finance/guarantee" element={<GuaranteeFund />} />
                <Route
                  path="/pole/finance/billing"
                  element={<Billing />}
                />
                <Route
                  path="/pole/finance/payouts"
                  element={<PartnerPayouts />}
                />
                <Route
                  path="/pole/finance/reconciliation"
                  element={<Reconciliation />}
                />

                {/* ====================================================
                    3. OPÉRATIONS & LOGISTIQUE
                    ==================================================== */}

                <Route path="/pole/ops" element={<OpsDashboard />} />
                <Route path="/pole/ops/shops" element={<ShopsSupervision />} />
                <Route path="/pole/ops/anomalies" element={<Anomalies />} />
                <Route path="/pole/ops/pipeline" element={<OrderPipeline />} />
                <Route path="/pole/ops/orders" element={<Orders />} />
                <Route path="/pole/ops/shipments" element={<Shipments />} />
                <Route path="/pole/ops/stocks" element={<DistributedStocks />} />
                <Route path="/pole/ops/catalog" element={<ProductCatalog />} />
                <Route
                  path="/pole/ops/product-lifecycle"
                  element={<ProductLifecycle />}
                />
                <Route
                  path="/pole/ops/shops/:id"
                  element={<ShopDetail />}
                />
                <Route path="/pole/ops/partners" element={<Partners />} />
                <Route path="/pole/ops/flows" element={<SyncFlows />} />
                <Route path="/pole/ops/incidents" element={<LogisticsIncidents />} />
                <Route path="/pole/ops/replenishment" element={<Replenishment />} />
                <Route path="/pole/ops/forecast" element={<DemandForecast />} />
                <Route path="/pole/ops/thresholds" element={<StockThresholds />} />
                <Route
                  path="/pole/ops/suppliers-lead-times"
                  element={<SupplierLeadTimes />}
                />
                <Route
                  path="/pole/ops/suppliers-lt"
                  element={<SupplierLeadTimes />}
                />
                <Route path="/pole/ops/audit-link" element={<AuditLink />} />

                {/* ====================================================
                    4. FOURNISSEURS & PRODUITS
                    ==================================================== */}

                <Route path="/pole/supplier" element={<SupplierDashboard />} />
                <Route
                  path="/pole/supplier/pending"
                  element={<PendingProducts />}
                />
                <Route
                  path="/pole/supplier/validated"
                  element={<ValidatedProducts />}
                />
                <Route path="/pole/supplier/suppliers" element={<SupplierFiles />} />
                <Route
                  path="/pole/supplier/certifications"
                  element={<Certifications />}
                />
                <Route
                  path="/pole/supplier/decisions"
                  element={<DecisionHistory />}
                />
                <Route path="/pole/supplier/alerts" element={<QualityAlerts />} />
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
                  element={
                    <ProtectedPage pageId="marketplace.overview">
                      <MarketplaceDashboard />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/merchants"
                  element={
                    <ProtectedPage pageId="marketplace.merchants">
                      <MerchantPortfolio />
                    </ProtectedPage>
                  }
                />

                <Route
                  path="/pole/marketplace/portfolio"
                  element={
                    <ProtectedPage pageId="marketplace.merchants">
                      <MerchantPortfolio />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/merchants/:id"
                  element={
                    <ProtectedPage pageId="marketplace.merchants">
                      <MerchantDetail />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/stores"
                  element={
                    <ProtectedPage pageId="marketplace.stores">
                      <MarketplaceStores />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/stores/:id"
                  element={
                    <ProtectedPage pageId="marketplace.stores">
                      <MarketplaceStoreDetail />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/products"
                  element={
                    <ProtectedPage pageId="marketplace.products">
                      <MarketplaceProducts />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/customers"
                  element={<MarketplaceCustomers />}
                />
                
                <Route
                  path="/pole/marketplace/orders"
                  element={<MarketplaceOrders />}
                />
                
                <Route
                  path="/pole/marketplace/subscribers"
                  element={<MarketplaceSubscribers />}
                />
                
                <Route
                  path="/pole/marketplace/favorites"
                  element={<MarketplaceFavorites />}
                />
                
                {/* Fonctionnalités futures — masquées du MVP actuel */}
                <Route
                  path="/pole/marketplace/rewards"
                  element={<Navigate to="/pole/marketplace" replace />}
                />
                
                <Route
                  path="/pole/marketplace/recycling"
                  element={<Navigate to="/pole/marketplace" replace />}
                />
                
                <Route
                  path="/pole/marketplace/opportunities"
                  element={
                    <ProtectedPage pageId="marketplace.opportunities">
                      <MarketplaceOpportunities />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/analytics"
                  element={
                    <ProtectedPage pageId="marketplace.analytics">
                      <MarketplaceAnalytics />
                    </ProtectedPage>
                  }
                />
                
                <Route
                  path="/pole/marketplace/subscriptions"
                  element={
                    <ProtectedPage pageId="marketplace.subscriptions">
                      <MarketplaceSubscriptions />
                    </ProtectedPage>
                  }
                />

                {/* ====================================================
                    6. SUPPORT & CUSTOMER SUCCESS
                    ==================================================== */}

                <Route path="/pole/support" element={<PoleDashboard />} />
                <Route
                  path="/pole/support/tickets"
                  element={<SupportTickets />}
                />
                <Route
                  path="/pole/support/customer-success"
                  element={<CustomerSuccess />}
                />
                <Route
                  path="/pole/support/monitoring"
                  element={<SupportMonitoring />}
                />
                <Route
                  path="/pole/support/escalations"
                  element={<SupportEscalations />}
                />
                <Route path="/pole/support/compliance" element={<SupportCoordinationPage mode="compliance" />} />
                <Route path="/pole/support/onboarding" element={<SupportCoordinationPage mode="onboarding" />} />

                {/* ====================================================
                    7. MARKETING & COMMUNICATION
                    ==================================================== */}

                <Route path="/pole/marketing" element={<MarketingDashboard />} />
                <Route
                  path="/pole/marketing/campaigns"
                  element={<Campaigns />}
                />
                <Route path="/pole/marketing/content" element={<Content />} />
                <Route path="/pole/marketing/podcasts" element={<Podcasts />} />
                <Route path="/pole/marketing/analytics" element={<Analytics />} />
                <Route
                  path="/pole/marketing/crm"
                  element={<MarketingWorkflowPage mode="crm" />}
                />
                <Route
                  path="/pole/marketing/journeys"
                  element={<MarketingWorkflowPage mode="journeys" />}
                />
                <Route
                  path="/pole/marketing/reputation"
                  element={<MarketingWorkflowPage mode="reputation" />}
                />

                {/* ====================================================
                    8. RH
                    ==================================================== */}

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
                <Route
                  path="/pole/rh/ethics"
                  element={<Navigate to="/modules/ethics" replace />}
                />
                <Route
                  path="/pole/rh/portfolio"
                  element={<RHPortfolio />}
                />
                <Route
                  path="/pole/rh/organization"
                  element={<Organization />}
                />
                <Route
                  path="/pole/rh/access"
                  element={<RHAccess />}
                />
                <Route
                  path="/pole/rh/recruitment"
                  element={<Recruitment />}
                />

                {/* ====================================================
                    9. QUALITÉ & AUDIT
                    ==================================================== */}

                <Route path="/pole/audit" element={<AuditDashboard />} />
                <Route path="/pole/audit/field" element={<FieldAudits />} />
                <Route path="/pole/audit/missions" element={<AuditMissions />} />
                <Route path="/pole/audit/supplier" element={<SupplierAudits />} />
                <Route path="/pole/audit/ops" element={<OpsAudits />} />
                <Route path="/pole/audit/reports" element={<AuditReports />} />
                <Route
                  path="/pole/audit/nonconformities"
                  element={<NonConformities />}
                />
                <Route path="/pole/audit/sanctions" element={<Sanctions />} />
                <Route
                  path="/pole/audit/corrective-actions"
                  element={<CorrectiveActions />}
                />

                {/* ====================================================
                    10. CONFORMITÉ & JURIDIQUE
                    ==================================================== */}

                <Route path="/pole/compliance" element={<ComplianceDashboard />} />
                <Route
                  path="/pole/compliance/contracts"
                  element={<Contracts />}
                />
                <Route path="/pole/compliance/policies" element={<Policies />} />
                <Route path="/pole/compliance/disputes" element={<Disputes />} />
                <Route
                  path="/pole/compliance/risks"
                  element={<ComplianceRiskRegister />}
                />

                {/* ====================================================
                    11. RSE & IMPACT
                    ==================================================== */}

                <Route path="/pole/rse" element={<RSEDashboard />} />
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
                <Route path="/pole/rse/co2" element={<CO2Impact />} />
                <Route path="/pole/rse/esg" element={<ESGReports />} />

                {/* ====================================================
                    12. PRODUIT & ENGINEERING
                    ==================================================== */}

                <Route
                  path="/pole/product"
                  element={<ProductEngineeringDashboard />}
                />
                <Route
                  path="/pole/product/product"
                  element={<ProductFunctionWorkspace area="product" />}
                />
                <Route
                  path="/pole/product/roadmap"
                  element={<ProductPlanningWorkspace mode="roadmap" />}
                />
                <Route
                  path="/pole/product/backlog"
                  element={<ProductPlanningWorkspace mode="backlog" />}
                />
                <Route
                  path="/pole/product/engineering"
                  element={<ProductFunctionWorkspace area="engineering" />}
                />
                <Route
                  path="/pole/product/releases"
                  element={<ProductReleases />}
                />
                <Route
                  path="/pole/product/testing"
                  element={<ProductTestingCenter />}
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
                <Route
                  path="/pole/product/performance"
                  element={<ProductPerformance />}
                />
                <Route
                  path="/pole/product/supplier-performance"
                  element={<SupplierPerformance />}
                />
                <Route
                  path="/pole/product/frictions"
                  element={<ProductFrictions />}
                />
                <Route
                  path="/pole/product/reports"
                  element={<ProductReports />}
                />
                <Route
                  path="/pole/product/tickets/:id"
                  element={<ProductTicketDetail />}
                />

                {/* ====================================================
                    13. DATA & BI
                    ==================================================== */}

                <Route path="/pole/data" element={<DataDashboard />} />
                <Route path="/pole/data/kpi" element={<KPICatalog />} />
                <Route
                  path="/pole/data/requests"
                  element={<PublicationRequestsPage />}
                />
                <Route
                  path="/pole/data/backlog"
                  element={<TechBacklogPage />}
                />
                <Route path="/pole/data/versions" element={<KPIVersions />} />
                <Route path="/pole/data/reports" element={<DataReports />} />

                <Route path="/pole/data/bi" element={<BIOverview />} />
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
                  element={<SecurityDashboard />}
                />
                <Route
                  path="/pole/security/security"
                  element={<SecurityOperations />}
                />
                <Route
                  path="/pole/security/access"
                  element={<SecurityAccess />}
                />
                <Route
                  path="/pole/security/infrastructure"
                  element={<SecurityInfrastructure />}
                />
                <Route
                  path="/pole/security/environments"
                  element={<SecurityEnvironments />}
                />
                <Route path="/pole/security/vpn" element={<SecurityVPN />} />
                <Route path="/pole/security/logs" element={<SecurityLogs />} />
                <Route path="/pole/security/code" element={<SecurityCode />} />
                <Route
                  path="/pole/security/console"
                  element={<SecurityConsole />}
                />
                <Route
                  path="/pole/security/documentation"
                  element={<SecurityDocumentation />}
                />
                <Route
                  path="/pole/security/sandbox"
                  element={<SecuritySandbox />}
                />
                <Route
                  path="/pole/security/supervision"
                  element={<SecuritySupervision />}
                />
                <Route
                  path="/pole/security/dataflow"
                  element={<SecurityDataFlow />}
                />
                <Route
                  path="/pole/security/platform"
                  element={<SecurityPlatform />}
                />

                {/* Security / Supabase supervision */}
                <Route
                  path="/pole/security/edge-functions"
                  element={<Navigate to="/pole/security/infrastructure" replace />}
                />
                <Route
                  path="/pole/security/edge-functions/:id"
                  element={<Navigate to="/pole/security/infrastructure" replace />}
                />
                <Route
                  path="/pole/security/edge-functions/:id/logs"
                  element={<Navigate to="/pole/security/logs" replace />}
                />
                <Route
                  path="/pole/security/auth-logs"
                  element={<Navigate to="/pole/security/logs" replace />}
                />
                <Route
                  path="/pole/security/edge-logs"
                  element={<Navigate to="/pole/security/logs" replace />}
                />
                <Route
                  path="/pole/security/reports"
                  element={<Navigate to="/pole/security/documentation" replace />}
                />

                {/* Security incidents */}
                <Route
                  path="/pole/security/incidents"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/new"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/report"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/update"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/delete"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/assign"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/close"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/reopen"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/escalate"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/deescalate"
                  element={<Navigate to="/pole/security/security" replace />}
                />
                <Route
                  path="/pole/security/incidents/:id/comment"
                  element={<Navigate to="/pole/security/security" replace />}
                />

                {/* ====================================================
                    COMPATIBILITÉ — ANCIEN PÔLE TECH
                    ==================================================== */}

                <Route
                  path="/pole/tech"
                  element={<Navigate to="/pole/product" replace />}
                />
                <Route
                  path="/pole/tech/access"
                  element={<Navigate to="/pole/security/access" replace />}
                />
                <Route
                  path="/pole/tech/vpn"
                  element={<Navigate to="/pole/security/vpn" replace />}
                />
                <Route
                  path="/pole/tech/logs"
                  element={<Navigate to="/pole/security/logs" replace />}
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
                  element={<Navigate to="/pole/security/security" replace />}
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
                  element={<Navigate to="/pole/product" replace />}
                />
                <Route
                  path="/pole/tech/received-products"
                  element={<Navigate to="/pole/product" replace />}
                />
                <Route
                  path="/pole/tech/dataflow"
                  element={
                    <Navigate
                      to="/pole/security/dataflow"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/tech/sandbox"
                  element={<Navigate to="/pole/security/sandbox" replace />}
                />
                <Route
                  path="/pole/tech/test-accounts"
                  element={<Navigate to="/pole/security/access" replace />}
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
                  element={<Navigate to="/pole/security/code" replace />}
                />
                <Route
                  path="/pole/tech/supervision"
                  element={
                    <Navigate
                      to="/pole/security/supervision"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/tech/documentation"
                  element={
                    <Navigate
                      to="/pole/security/documentation"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/tech/console"
                  element={<Navigate to="/pole/security/console" replace />}
                />
                <Route
                  path="/pole/tech/studio"
                  element={<Navigate to="/pole/product/studio" replace />}
                />
                <Route
                  path="/tech-studio"
                  element={<Navigate to="/pole/product/studio" replace />}
                />

                {/* ====================================================
                    COMPATIBILITÉ — ANCIEN PÔLE LIFECYCLE
                    ==================================================== */}

                <Route
                  path="/pole/lifecycle"
                  element={<Navigate to="/pole/support" replace />}
                />
                <Route
                  path="/pole/lifecycle/onboarding"
                  element={<Navigate to="/pole/rh/onboarding" replace />}
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
                      to="/pole/marketplace/products"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/rd/shops"
                  element={
                    <Navigate
                      to="/pole/marketplace/stores"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/rd/suppliers"
                  element={
                    <Navigate
                      to="/pole/supplier/portfolios"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/rd/frictions"
                  element={
                    <Navigate
                      to="/pole/product/frictions"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/rd/reports"
                  element={
                    <Navigate
                      to="/pole/product/reports"
                      replace
                    />
                  }
                />
                <Route
                  path="/pole/rd/tickets/:id"
                  element={<ProductTicketDetail />}
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
                  path="/modules/ethics/dashboard"
                  element={<EthicsDashboard />}
                />
                <Route
                  path="/modules/ethics/report"
                  element={<EthicsReport />}
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

                <Route path="/work/tasks" element={<WorkTasks />} />
                <Route path="/work/projects" element={<WorkProjects />} />
                <Route path="/work/processes" element={<WorkProcesses />} />
                <Route
                  path="/work/validations"
                  element={<WorkValidations />}
                />
                <Route
                  path="/work/escalations"
                  element={<WorkEscalations />}
                />
                <Route
                  path="/work/activities"
                  element={<WorkActivities />}
                />

                {/* ====================================================
                    CORE TRANSVERSAL
                    ==================================================== */}

                <Route
                  path="/notifications"
                  element={<Notifications />}
                />
                <Route path="/feed" element={<InternalFeed />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/imports" element={<Documents />} />
                <Route path="/documents/exports" element={<Documents />} />
                <Route path="/documents/journal" element={<Documents />} />
                <Route path="/modules/independent-audit/incident" element={<IncidentDeclaration />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />

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
                    AUDIT GLOBAL
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
                    WHAT'S NEW
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

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </SandboxProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
