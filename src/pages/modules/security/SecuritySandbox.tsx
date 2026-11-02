import { Navigate } from 'react-router-dom';
/** Fake-data sandbox permanently disabled in BIB Intranet. */
export default function SecuritySandbox() {
  return <Navigate to="/pole/security" replace />;
}
