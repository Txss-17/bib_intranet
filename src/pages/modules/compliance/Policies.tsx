import ComplianceGovernancePage from '@/components/compliance/ComplianceGovernancePage';
import LegalGovernancePanel from '@/components/compliance/LegalGovernancePanel';
export default function Page() { return <div className="space-y-6"><LegalGovernancePanel/><ComplianceGovernancePage mode="policies" /></div>; }
