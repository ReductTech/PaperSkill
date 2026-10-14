import { useEffect, useReducer } from 'react';

export const councilSections = ['进入议会','认识结构','找到 LoRA','为什么省钱','分配的疑问','比较模块','比较层组','修正认识','本章发现'];
export interface CouncilState {
  version: 1; step: number; structure: 'Attention'|'FFN'|null; visited: string[];
  tuningMode: 'full'|'lora'; modes: string[]; countPrediction: string|null;
  countObserved: boolean; rank: number; rankChanged: boolean; uniformObserved: boolean;
  modulePrediction: string|null; moduleSelection: string|null; moduleRead: boolean;
  layerPrediction: string|null; layerSelection: string|null; layerRead: boolean;
  reflection: string|null; completed: boolean;
}
const key = 'adaptive-engine:act1:v1';
export const councilInitial: CouncilState = {version:1,step:0,structure:null,visited:[],tuningMode:'lora',modes:[],countPrediction:null,countObserved:false,rank:2,rankChanged:false,uniformObserved:false,modulePrediction:null,moduleSelection:null,moduleRead:false,layerPrediction:null,layerSelection:null,layerRead:false,reflection:null,completed:false};
export function eligibleCouncil(s: CouncilState, n: number) {
  return Number.isInteger(n) && n>=0 && n<=8 && (n<=1 ||
    s.visited.length===2 && (n<=2 || s.modes.length===2 && (n<=3 ||
    s.countObserved && s.rankChanged && (n<=4 || s.uniformObserved && (n<=5 ||
    s.moduleRead && (n<=6 || s.layerRead && (n<=7 || s.completed)))))));
}
type Action = {type:'step';value:number}|{type:'structure';value:'Attention'|'FFN'}|{type:'mode';value:'full'|'lora'}|
  {type:'predictCount'|'predictModule'|'predictLayer'|'reflect';value:string}|{type:'rank';value:number}|
  {type:'selectModule'|'selectLayer';value:string}|{type:'observeCount'|'uniform'|'readModule'|'readLayer'|'complete'|'reset'};
export function councilReducer(s: CouncilState,a: Action): CouncilState {
  switch(a.type){
    case 'step': return eligibleCouncil(s,a.value)?{...s,step:a.value}:s;
    case 'structure': return {...s,structure:a.value,visited:[...new Set([...s.visited,a.value])]};
    case 'mode': return {...s,tuningMode:a.value,modes:[...new Set([...s.modes,a.value])]};
    case 'predictCount': return s.countPrediction || !['fewer','same','more'].includes(a.value)?s:{...s,countPrediction:a.value};
    case 'observeCount': return s.countPrediction?{...s,countObserved:true}:s;
    case 'rank': return s.countObserved && Number.isInteger(a.value) && a.value>=1 && a.value<=8?{...s,rank:a.value,rankChanged:s.rankChanged||a.value!==s.rank}:s;
    case 'uniform': return {...s,uniformObserved:true};
    case 'predictModule': return s.modulePrediction || !['attention','ffn','same'].includes(a.value)?s:{...s,modulePrediction:a.value};
    case 'selectModule': return ['Wq','Wk','Wv','Wo','Wf1','Wf2'].includes(a.value)?{...s,moduleSelection:a.value}:s;
    case 'readModule': return s.modulePrediction && s.moduleSelection?{...s,moduleRead:true}:s;
    case 'predictLayer': return s.layerPrediction || !['lower','higher','same'].includes(a.value)?s:{...s,layerPrediction:a.value};
    case 'selectLayer': return ['1–3','4–6','7–9','10–12'].includes(a.value)?{...s,layerSelection:a.value}:s;
    case 'readLayer': return s.layerPrediction && s.layerSelection?{...s,layerRead:true}:s;
    case 'reflect': return s.completed || !['universal','conditional','rank'].includes(a.value)?s:{...s,reflection:a.value};
    case 'complete': return eligibleCouncil(s,7) && s.reflection==='conditional'?{...s,completed:true,step:8}:s;
    case 'reset': return {...councilInitial,visited:[],modes:[]};
  }
}
export function restoreCouncil(): CouncilState {
  try {
    const s=JSON.parse(localStorage.getItem(key)||'null');
    if(!s || s.version!==1 || !Number.isInteger(s.step) || !Number.isInteger(s.rank) || s.rank<1 || s.rank>8) return councilInitial;
    const enums: Record<string,(string|null)[]>={structure:[null,'Attention','FFN'],tuningMode:['full','lora'],countPrediction:[null,'fewer','same','more'],modulePrediction:[null,'attention','ffn','same'],layerPrediction:[null,'lower','higher','same'],moduleSelection:[null,'Wq','Wk','Wv','Wo','Wf1','Wf2'],layerSelection:[null,'1–3','4–6','7–9','10–12'],reflection:[null,'universal','conditional','rank']};
    if(Object.entries(enums).some(([k,values])=>!values.includes(s[k]))) return councilInitial;
    if(['countObserved','rankChanged','uniformObserved','moduleRead','layerRead','completed'].some(k=>typeof s[k]!=='boolean')) return councilInitial;
    for(const [k,values] of [['visited',['Attention','FFN']],['modes',['full','lora']]] as const){if(!Array.isArray(s[k]) || s[k].some((v:string)=>!values.includes(v as never)) || new Set(s[k]).size!==s[k].length) return councilInitial;}
    if(s.countObserved&&!s.countPrediction || s.rankChanged&&!s.countObserved || s.moduleRead&&(!s.modulePrediction||!s.moduleSelection) || s.layerRead&&(!s.layerPrediction||!s.layerSelection) || s.completed&&s.reflection!=='conditional' || !eligibleCouncil(s,s.step) || s.completed&&!eligibleCouncil(s,7)) return councilInitial;
    return {...councilInitial,...s};
  }catch{return councilInitial;}
}
export function useCouncil(){
  const [state,dispatch]=useReducer(councilReducer,undefined,restoreCouncil);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Learning remains available. */}},[state]);
  return {state,dispatch};
}
