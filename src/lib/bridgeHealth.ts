/** Advisory operator signal; not a contractual sync SLA or a cron health check. */
export type BridgeHealth = {
 level: 'unknown' | 'ok' | 'warning' | 'critical';
 message: string;
 lastPullAt: string | null;
};
type Run = { action: string; started_at: string; status: string };
export function assessBridgeHealth(runs: Run[], nowMs: number, advisoryAgeHours = 24): BridgeHealth {
 if (!Number.isFinite(nowMs)) throw new Error('invalid current time');
 const pulls = runs.filter(run => run.action === 'pull' && Number.isFinite(Date.parse(run.started_at)))
  .sort((a,b) => Date.parse(b.started_at) - Date.parse(a.started_at));
 const latest = pulls[0];
 if (!latest) return {
  level: 'unknown',
  message: 'Aucun import Platform confirmé dans ce journal. La liaison et sa programmation restent à vérifier.',
  lastPullAt: null,
 };
 if (latest.status === 'error') return {
  level: 'critical',
  message: 'Dernier import Platform en échec. Le contenu Intranet peut être obsolète ; consulter le journal et réparer la source.',
  lastPullAt: latest.started_at,
 };
 if (latest.status === 'partial') return {
  level: 'critical',
  message: 'Dernier import Platform partiel. Des objets peuvent ne pas avoir été synchronisés.',
  lastPullAt: latest.started_at,
 };
 if (latest.status === 'running') return {
  level: 'warning',
  message: 'Dernier import encore marqué en cours. Vérifier son résultat et sa durée avant de conclure.',
  lastPullAt: latest.started_at,
 };
 if (latest.status !== 'success') return {
  level: 'warning',
  message: 'Statut du dernier import Platform non confirmé.',
  lastPullAt: latest.started_at,
 };
 const delta = nowMs - Date.parse(latest.started_at);
 if (delta < 0) return { level:'warning', message:'Date du dernier import postérieure à l’heure courante : vérifier les horloges.',lastPullAt:latest.started_at };
 if (delta > advisoryAgeHours * 3_600_000) return {
  level:'warning',
  message:`Dernier import Platform réussi il y a plus de ${advisoryAgeHours} h. Vérifier la fraîcheur des données et la programmation : ce seuil est indicatif.`,
  lastPullAt:latest.started_at,
 };
 return {
  level:'ok',
  message:'Dernier import Platform marqué réussi dans le journal. Cela ne prouve pas que la synchronisation est automatisée.',
  lastPullAt:latest.started_at,
 };
}
