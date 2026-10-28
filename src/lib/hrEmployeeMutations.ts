export interface HrAttachedDocument { name:string; document_type:string; document_url:string|null }
export interface HrMutationAssignment {
  id:string; role_id?:string|null; role_key:string|null; label:string; scope_id?:string|null; scope_value:string|null;
  status?:string; starts_at?:string|null; ends_at?:string|null; updated_at?:string;
}
export interface HrMutationTarget {
  id:string; revision:string; first_name:string; last_name:string; email:string;
  position_key:string|null; position:string|null; poles:string[]; seniority:string|null; collaborator_type:string;
  manager_id:string|null; work_mode:string|null; subsidiary:string|null; hr_status:string; requested_role:string|null;
  contract_type:string|null; start_date:string|null; attached_documents:HrAttachedDocument[];
  assignments:HrMutationAssignment[]; technical_roles:string[];
}
export interface HrMutationClassification {
  position:string; primary_pole:string; poles:string[]; seniority:string; requested_role:string;
  contract_type:string|null; start_date:string|null; manager_id:string|null; work_mode:string|null;
  subsidiary:string|null; notes:string|null; attached_documents:HrAttachedDocument[];
}
export interface HrMutationSubmission {
  targetUserId:string; creationKey:string; expectedTargetRevision:string; replaceAssignmentIds:string[];
  payload:HrMutationClassification;
}
export interface HrOnboardingPermissions { read:boolean; create:boolean; validate:boolean; apply:boolean }
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const knownPoles=["direction","finance","ops","supplier","marketplace","support","marketing","rh","audit","compliance","rse","product","data","security"];
function clean(value:unknown,max:number,required=false):string|null {
  if(value==null&&!required)return null;
  if(typeof value!=="string"||value.trim().length>max||(required&&!value.trim()))throw new Error("Vérifiez les champs obligatoires et leur longueur.");
  return value.trim()||null;
}
export function hrMutationPayload(input:HrMutationSubmission) {
  if(!uuid.test(input.targetUserId)||!uuid.test(input.creationKey)||!/^[a-f0-9]{32}$/i.test(input.expectedTargetRevision))
    throw new Error("Sélectionnez à nouveau le collaborateur pour vérifier sa fiche actuelle.");
  if(!Array.isArray(input.replaceAssignmentIds)||input.replaceAssignmentIds.some(id=>!uuid.test(id))
    ||new Set(input.replaceAssignmentIds).size!==input.replaceAssignmentIds.length)
    throw new Error("Vérifiez les affectations sélectionnées pour remplacement.");
  const payload=input.payload;
  const expected=["position","primary_pole","poles","seniority","requested_role","contract_type","start_date","manager_id","work_mode","subsidiary","notes","attached_documents"];
  if(!payload||Object.keys(payload).some(key=>!expected.includes(key)))throw new Error("La demande contient un champ non pris en charge.");
  if(!Array.isArray(payload.poles)||payload.poles.length<1||payload.poles.length>14
      ||payload.poles.some(pole=>!knownPoles.includes(pole))||new Set(payload.poles).size!==payload.poles.length
      ||!payload.poles.includes(payload.primary_pole))
    throw new Error("Le pôle principal doit figurer parmi les pôles sélectionnés.");
  if(!["junior","mid","senior","lead","executive"].includes(payload.seniority)
      ||!["office","hybrid","remote"].includes(payload.work_mode??""))
    throw new Error("Vérifiez la séniorité et le mode de travail.");
  if(!payload.start_date||!/^\d{4}-\d{2}-\d{2}$/.test(payload.start_date)
      ||!Number.isFinite(Date.parse(payload.start_date+"T00:00:00Z"))
      ||new Date(payload.start_date+"T00:00:00Z").toISOString().slice(0,10)!==payload.start_date
      ||!payload.manager_id||!uuid.test(payload.manager_id)||payload.manager_id===input.targetUserId)
    throw new Error("Renseignez une date d’effet et un référent RH distincts du collaborateur.");
  if(!Array.isArray(payload.attached_documents)||payload.attached_documents.length>50)
    throw new Error("Vérifiez les documents joints (50 maximum).");
  const documents=payload.attached_documents.map(doc=>{
    const name=clean(doc.name,200,true)!,type=clean(doc.document_type,50,true)!,url=clean(doc.document_url,2048);
    if(url){let parsed:URL;try{parsed=new URL(url);}catch{throw new Error("Les documents doivent utiliser une adresse HTTPS valide.");}
      if(parsed.protocol!=="https:"||parsed.username||parsed.password)throw new Error("Les documents doivent utiliser une adresse HTTPS valide.");}
    return {name,document_type:type,document_url:url};
  });
  return {
    p_target_user_id:input.targetUserId,p_creation_key:input.creationKey,
    p_expected_target_revision:input.expectedTargetRevision.toLowerCase(),
    p_replace_assignment_ids:[...input.replaceAssignmentIds].sort(),
    p_payload:{
      position:clean(payload.position,200,true)!,primary_pole:payload.primary_pole,poles:[...payload.poles].sort(),
      seniority:payload.seniority,requested_role:clean(payload.requested_role,200,true)!,
      contract_type:clean(payload.contract_type,100),start_date:payload.start_date,manager_id:payload.manager_id,
      work_mode:payload.work_mode,subsidiary:clean(payload.subsidiary,200,true)!,notes:clean(payload.notes,2000),
      attached_documents:documents,
    },
  };
}
export function hrMutationError(error:{code?:string;message?:string}) {
  const message=error.message??"";
  if(message.includes("hr_mutation_target_changed"))return "La fiche ou les accès ont changé. Rien n’a été appliqué. Rechargez et sélectionnez à nouveau le collaborateur.";
  if(message.includes("hr_mutation_creation_conflict")||message.includes("hr_mutation_already_pending"))
    return "Une demande existe déjà pour ce collaborateur ou cette saisie. Actualisez les dossiers pour la consulter.";
  if(message.includes("hr_mutation_not_effective_yet"))return "La date d’effet n’est pas encore atteinte. La mutation reste à appliquer manuellement à partir de cette date.";
  if(message.includes("hr_mutation_pending_access"))return "Des affectations sont en attente pour ce compte. Faites-les traiter avant de préparer une mutation.";
  if(message.includes("hr_mutation_role_scope_ambiguous"))return "Ce rôle possède plusieurs périmètres. Faites préciser son affectation dans Accès et permissions avant de poursuivre.";
  if(message.includes("hr_mutation_leadership_forbidden"))return "L’attribution d’un accès de direction exige un administrateur RH habilité.";
  if(error.code==="42501"||message.includes("forbidden"))return "Vos droits RH ne permettent pas cette opération sur ce compte. Une auto-mutation est interdite.";
  if(error.code==="40001"||message.includes("changed")||message.includes("not_validated"))
    return "Le dossier ou ses droits ont changé. Actualisez sa fiche avant de poursuivre ; aucune nouvelle modification n’a été appliquée.";
  if(error.code==="P0002")return "Le dossier de mutation n’est plus disponible. Actualisez la liste.";
  if(error.code==="22023"||message.includes("invalid"))
    return "Vérifiez les postes, rôles et pôles du catalogue, la date d’effet, le référent RH et les documents.";
  return "La confirmation n’a pas pu être obtenue. Votre saisie est conservée ; actualisez les dossiers ou réessayez la même action.";
}
