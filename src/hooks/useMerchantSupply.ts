import type {SupabaseClient} from "@supabase/supabase-js";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {intranetRpc} from "@/lib/intranet";
import {useAuth} from "@/hooks/useAuth";
import type {SupplyQuote,SupplyParty} from "@/components/supply/SupplyQuoteSummary";
export interface SupplyOptions {operator:SupplyParty|null;buyers:{boutique_id:string;merchant_id:string;name:string;party:SupplyParty}[]}
export function useMerchantSupply(){
 const {user,profile}=useAuth();
 return useQuery({queryKey:["merchant-supply",user?.id,profile?.test_account],enabled:!!user&&!!profile,refetchInterval:30000,queryFn:async()=>{
  const client=supabase as unknown as SupabaseClient;
  const [quotes,prices,products,suppliers,options,requests]=await Promise.all([
   client.from("merchant_supply_quotes").select("*").order("updated_at",{ascending:false}).limit(500),
   client.from("catalog_acquisition_prices").select("*").order("created_at",{ascending:false}).limit(500),
   client.from("products").select("id,name,supplier_id,sku").order("name").limit(500),
   client.from("suppliers").select("id,name,address,email,contact_email").order("name").limit(500),
   intranetRpc<SupplyOptions>("supply_quote_options"),
   client.from("merchant_supply_requests").select("*").order("created_at",{ascending:false}).limit(500),
  ]);
  for(const result of [quotes,prices,products,suppliers,requests])if(result.error)throw result.error;
  return {quotes:(quotes.data??[]) as SupplyQuote[],prices:(prices.data??[]) as SupplyPrice[],products:(products.data??[]) as {id:string;name:string;supplier_id:string;sku:string|null}[],suppliers:(suppliers.data??[]) as {id:string;name:string;address:string|null;email:string|null;contact_email:string|null}[],options,requests:(requests.data??[]) as SupplyRequest[]};
 }});
}
export interface SupplyRequest {id:string;catalog_id:string;merchant_id:string;boutique_id:string;state:string;request:{quantity:number;purpose:"sample"|"stock"|"on_demand";note:string}}
export function useSupplyCommand(){
 const qc=useQueryClient();
 return useMutation({mutationFn:({name,args}:{name:string;args:Record<string,unknown>})=>intranetRpc<SupplyQuote>(name,args),onSuccess:()=>qc.invalidateQueries({queryKey:["merchant-supply"]})});
}

export interface SupplyPrice {id:string;product_id:string;total_cents:number;state:string;evidence_reference:string}
