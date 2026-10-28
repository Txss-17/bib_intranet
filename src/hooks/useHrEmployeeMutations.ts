import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import type { HrEmployeeRequest } from "@/hooks/useHrOnboarding";
import {
  hrMutationPayload,hrMutationError,normalizeHrOnboardingPermissions,type HrOnboardingPermissions,type HrMutationSubmission,type HrMutationTarget,
} from "@/lib/hrEmployeeMutations";
export type { HrMutationTarget } from "@/lib/hrEmployeeMutations";

export function useHrOnboardingPermissions() {
  const {user}=useAuth();
  const simulation=usePermissions();
  const query=useQuery({
    queryKey:["hr-onboarding-permissions",user?.id],enabled:!!user,staleTime:15_000,refetchInterval:30_000,
    queryFn:async():Promise<HrOnboardingPermissions>=>{
      const {data,error}=await supabase.rpc("get_hr_onboarding_permissions" as never);
      if(error||!data||typeof data!=="object"||Array.isArray(data))throw new Error("Vos droits RH n’ont pas pu être vérifiés.");
      return normalizeHrOnboardingPermissions(data);
    },
  });
  const actual=query.data;
  const data=actual&&Object.fromEntries((["read","create","validate","apply"] as const).map(action=>[
    action,actual[action]===true&&(!simulation.isSimulating||
      (action==="apply"?simulation.can("rh.onboarding","update")&&simulation.can("rh.onboarding","validate"):simulation.can("rh.onboarding",action))),
  ])) as unknown as HrOnboardingPermissions|undefined;
  return {...query,data};
}
export function useHrMutationTargets(search="") {
  const {user}=useAuth();
  const rights=useHrOnboardingPermissions();
  return useQuery({
    queryKey:["hr-mutation-targets",user?.id,search],enabled:!!user&&rights.data?.read===true,
    staleTime:15_000,refetchInterval:30_000,
    queryFn:async():Promise<HrMutationTarget[]>=>{
      const {data,error}=await supabase.rpc("list_hr_mutation_targets" as never,{p_search:search} as never);
      if(error)throw new Error(hrMutationError(error));
      if(!Array.isArray(data))throw new Error("Les comptes ne sont pas disponibles.");
      return data as unknown as HrMutationTarget[];
    },
  });
}
function useMutationRefresh() {
  const cache=useQueryClient();
  return async()=>{
    await Promise.all(["hr_employee_requests","hr_employee_request_events","rh-collaborators","employees","hr-mutation-targets",
      "hr-onboarding-permissions","hr-professional-details","my-hr-professional-details","rh-employee-documents","employee-documents",
      "access-assignments","access-permissions","position-access-profile","user-roles"].map(key=>cache.invalidateQueries({queryKey:[key]})));
  };
}
export function useSubmitHrEmployeeMutation() {
  const refresh=useMutationRefresh();
  return useMutation({
    mutationFn:async(input:HrMutationSubmission):Promise<HrEmployeeRequest>=>{
      const {data,error}=await supabase.rpc("submit_hr_employee_mutation" as never,hrMutationPayload(input) as never);
      if(error)throw new Error(hrMutationError(error));
      const row=data as unknown as HrEmployeeRequest|null;
      if(!row?.id||row.request_kind!=="mutation"||row.target_user_id!==input.targetUserId)
        throw new Error("La demande n’a pas été confirmée. Réessayez la même saisie.");
      return row;
    },
    onSuccess:async()=>{toast.success("Dossier de mutation enregistré");await refresh();},
    onError:()=>{void refresh();},
  });
}
export function useSetHrMutationStatus() {
  const refresh=useMutationRefresh();
  return useMutation({
    mutationFn:async(input:{request:HrEmployeeRequest;status:"hr_validated"|"rejected";note?:string})=>{
      if(input.request.request_kind!=="mutation")throw new Error("Ce dossier ne correspond pas à une mutation.");
      const note=input.note?.trim()||null;
      if(input.status==="rejected"&&!note)throw new Error("Un motif est obligatoire pour refuser.");
      const {data,error}=await supabase.rpc("set_hr_employee_mutation_status" as never,{
        p_request_id:input.request.id,p_status:input.status,p_note:note,
      } as never);
      if(error)throw new Error(hrMutationError(error));
      const row=data as unknown as HrEmployeeRequest|null;
      if(!row?.id||row.status!==input.status)throw new Error("La décision n’a pas été confirmée. Actualisez le dossier.");
      return row;
    },
    onSuccess:async()=>{toast.success("Décision RH enregistrée");await refresh();},
    onError:()=>{void refresh();},
  });
}
export function useApplyHrEmployeeMutation() {
  const refresh=useMutationRefresh();
  return useMutation({
    mutationFn:async(request:HrEmployeeRequest)=>{
      if(request.request_kind!=="mutation")throw new Error("Ce dossier ne correspond pas à une mutation.");
      const {data,error}=await supabase.rpc("apply_hr_employee_mutation" as never,{p_request_id:request.id} as never);
      if(error)throw new Error(hrMutationError(error));
      const result=data as unknown as {requestId?:string;userId?:string;invitationSent?:boolean;accessAssignmentId?:string};
      if(result?.requestId!==request.id||result.userId!==request.target_user_id||result.invitationSent!==false||!result.accessAssignmentId)
        throw new Error("La mutation n’a pas été confirmée. Actualisez le dossier avant de reprendre.");
      return result;
    },
    onSuccess:async()=>{toast.success("Mutation appliquée au compte existant");await refresh();},
    onError:()=>{void refresh();},
  });
}
