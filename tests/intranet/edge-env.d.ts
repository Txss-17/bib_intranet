declare const Deno: { env: { get(key:string):string|undefined }; serve(handler:(request:Request)=>Promise<Response>):void };
declare module 'npm:@supabase/supabase-js@2' { export function createClient(...args:any[]):any; }
declare module 'npm:pdf-lib@1.17.1' { export { PDFDocument, StandardFonts, rgb, degrees, PDFName } from 'pdf-lib'; }
declare module 'npm:xlsx@0.18.5' { export * from 'xlsx'; }
declare module 'npm:jose@5.10.0' { export const SignJWT:any; export function importPKCS8(...args:any[]):Promise<any>; }
