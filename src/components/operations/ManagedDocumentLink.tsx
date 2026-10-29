import { forwardRef } from 'react';
import { managedDocumentId,openManagedDocument } from '@/lib/driveDocuments';
import { toast } from 'sonner';
export const ManagedDocumentLink=forwardRef<HTMLButtonElement,React.ButtonHTMLAttributes<HTMLButtonElement>&{url:string}>(({url,children,...props},ref)=><button {...props} ref={ref} type="button" title={managedDocumentId(url)?'Consulter dans l’espace documentaire BIB':'Document historique : import Drive BIB requis'} onClick={e=>{e.preventDefault();try{openManagedDocument(url)}catch(error){toast.error((error as Error).message)}}}>{children}</button>);
ManagedDocumentLink.displayName='ManagedDocumentLink';
