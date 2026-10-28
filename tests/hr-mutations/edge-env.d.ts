declare const Deno: { env: { get(key:string):string|undefined }; serve(handler:(request:Request)=>Promise<Response>):void };
declare module "https://esm.sh/@supabase/supabase-js@2.58.0" { export function createClient(...args:any[]):any; }
