export type PoleId =
  | 'direction'
  | 'finance'
  | 'ops'
  | 'supplier'
  | 'marketplace'
  | 'support'
  | 'marketing'
  | 'rh'
  | 'audit'
  | 'compliance'
  | 'rse'
  | 'product'
  | 'data'
  | 'security'

  // Identifiants legacy conservés temporairement
  // pour assurer la compatibilité pendant la migration.
  | 'tech'
  | 'lifecycle'
  | 'rd'
  | 'risk';
