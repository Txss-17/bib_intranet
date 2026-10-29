import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * Données Produit & Engineering
 *
 * Ce module remplace progressivement l'ancien périmètre R&D.
 *
 * Il agrège actuellement :
 * - données produits ;
 * - données fournisseurs utiles à l'analyse produit ;
 * - frictions et anomalies produit/techniques.
 *
 * Les données fournisseurs restent rattachées à leur domaine métier.
 * Le risque fournisseur est une donnée transversale et non un pôle autonome.
 *
 * IMPORTANT :
 * Les tables Supabase restent inchangées à ce stade.
 */

const db = supabase as unknown as {
  from: (table: string) => any;
};

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ProductPerformanceRow {
  id: string;
  name: string;
  category: string;
  supplier_name: string;
  status: 'dormant' | 'declining' | 'active' | string;
  orders_30d: number;
  revenue_30d: number;
  adoption: number;
  isMock: boolean;
}

export interface SupplierPerformanceRow {
  id: string;
  name: string;
  country: string;
  products_count: number;
  quality_score: number;
  risk_score: number;
  status: string;
  last_audit_date: string | null;
  isMock: boolean;
}

export interface ProductFrictionRow {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  environment: string | null;
  created_at: string;
  isMock: boolean;
}

/* -------------------------------------------------------------------------- */
/* Données de démonstration                                                   */
/* -------------------------------------------------------------------------- */

export const useProductPerformanceData = () =>
  useQuery({
    queryKey: ['product_performance_data'],

    queryFn: async (): Promise<{
      rows: ProductPerformanceRow[];
      isMock: boolean;
    }> => {
      const { data: products, error } = await db
        .from('products')
        .select(
          `
            id,
            name,
            category,
            status,
            unit_price,
            selling_price,
            supplier_id,
            created_at
          `,
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(200);

      if (error) {
        throw error;
      }

      if (!products || products.length === 0) {
        return {
          rows: [],
          isMock: false,
        };
      }

      const supplierIds = Array.from(
        new Set(
          products
            .map(
              (product: {
                supplier_id: string | null;
              }) => product.supplier_id,
            )
            .filter(Boolean),
        ),
      );

      const supplierMap: Record<string, string> = {};

      if (supplierIds.length > 0) {
        const { data: suppliers } = await db
          .from('suppliers')
          .select('id, name')
          .in('id', supplierIds);

        (suppliers ?? []).forEach(
          (supplier: {
            id: string;
            name: string | null;
          }) => {
            supplierMap[supplier.id] =
              supplier.name ?? '—';
          },
        );
      }

      const since = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: orders, error: ordersError } =
        await db
          .from('orders')
          .select(
            'catalog_id, total_amount, created_at',
          )
          .gte('created_at', since)
          .limit(1000);

      if (ordersError) {
        throw ordersError;
      }

      const ordersByProduct: Record<
        string,
        {
          count: number;
          revenue: number;
        }
      > = {};

      (orders ?? []).forEach(
        (order: {
          catalog_id: string | null;
          total_amount: number | string | null;
        }) => {
          if (!order.catalog_id) {
            return;
          }

          const key = order.catalog_id;

          if (!ordersByProduct[key]) {
            ordersByProduct[key] = {
              count: 0,
              revenue: 0,
            };
          }

          ordersByProduct[key].count += 1;
          ordersByProduct[key].revenue += Number(
            order.total_amount ?? 0,
          );
        },
      );

      const maxCount = Math.max(
        1,
        ...Object.values(
          ordersByProduct,
        ).map((order) => order.count),
      );

      const rows = products.map(
        (product: {
          id: string;
          name: string;
          category: string | null;
          supplier_id: string | null;
        }): ProductPerformanceRow => {
          const orderStats =
            ordersByProduct[product.id] ?? {
              count: 0,
              revenue: 0,
            };

          const adoption = Math.round(
            (orderStats.count / maxCount) * 100,
          );

          const status =
            orderStats.count === 0
              ? 'dormant'
              : orderStats.count < maxCount * 0.2
                ? 'declining'
                : 'active';

          return {
            id: product.id,
            name: product.name,
            category:
              product.category || '—',
            supplier_name:
              (product.supplier_id
                ? supplierMap[product.supplier_id]
                : null) || '—',
            status,
            orders_30d: orderStats.count,
            revenue_30d: orderStats.revenue,
            adoption,
            isMock: false,
          };
        },
      );

      return {
        rows,
        isMock: false,
      };
    },
  });

