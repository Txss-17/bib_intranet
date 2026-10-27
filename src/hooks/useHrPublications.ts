import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { hrPublicationPayload, hrPublicationError, effectiveHrPublicationPermissions, type HrPublication, type HrPublicationInput } from "@/lib/hrPublications";

interface PublicationPermissions { read:boolean; create:boolean; update:boolean; publish:boolean }
export function useHrPublicationPermissions() {
  const { user }=useAuth();
  const simulation=usePermissions();
  const query=useQuery({
    queryKey:["hr-publication-permissions",user?.id],
    enabled:!!user, staleTime:15_000,refetchInterval:30_000,
    queryFn:async ():Promise<PublicationPermissions>=>{
      const {data,error}=await supabase.rpc("get_hr_publication_permissions" as never);
      if(error) throw new Error("Vos droits n’ont pas pu être vérifiés.");
      if(!data || typeof data!=="object" || Array.isArray(data)) throw new Error("Droits indisponibles.");
      return data as unknown as PublicationPermissions;
    },
  });
  // A role preview may narrow the actor's real permissions, never enlarge them.
  const actual=query.data;
  const preview=simulation.isSimulating?{
    read:simulation.can("rh.publications","read"),
    create:simulation.can("rh.publications","create"),
    update:simulation.can("rh.publications","update"),
    publish:simulation.can("rh.publications","publish"),
  }:undefined;
  const data=actual?effectiveHrPublicationPermissions(actual,preview):undefined;
  return {...query,data};
}
export function useHrPublications() {
  const {user}=useAuth();
  const rights=useHrPublicationPermissions();
  return useQuery({
    queryKey:["hr-publications",user?.id],
    enabled:!!user&&rights.data?.read===true,
    refetchInterval:30_000,
    queryFn:async ():Promise<HrPublication[]>=>{
      const {data,error}=await supabase.rpc("list_hr_publications" as never);
      if(error) throw new Error(hrPublicationError(error));
      return (data??[]) as unknown as HrPublication[];
    },
  });
}
export function useSaveHrPublication() {
  const cache=useQueryClient();
  return useMutation({
    mutationFn:async(input:HrPublicationInput):Promise<HrPublication>=>{
      const payload=hrPublicationPayload(input);
      const {data,error}=await supabase.rpc("save_hr_publication" as never,payload as never);
      if(error) throw new Error(hrPublicationError(error));
      const row=data as unknown as HrPublication|null;
      if(!row?.id||row.status!==input.status||!row.updated_at)
        throw new Error("La confirmation n’a pas pu être obtenue. Réessayez la même action.");
      return row;
    },
    onSuccess:async(row)=>{
      toast.success(row.status==="published"?"Publication enregistrée":row.status==="archived"?"Publication archivée":"Brouillon enregistré");
      await Promise.all([
        cache.invalidateQueries({queryKey:["hr-publications"]}),
        cache.invalidateQueries({queryKey:["publications"]}),
      ]);
    },
    onError:()=>{
      void cache.invalidateQueries({queryKey:["hr-publications"]});
      void cache.invalidateQueries({queryKey:["hr-publication-permissions"]});
    },
  });
}
