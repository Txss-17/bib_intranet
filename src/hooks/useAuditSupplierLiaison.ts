import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const from = (table: string) => (supabase as any).from(table);

/**
 * Hook to manage the liaison between Audit results and Supplier status.
 * Automatically updates supplier status based on audit scores.
 */
export function useAuditSupplierLiaison() {
  const qc = useQueryClient();

  const getStatusFromScore = (score: number): { status: string; label: string } => {
    if (score >= 70) return { status: 'validated', label: 'Validé' };
    if (score >= 50) return { status: 'pending', label: 'À surveiller' };
    return { status: 'suspended', label: 'Suspendu' };
  };

  /**
   * After an audit is completed, update the supplier's status and risk_score.
   */
  const syncSupplierAfterAudit = useCallback(async (supplierName: string, auditScore: number) => {
    try {
      // Find supplier by name
      const { data: suppliers, error: findError } = await from('suppliers')
        .select('id, name, status, risk_score')
        .ilike('name', `%${supplierName}%`)
        .limit(1);

      if (findError || !suppliers?.length) {
        console.warn('Supplier not found for audit sync:', supplierName);
        return;
      }

      const supplier = suppliers[0];
      const { status: newStatus, label } = getStatusFromScore(auditScore);
      const riskScore = Math.max(0, 100 - auditScore);

      // Update supplier status and risk_score
      const { error: updateError } = await from('suppliers')
        .update({
          status: newStatus,
          risk_score: riskScore,
        })
        .eq('id', supplier.id);

      if (updateError) throw updateError;

      // Create notification for supplier pole
      await from('notifications').insert({
        title: `Audit terminé — ${supplierName}`,
        message: `Score: ${auditScore}% → Statut mis à jour: ${label}. Score risque: ${riskScore}.`,
        type: auditScore < 50 ? 'critical' : auditScore < 70 ? 'warning' : 'success',
        pole_id: 'supplier',
        action_url: '/pole/supplier/suppliers',
      });

      // Log the action
      await from('audit_logs').insert({
        action: 'audit_supplier_sync',
        resource: 'suppliers',
        resource_id: supplier.id,
        user_name: 'Système',
        pole_id: 'audit',
        details: {
          supplier_name: supplierName,
          audit_score: auditScore,
          previous_status: supplier.status,
          new_status: newStatus,
          risk_score: riskScore,
        },
      });

      qc.invalidateQueries({ queryKey: ['suppliers'] });

      toast.success(`Statut fournisseur mis à jour`, {
        description: `${supplierName} → ${label} (score: ${auditScore}%)`,
      });
    } catch (err) {
      console.error('Failed to sync supplier after audit:', err);
      toast.error('Erreur lors de la synchronisation fournisseur');
    }
  }, [qc]);

  return { syncSupplierAfterAudit, getStatusFromScore };
}