/* -------------------------------------------------------------------------- */
/* Fournisseurs — données utiles à l'analyse produit                          */
/* -------------------------------------------------------------------------- */

export const useProductSupplierData = () =>
  useQuery({
    queryKey: ['product_supplier_data'],

    queryFn: async (): Promise<{
      rows: SupplierPerformanceRow[];
      isMock: boolean;
    }> => {
      const {
        data: suppliers,
        error: suppliersError,
      } = await db
        .from('suppliers')
        .select(
          `
            id,
            name,
            country,
            status,
            risk_score,
            quality_score,
            last_audit_date
          `,
        )
        .order('name')
        .limit(200);

      if (suppliersError) {
        throw suppliersError;
      }

      if (!suppliers || suppliers.length === 0) {
        return {
          rows: [],
          isMock: false,
        };
      }

      const {
        data: products,
        error: productsError,
      } = await db
        .from('products')
        .select('id, supplier_id');

      if (productsError) {
        throw productsError;
      }

      const productCountBySupplier: Record<
        string,
        number
      > = {};

      (products ?? []).forEach(
        (product: {
          supplier_id: string | null;
        }) => {
          if (!product.supplier_id) {
            return;
          }

          productCountBySupplier[
            product.supplier_id
          ] =
            (productCountBySupplier[
              product.supplier_id
            ] ?? 0) + 1;
        },
      );

      const rows = suppliers.map(
        (supplier: {
          id: string;
          name: string | null;
          country: string | null;
          status: string | null;
          risk_score: number | null;
          quality_score: number | null;
          last_audit_date: string | null;
        }): SupplierPerformanceRow => ({
          id: supplier.id,
          name: supplier.name ?? '—',
          country: supplier.country ?? '—',

          products_count:
            productCountBySupplier[
              supplier.id
            ] ?? 0,

          quality_score:
            supplier.quality_score ?? 50,

          risk_score:
            supplier.risk_score ?? 50,

          status:
            supplier.status ?? 'active',

          last_audit_date:
            supplier.last_audit_date,

          isMock: false,
        }),
      );

      return {
        rows,
        isMock: false,
      };
    },
  });

/* -------------------------------------------------------------------------- */
/* Produit & Engineering — frictions et anomalies                            */
/* -------------------------------------------------------------------------- */

export const useProductFrictionsData = () =>
  useQuery({
    queryKey: ['product_frictions_data'],

    queryFn: async (): Promise<{
      rows: ProductFrictionRow[];
      isMock: boolean;
    }> => {
      const { data: bugs, error } = await db
        .from('bugs')
        .select(
          `
            id,
            title,
            description,
            severity,
            status,
            environment,
            created_at
          `,
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(200);

      if (error) {
        throw error;
      }

      if (!bugs || bugs.length === 0) {
        return {
          rows: [],
          isMock: false,
        };
      }

      const rows = bugs.map(
        (bug: {
          id: string;
          title: string;
          description: string | null;
          severity: string;
          status: string;
          environment: string | null;
          created_at: string;
        }): ProductFrictionRow => ({
          id: bug.id,
          title: bug.title,
          description: bug.description,
          severity: bug.severity,
          status: bug.status,
          environment: bug.environment,
          created_at: bug.created_at,
          isMock: false,
        }),
      );

      return {
        rows,
        isMock: false,
      };
    },
  });

/* -------------------------------------------------------------------------- */
/* Compatibilité temporaire                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Alias historiques pour les anciens écrans R&D.
 *
 * Ils seront supprimés une fois les consommateurs migrés.
 */

export const useRDProductsData =
  useProductPerformanceData;

export const useRDSuppliersData =
  useProductSupplierData;

export const useRDFrictionsData =
  useProductFrictionsData;