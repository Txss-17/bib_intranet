export type HrPublicationStatus = "draft" | "scheduled" | "published" | "archived";
export interface HrPublication {
  id: string; title: string; summary: string | null; body: string | null;
  subtype: string | null; status: HrPublicationStatus; visibility_scope: string;
  visibility_targets: string[]; publish_at: string | null; available_at: string | null;
  archive_at: string | null; author_id: string | null; author_pole: string | null;
  created_at: string; updated_at: string;
}
export interface HrPublicationInput {
  id?: string; expectedUpdatedAt?: string; creationKey?: string;
  title: string; summary: string; body: string;
  subtype: "announcement" | "information" | "planning" | "reminder" | "report";
  status: "draft" | "published" | "archived";
  visibility: "all" | "pole"; poles: string[];
}
const ids = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validPoles = ["direction","finance","ops","supplier","marketplace","support","marketing","rh","audit","compliance","rse","product","data","security"];
export function hrPublicationPayload(input: HrPublicationInput) {
  const title=input.title.trim(), summary=input.summary.trim(), body=input.body.trim();
  if (!title || title.length>255 || summary.length>1000 || body.length>20000)
    throw new Error("Vérifiez le titre (255 caractères), le résumé (1000) et le contenu (20000).");
  if (!["announcement","information","planning","reminder","report"].includes(input.subtype))
    throw new Error("Choisissez une catégorie de publication.");
  if (!["draft","published","archived"].includes(input.status))
    throw new Error("Choisissez un statut valide.");
  if (input.status==="published" && !body)
    throw new Error("Le contenu est obligatoire pour publier.");
  if (!Array.isArray(input.poles) || !["all","pole"].includes(input.visibility)
      || input.poles.some(pole=>!validPoles.includes(pole))
      || (input.visibility==="all" && input.poles.length)
      || (input.visibility==="pole" && !input.poles.length))
    throw new Error("Choisissez une audience et les pôles destinataires.");
  if (input.id && (!ids.test(input.id) || !input.expectedUpdatedAt || !Number.isFinite(Date.parse(input.expectedUpdatedAt))))
    throw new Error("Actualisez la liste avant de modifier cette publication.");
  if (!input.id && (!input.creationKey || !ids.test(input.creationKey) || input.status==="archived"))
    throw new Error("Rouvrez le formulaire pour préparer une nouvelle publication.");
  return {
    p_id:input.id??null,p_expected_updated_at:input.id?input.expectedUpdatedAt:null,
    p_title:title,p_summary:summary||null,p_body:body||null,p_subtype:input.subtype,
    p_status:input.status,p_visibility:input.visibility,p_poles:[...new Set(input.poles)].sort(),
    p_creation_key:input.id?null:input.creationKey,
  };
}
export function hrPublicationError(error: {code?:string;message?:string}) {
  if(error.code==="40001") return "Cette publication a changé. Votre saisie est conservée ; actualisez la liste puis rouvrez la publication avant de réessayer.";
  if(error.code==="42501") return "Vos droits ne permettent pas cette action. Actualisez vos droits ou contactez un responsable RH.";
  if(error.code==="P0002") return "Cette publication n’est plus disponible. Actualisez la liste.";
  if(error.message==="hr_publication_body_required") return "Le contenu est obligatoire pour publier.";
  if(error.code==="22023") return "Vérifiez le contenu, le statut et les pôles destinataires.";
  return "La confirmation n’a pas pu être obtenue. Votre saisie est conservée ; réessayez la même action.";
}

export function isPublicationReleased(row: {
  status:string;publish_at:string|null;available_at:string|null;archive_at:string|null;
},now=Date.now()) {
  const reached=(value:string|null)=>value===null||(Number.isFinite(Date.parse(value))&&Date.parse(value)<=now);
  return row.status==="published"&&reached(row.publish_at)&&reached(row.available_at)
    &&(row.archive_at===null||(Number.isFinite(Date.parse(row.archive_at))&&Date.parse(row.archive_at)>now));
}

export interface HrPublicationPermissions {
  read: boolean; create: boolean; update: boolean; publish: boolean;
}

/** Real server permissions are authoritative; a preview may only narrow them. */
export function effectiveHrPublicationPermissions(
  actual?: Partial<HrPublicationPermissions>,
  preview?: Partial<HrPublicationPermissions>,
): HrPublicationPermissions {
  return Object.fromEntries(
    (["read", "create", "update", "publish"] as const).map((action) => [
      action, actual?.[action] === true && (!preview || preview[action] === true),
    ]),
  ) as unknown as HrPublicationPermissions;
}
