export type DriveConfig = { domain: string; serviceEmail: string; privateKey: string; custodian: string; folder: string; appOrigin: string };
export class DriveError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const driveId = (value: unknown): string => {
 if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{10,150}$/.test(value)) throw new DriveError('Identifiant Drive invalide.');
 return value;
};
export function parseDriveId(value: unknown) {
 if (typeof value !== 'string') throw new DriveError('Lien Drive requis.');
 if (/^[A-Za-z0-9_-]{10,150}$/.test(value)) return value;
 let url: URL; try { url = new URL(value); } catch { throw new DriveError('Lien Drive invalide.'); }
 if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname) || url.username || url.password || url.port) throw new DriveError('Utilisez un lien Google Drive BIB.');
 return driveId(url.pathname.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] || url.searchParams.get('id'));
}
export function workspaceEmail(value: string, domain: string) {
 const email = value.trim().toLowerCase();
 if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.split('@')[1] !== domain.toLowerCase()) throw new DriveError('Un compte Google Workspace BIB est requis.', 403);
 return email;
}
export function getDriveConfig(get: (key: string) => string | undefined): DriveConfig {
 const domain = get('BIB_WORKSPACE_DOMAIN')?.trim().toLowerCase();
 const serviceEmail = get('GOOGLE_SERVICE_ACCOUNT_EMAIL'); const privateKey = get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
 const custodian = get('BIB_DRIVE_CUSTODIAN'); const folder = get('BIB_DRIVE_MANAGED_FOLDER_ID'); const appOrigin = get('BIB_APP_ORIGIN');
 if (!domain || !serviceEmail || !privateKey || !custodian || !folder || !appOrigin) throw new DriveError('Google Drive BIB doit être configuré par l’administrateur.', 503);
 const origin = new URL(appOrigin); if (origin.protocol !== 'https:' || origin.origin !== appOrigin || origin.username || origin.password) throw new DriveError('Configuration de l’origine BIB invalide.', 503);
 return { domain, serviceEmail, privateKey: privateKey.replace(/\\n/g, '\n'), custodian: workspaceEmail(custodian, domain), folder: driveId(folder), appOrigin };
}
const b64url = (value: Uint8Array) => { let binary = ''; for (const b of value) binary += String.fromCharCode(b); return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const text64 = (v: unknown) => b64url(new TextEncoder().encode(JSON.stringify(v)));
export type DriveFile = { id: string; name: string; mimeType: string; size?: string; trashed?: boolean; appProperties?: Record<string, string>; permissions?: { id: string; type: string; emailAddress?: string; role: string; expirationTime?: string }[]; capabilities?: { canDownload?: boolean; canCopy?: boolean }; downloadRestrictions?: { effectiveDownloadRestrictionWithContext?: { restrictedForReaders?: boolean; restrictedForWriters?: boolean } } };
export class WorkspaceDrive {
 private tokens = new Map<string, { token: string; until: number }>();
 constructor(public config: DriveConfig, private request: typeof fetch = fetch) {}
 async token(email: string) {
  email = workspaceEmail(email, this.config.domain); const prior = this.tokens.get(email); if (prior && prior.until > Date.now()) return prior.token;
  const now = Math.floor(Date.now() / 1000); const header = text64({ alg: 'RS256', typ: 'JWT' });
  const claims = text64({ iss: this.config.serviceEmail, sub: email, aud: 'https://oauth2.googleapis.com/token', scope: 'https://www.googleapis.com/auth/drive', iat: now, exp: now + 3600 });
  const pem = this.config.privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const raw = Uint8Array.from(atob(pem), c => c.charCodeAt(0)); const key = await crypto.subtle.importKey('pkcs8', raw, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const response = await this.request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(new Uint8Array(signature))}` }) });
  if (!response.ok) throw new DriveError('Connexion à Google Workspace impossible.', 502);
  const result = await response.json(); if (typeof result.access_token !== 'string') throw new DriveError('Connexion à Google Workspace impossible.', 502);
  this.tokens.set(email, { token: result.access_token, until: Date.now() + 3000000 }); return result.access_token as string;
 }
 async api(email: string, path: string, options: RequestInit = {}, upload = false) {
  const token = await this.token(email); const headers = new Headers(options.headers); headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await this.request(`https://www.googleapis.com/${upload ? 'upload/' : ''}drive/v3/${path}`, { ...options, headers });
  if (!response.ok) throw new DriveError(response.status === 404 ? 'Fichier Drive introuvable ou non autorisé.' : 'Google Drive a refusé l’opération.', response.status === 404 ? 404 : 502);
  return response;
 }
 async metadata(email: string, id: string) {
  return await (await this.api(email, `files/${driveId(id)}?supportsAllDrives=true&fields=id,name,mimeType,size,trashed,appProperties,capabilities,downloadRestrictions,permissions(id,type,emailAddress,role,expirationTime)`)).json() as DriveFile;
 }
 async assertManagedFolder() {
  const folder = await this.metadata(this.config.custodian, this.config.folder);
  if (folder.mimeType !== 'application/vnd.google-apps.folder' || folder.trashed || !folder.permissions?.length || folder.permissions.some(p => p.type !== 'user' || p.emailAddress?.toLowerCase() !== this.config.custodian)) throw new DriveError('Le dossier documentaire BIB doit être privé et réservé au compte de conservation.', 503);
 }
 async generateId(email = this.config.custodian, type: 'files' | 'shortcuts' = 'files') {
  const result = await (await this.api(email, `files/generateIds?count=1&space=drive&type=${type}`)).json(); return driveId(result.ids?.[0]);
 }
 async bytes(email: string, file: DriveFile, max = 20000000) {
  const native = file.mimeType.startsWith('application/vnd.google-apps.');
  if (file.trashed || file.mimeType === 'application/vnd.google-apps.shortcut' || file.mimeType === 'application/vnd.google-apps.folder' || Number(file.size || 0) > max || file.capabilities?.canDownload === false) throw new DriveError('Ce fichier ne peut pas être importé.');
  const path = native ? `files/${driveId(file.id)}/export?mimeType=application%2Fpdf` : `files/${driveId(file.id)}?alt=media&supportsAllDrives=true`;
  const response = await this.api(email, path); if (Number(response.headers.get('content-length') || 0) > max) throw new DriveError('Document trop volumineux.');
  const reader = response.body?.getReader(); if (!reader) throw new DriveError('Document vide.');
  const chunks: Uint8Array[] = []; let length = 0; try { while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > max) throw new DriveError('Document trop volumineux.'); chunks.push(part.value); } } finally { await reader.cancel().catch(() => undefined); }
  const result = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; } return result;
 }
 async upload(id: string, name: string, mime: string, bytes: Uint8Array, job: string, hash: string) {
  try { const existing = await this.metadata(this.config.custodian, id); if (existing.appProperties?.bib_job !== job || existing.appProperties?.bib_hash !== hash) throw new DriveError('Conflit documentaire.', 409); return existing; } catch (e) { if (!(e instanceof DriveError) || e.status !== 404) throw e; }
  const boundary = `bib_${crypto.randomUUID()}`; const prefix = new TextEncoder().encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ id, name, parents: [this.config.folder], appProperties: { bib_job: job, bib_hash: hash } })}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`); const suffix = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(prefix.length + bytes.length + suffix.length); body.set(prefix); body.set(bytes, prefix.length); body.set(suffix, prefix.length + bytes.length);
  await this.api(this.config.custodian, 'files?uploadType=multipart&supportsAllDrives=true&fields=id', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }, true);
  return this.metadata(this.config.custodian, id);
 }
 async protect(id: string) {
  await this.api(this.config.custodian, `files/${driveId(id)}?supportsAllDrives=true`, { method: 'PATCH', body: JSON.stringify({ downloadRestrictions: { itemDownloadRestriction: { restrictedForReaders: true, restrictedForWriters: true } } }) });
  const result = await this.metadata(this.config.custodian, id); const restriction = result.downloadRestrictions?.effectiveDownloadRestrictionWithContext;
  if (!restriction?.restrictedForReaders || !restriction?.restrictedForWriters) throw new DriveError('Les restrictions documentaires n’ont pas pu être vérifiées.', 502);
 }
 async grantReader(id: string, recipient: string, expires?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new DriveError('Destinataire invalide.');
  const result = await (await this.api(this.config.custodian, `files/${driveId(id)}/permissions?fields=permissions(id,emailAddress,role,expirationTime)&supportsAllDrives=true`)).json();
  const existing = result.permissions?.find((p: { emailAddress?: string; role?: string }) => p.emailAddress?.toLowerCase() === recipient.toLowerCase() && p.role === 'reader');
  if (existing && (!expires || existing.expirationTime)) return;
  await this.api(this.config.custodian, `files/${driveId(id)}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, { method: 'POST', body: JSON.stringify({ type: 'user', role: 'reader', emailAddress: recipient, ...(expires ? { expirationTime: expires } : {}) }) });
 }
 async shortcut(email: string, id: string, target: string, name: string) {
  try { const result = await this.metadata(email, id); if (result.mimeType === 'application/vnd.google-apps.shortcut') return; throw new DriveError('Conflit de destination.', 409); } catch (e) { if (!(e instanceof DriveError) || e.status !== 404) throw e; }
  await this.api(email, 'files?fields=id', { method: 'POST', body: JSON.stringify({ id, name, mimeType: 'application/vnd.google-apps.shortcut', shortcutDetails: { targetId: driveId(target) } }) });
 }
 async list(email: string, search: string, pageToken?: string) {
  const clean = search.slice(0, 100).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = new URLSearchParams({ q: `trashed=false and mimeType!='application/vnd.google-apps.folder'${clean ? ` and name contains '${clean}'` : ''}`, fields: 'nextPageToken,files(id,name,mimeType,size)', pageSize: '50' }); if (pageToken) query.set('pageToken', pageToken);
  return (await this.api(email, 'files?' + query)).json();
 }
}
export function decodeDocumentBase64(value: unknown, max = 20000000) {
 if (typeof value !== 'string' || value.length > Math.ceil(max * 4 / 3) + 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new DriveError('Contenu documentaire invalide.');
 let binary: string; try { binary = atob(value); } catch { throw new DriveError('Contenu documentaire invalide.'); }
 if (binary.length === 0 || binary.length > max) throw new DriveError('Document vide ou trop volumineux.');
 return Uint8Array.from(binary, c => c.charCodeAt(0));
}
export async function documentHash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b => b.toString(16).padStart(2, '0')).join(''); }
export async function readBoundedJson(request: Request, max: number): Promise<Record<string, unknown>> {
 if (Number(request.headers.get('content-length') || 0) > max) throw new DriveError('Demande trop volumineuse.', 413);
 const reader = request.body?.getReader(); if (!reader) throw new DriveError('Demande vide.');
 const chunks: Uint8Array[] = []; let size = 0;
 try { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > max) throw new DriveError('Demande trop volumineuse.', 413); chunks.push(chunk.value); } } finally { await reader.cancel().catch(() => undefined); }
 const value = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { value.set(chunk, offset); offset += chunk.length; }
 let parsed: unknown; try { parsed = JSON.parse(new TextDecoder().decode(value)); } catch { throw new DriveError('Demande JSON invalide.'); }
 if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new DriveError('Demande JSON invalide.'); return parsed as Record<string, unknown>;
}
