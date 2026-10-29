export function normalizedEthicsReport(value: unknown) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Signalement invalide.');
 const input = value as Record<string, unknown>;
 const mode = input.mode === 'identified' ? 'identified' : 'anonymous';
 const text = (key: string, max = 20000) => { const value = input[key]; if (value == null) return ''; if (typeof value !== 'string' || value.length > max) throw new Error('Champ de signalement invalide.'); return value.trim(); };
 const report = { mode, category: text('category', 100), severity: text('severity', 20), title: text('title', 255), facts: text('facts'), date: text('date', 20), location: text('location', 255), persons: text('persons', 2000), witnesses: text('witnesses', 2000), evidence: text('evidence', 5000), ...(mode === 'identified' ? { name: text('name', 255), email: text('email', 254), phone: text('phone', 50) } : {}) };
 if (!report.category || !report.facts || !['low', 'medium', 'high', 'critical'].includes(report.severity) || input.consent !== true) throw new Error('Catégorie, faits, priorité et consentement sont requis.');
 if (mode === 'identified' && (!('name' in report) || !report.name || !('email' in report) || typeof report.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.email))) throw new Error('Nom et email requis en mode identifié.');
 return report;
}
async function key(value: string) { const raw = Uint8Array.from(atob(value), c => c.charCodeAt(0)); if (raw.length !== 32) throw new Error('Configuration du chiffrement indisponible.'); return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
const encode = (bytes: Uint8Array) => { let result = ''; for (const byte of bytes) result += String.fromCharCode(byte); return btoa(result); };
const decode = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
export async function encryptEthics(value: unknown, secret: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(secret), new TextEncoder().encode(JSON.stringify(value))); return JSON.stringify({ v: 1, iv: encode(iv), data: encode(new Uint8Array(cipher)) }); }
export async function decryptEthics(value: string, secret: string) { const envelope = JSON.parse(value); if (envelope.v !== 1 || typeof envelope.iv !== 'string' || typeof envelope.data !== 'string') throw new Error('Format de signalement non pris en charge.'); const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, await key(secret), decode(envelope.data)); return JSON.parse(new TextDecoder().decode(plain)); }
