declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
declare module "npm:@supabase/supabase-js@2" {
  export { createClient } from "@supabase/supabase-js";
}
declare module "npm:@supabase/supabase-js@2/cors" {
  export const corsHeaders: Record<string, string>;
}
declare module "npm:zod@3" {
  export { z } from "zod";
}
