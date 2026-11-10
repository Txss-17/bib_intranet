import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {INTRANET_CHANGE_CHANNEL,INTRANET_CHANGE_EVENT} from '@/lib/intranetSync';

// Mounted once for the entire intranet, not once for each pole.
// Re-fetches always use the signed-in user's own permissions and test/live scope.
export function IntranetSyncCoordinator(){
 const qc=useQueryClient();
 useEffect(()=>{
  let scheduled: ReturnType<typeof setTimeout>|undefined;
  const invalidate=()=>{
   if(scheduled)clearTimeout(scheduled);
   // Coalesce many mutations in one transaction or wizard into one refetch.
   scheduled=setTimeout(()=>{scheduled=undefined;void qc.invalidateQueries({type:'active'});},250);
  };
  const onMessage=(event:MessageEvent)=>{
   if(event.data?.type==='invalidate'&&event.data?.version===1){
    window.dispatchEvent(new Event(INTRANET_CHANGE_EVENT));
   }
  };
  window.addEventListener(INTRANET_CHANGE_EVENT,invalidate);
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(INTRANET_CHANGE_CHANNEL):null;
  if(channel)channel.addEventListener('message',onMessage);
  return ()=>{
   if(scheduled)clearTimeout(scheduled);
   window.removeEventListener(INTRANET_CHANGE_EVENT,invalidate);
   if(channel){channel.removeEventListener('message',onMessage);channel.close();}
  };
 },[qc]);
 return null;
}
