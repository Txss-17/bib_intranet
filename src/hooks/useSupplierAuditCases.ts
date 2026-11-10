import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { intranetRpc } from "@/lib/intranet";
import { readAllPages } from "@/lib/operationsMetrics";

export type AuditQuote = {
  number: string;
  version: number;
  scope: string[];
  lines: { label: string; quantity: number; unit_cents: number }[];
  discount_cents: number;
  tax_rate_bps: number;
  tax_basis: string;
  net_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  tariff_version: string;
  valid_until: string;
  payment_condition: "prepaid" | "after_service";
  issuer_identity: string;
  recipient_identity: string;
  payment_terms: string;
  scope_note: string;
};
export type SupplierAuditCase = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  kind: "initial" | "counter_audit";
  scope: string[];
  incident_reference: string | null;
  state: string;
  revision: number;
  created_by: string;
  updated_at: string;
  contract_reference: string | null;
  contract_effective_on: string | null;
  quote: AuditQuote | null;
  quote_state: string;
  quote_hash: string | null;
  quote_version: number;
  quote_author: string | null;
  quote_approved_by: string | null;
  acceptance: {
    signatory: string;
    recorded_at: string;
    evidence_reference?: string;
  } | null;
  invoice: {
    reference: string;
    issue_date: string;
    document_reference: string;
  } | null;
  payments: { reference: string; paid_on: string; amount_cents: number }[];
  report: {
    findings: string;
    conclusion: string;
    evidence_reference: string;
  } | null;
  report_author: string | null;
  report_approved_by: string | null;
  report_hash: string | null;
  reference_decisions: { reference: string; decision: string }[] | null;
  reason: string | null;
};
type Rows<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}> & {
  select(columns: string): Rows<T>;
  eq(column: string, value: unknown): Rows<T>;
  gt(column: string, value: string): Rows<T>;
  order(column: string, options?: { ascending: boolean }): Rows<T>;
  limit(count: number): Rows<T>;
};
const from = <T>(table: string) =>
  supabase.from(table as never) as unknown as Rows<T>;
export function useSupplierAuditCases(supplierId?: string) {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: [
      "supplier-audit-cases",
      user?.id,
      profile?.test_account === true,
      supplierId,
    ],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows = await readAllPages<SupplierAuditCase>((cursor) => {
        let query = from<SupplierAuditCase>("supplier_audit_cases")
          .select("*")
          .order("id")
          .limit(500);
        if (supplierId) query = query.eq("supplier_id", supplierId);
        if (cursor) query = query.gt("id", cursor);
        return query;
      });
      return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
  });
}
export function useSupplierAuditCaseEvents(caseId?: string) {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: [
      "supplier-audit-case-events",
      user?.id,
      profile?.test_account === true,
      caseId,
    ],
    enabled: !!user && !!caseId,
    queryFn: async (): Promise<
      {
        id: string;
        action: string;
        actor_id: string | null;
        created_at: string;
      }[]
    > => {
      const { data, error } = await from<{
        id: string;
        action: string;
        actor_id: string | null;
        created_at: string;
      }>("supplier_audit_case_events")
        .select("id,action,actor_id,created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}
export type SupplierAuditHandoff = {
  case_id: string;
  supplier_id: string;
  audit_kind: "initial" | "counter_audit";
  sent_by: string;
  sent_at: string;
  status: "received";
  case_revision: number;
};

export function useSupplierAuditHandoffs() {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ["supplier-audit-handoffs", user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => readAllPages<SupplierAuditHandoff>((cursor) => {
      let q = from<SupplierAuditHandoff>("supplier_audit_handoffs")
        .select("case_id,supplier_id,audit_kind,sent_by,sent_at,status,case_revision")
        .order("case_id")
        .limit(500);
      if (cursor) q = q.gt("case_id", cursor);
      return q;
    }),
    staleTime: 10_000,
  });
}

export function useTransmitSupplierAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({caseId,revision,reason}: {caseId:string;revision:number;reason:string}) =>
      intranetRpc<{case_id:string;sent_at:string;status:string;already_transmitted:boolean}>(
        "transmit_supplier_audit_to_pole", {
          p_case_id:caseId,
          p_expected_revision:revision,
          p_reason:reason.trim(),
        }),
    onSuccess: () => {
      void qc.invalidateQueries({queryKey:["supplier-audit-handoffs"]});
      void qc.invalidateQueries({queryKey:["supplier-audit-cases"]});
    },
  });
}
export function useSupplierAuditCaseActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const keys = useRef(new Map<string, string>());
  const run = async <T>(name: string, args: Record<string, unknown>) => {
    const fingerprint = JSON.stringify([user?.id, name, args]);
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID();
    keys.current.set(fingerprint, key);
    const result = await intranetRpc<T>(name, { ...args, p_key: key });
    keys.current.delete(fingerprint);
    return result;
  };
  const done = () => {
    void qc.invalidateQueries({ queryKey: ["supplier-audit-cases"] });
    void qc.invalidateQueries({ queryKey: ["supplier-audit-case-events"] });
  };
  const create = useMutation({
    mutationFn: (input: {
      supplierId: string;
      kind: string;
      scope: string[];
      incident: string | null;
    }) =>
      run<SupplierAuditCase>("create_supplier_audit_case", {
        p_supplier_id: input.supplierId,
        p_kind: input.kind,
        p_scope: input.scope,
        p_incident_reference: input.incident,
      }),
    onSuccess: done,
  });
  const advance = useMutation({
    mutationFn: (input: {
      id: string;
      revision: number;
      action: string;
      payload: Record<string, unknown>;
    }) =>
      run<SupplierAuditCase>("advance_supplier_audit_case", {
        p_id: input.id,
        p_revision: input.revision,
        p_action: input.action,
        p_payload: input.payload,
      }),
    onSuccess: done,
  });
  return { create, advance };
}
