import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { intranetRpc } from "@/lib/intranet";
import { readAllPages } from "@/lib/operationsMetrics";

export type LegalKind = "model" | "identity";
export type LegalRecord = {
  id: string;
  kind: LegalKind;
  payload: Record<string, unknown>;
  state: string;
  revision: number;
  created_by: string;
  legal_reviewer: string | null;
  direction_reviewer: string | null;
  legal_evidence: string | null;
  direction_evidence: string | null;
  reason: string | null;
  delivery_sequence: number;
  activation_sequence: number | null;
  updated_at: string;
};
export type IdentitySnapshot = {
  store_id: string;
  owner_id: string;
  base_hash: string;
  fields: Record<string, string>;
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
const from = <T>(name: string) =>
  supabase.from(name as never) as unknown as Rows<T>;
export async function legalBridge<T>(
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(
    "legal-governance-bridge",
    { body },
  );
  if (error || !data?.ok)
    throw new Error(
      "La transmission n’est pas confirmée. Vérifiez les droits, la connexion et les données actuelles, puis réessayez.",
    );
  return data as T;
}
export function useLegalRecords(kind: LegalKind) {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: [
      "legal-governance",
      kind,
      user?.id,
      profile?.test_account === true,
    ],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows = await readAllPages<LegalRecord>((cursor) => {
        let q = from<LegalRecord>("legal_governance_records")
          .select("*")
          .eq("kind", kind)
          .order("id")
          .limit(500);
        if (cursor) q = q.gt("id", cursor);
        return q;
      });
      return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
  });
}
export function useLegalRecordDetails(id: string) {
  const { user, profile } = useAuth();
  const events = useQuery({
    queryKey: [
      "legal-governance-events",
      id,
      user?.id,
      profile?.test_account === true,
    ],
    queryFn: async () => {
      const { data, error } = await from<{
        action: string;
        created_at: string;
        actor_id: string;
        id: string;
      }>("legal_governance_events")
        .select("id,action,actor_id,created_at")
        .eq("record_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const deliveries = useQuery({
    queryKey: [
      "legal-governance-deliveries",
      id,
      user?.id,
      profile?.test_account === true,
    ],
    queryFn: async () => {
      const { data, error } = await from<{
        delivery_sequence: number;
        state: string;
        delivered_at: string | null;
      }>("legal_governance_deliveries")
        .select("delivery_sequence,state,delivered_at")
        .eq("record_id", id)
        .order("delivery_sequence", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  return { events, deliveries };
}
export function useLegalActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const keys = useRef(new Map<string, string>());
  const keyFor = (args: unknown) => {
    const fingerprint = JSON.stringify([user?.id, args]);
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID();
    keys.current.set(fingerprint, key);
    return { key, fingerprint };
  };
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["legal-governance"] });
    void qc.invalidateQueries({ queryKey: ["legal-governance-events"] });
    void qc.invalidateQueries({ queryKey: ["legal-governance-deliveries"] });
  };
  const create = useMutation({
    mutationFn: async (input: {
      kind: LegalKind;
      payload: Record<string, unknown>;
    }) => {
      const { key, fingerprint } = keyFor(input);
      const r = await intranetRpc<LegalRecord>(
        "create_legal_governance_record",
        { p_key: key, p_kind: input.kind, p_payload: input.payload },
      );
      keys.current.delete(fingerprint);
      return r;
    },
    onSuccess: refresh,
  });
  const identity = useMutation({
    mutationFn: async (input: {
      snapshot: IdentitySnapshot;
      fields: Record<string, string>;
    }) => {
      const { key, fingerprint } = keyFor(input);
      const r = await legalBridge<{ record: LegalRecord }>({
        action: "create_identity",
        key,
        store_id: input.snapshot.store_id,
        expected_snapshot_hash: input.snapshot.base_hash,
        fields: input.fields,
      });
      keys.current.delete(fingerprint);
      return r.record;
    },
    onSuccess: refresh,
  });
  const advance = useMutation({
    mutationFn: async (input: {
      id: string;
      revision: number;
      action: string;
      payload: Record<string, unknown>;
    }) => {
      const { key, fingerprint } = keyFor(input);
      const r = await intranetRpc<LegalRecord>(
        "advance_legal_governance_record",
        {
          p_id: input.id,
          p_revision: input.revision,
          p_key: key,
          p_action: input.action,
          p_payload: input.payload,
        },
      );
      keys.current.delete(fingerprint);
      return r;
    },
    onSuccess: refresh,
  });
  const deliver = useMutation({
    mutationFn: (id: string) =>
      legalBridge({ action: "deliver", record_id: id }),
    onSuccess: refresh,
  });
  return { create, identity, advance, deliver, refresh };
}
