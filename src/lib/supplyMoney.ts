export const supplyMoney=(cents:number,en=false)=>new Intl.NumberFormat(en?"en-IE":"fr-FR",{style:"currency",currency:"EUR"}).format(cents/100);
