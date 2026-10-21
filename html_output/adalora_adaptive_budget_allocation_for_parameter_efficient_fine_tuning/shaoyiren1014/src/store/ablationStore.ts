import {useEffect,useReducer} from 'react';
import {ablationOptions as ablations,ablationConfig,validContext,type AblationId} from '../data/ablationOptions';
export const ablationSections=['接管实验室','逐项拆解','检查证据边界','修正认识','本章发现'];
export interface AblationRecord{prediction:'lower'|'similar'|'uncertain'|null;dataset:string;budget:string;view:string|null;seen:string[];control:'careful'|'absolute'|null;restored:boolean;completed:boolean;}
export interface AblationState{version:1;step:number;active:AblationId;records:Record<AblationId,AblationRecord>;missingPrediction:'zero'|'unreported'|'same'|null;combinationPrediction:'sum'|'unknown'|null;boundaryRead:boolean;reflection:'conditional'|'universal'|'sum'|null;completed:boolean;}
function freshRecord(id:AblationId):AblationRecord{const c=ablationConfig(id);return {prediction:null,dataset:c.datasets[0],budget:c.budgets[0],view:null,seen:[],control:null,restored:false,completed:false};}
export function initialAblation():AblationState{return {version:1,step:0,active:'structure',records:{structure:freshRecord('structure'),allocation:freshRecord('allocation'),orthogonal:freshRecord('orthogonal'),score:freshRecord('score')},missingPrediction:null,combinationPrediction:null,boundaryRead:false,reflection:null,completed:false};}
export function allVariantsSeen(r:AblationRecord,id:AblationId){return ablationConfig(id).methods.every(m=>r.seen.includes(m));}
export function allAblationsDone(s:AblationState){return ablations.every(c=>s.records[c.id].completed);}
export function eligibleAblation(s:AblationState,n:number){return Number.isInteger(n)&&n>=0&&n<=4&&(n<=1||n===2&&allAblationsDone(s)||n===3&&allAblationsDone(s)&&s.boundaryRead||n===4&&s.completed);}
type Action={type:'step';value:number}|{type:'active';value:AblationId}|{type:'predict'|'dataset'|'budget'|'variant'|'control'|'missingPredict'|'combinationPredict'|'reflect';value:string}|{type:'restore'|'finish'|'boundaryRead'|'complete'|'reset'};
export function ablationReducer(s:AblationState,a:Action):AblationState{
 if(a.type==='reset')return initialAblation();
 if(a.type==='step')return eligibleAblation(s,a.value)?{...s,step:a.value}:s;
 if(a.type==='active')return ablations.some(c=>c.id===a.value)?{...s,active:a.value}:s;
 if(a.type==='missingPredict')return allAblationsDone(s)&&!s.missingPrediction&&['zero','unreported','same'].includes(a.value)?{...s,missingPrediction:a.value as AblationState['missingPrediction']}:s;
 if(a.type==='combinationPredict')return allAblationsDone(s)&&!s.combinationPrediction&&['sum','unknown'].includes(a.value)?{...s,combinationPrediction:a.value as AblationState['combinationPrediction']}:s;
 if(a.type==='boundaryRead')return allAblationsDone(s)&&s.missingPrediction&&s.combinationPrediction?{...s,boundaryRead:true}:s;
 if(a.type==='reflect')return eligibleAblation(s,3)&&!s.completed&&['conditional','universal','sum'].includes(a.value)?{...s,reflection:a.value as AblationState['reflection']}:s;
 if(a.type==='complete')return eligibleAblation(s,3)&&s.reflection==='conditional'?{...s,completed:true,step:4}:s;
 const id=s.active,r=s.records[id],c=ablationConfig(id);let next=r;
 switch(a.type){
  case 'predict':if(!r.prediction&&['lower','similar','uncertain'].includes(a.value))next={...r,prediction:a.value as AblationRecord['prediction']};break;
  case 'variant':if(r.prediction&&(c.methods as readonly string[]).includes(a.value))next={...r,view:a.value,seen:Array.from(new Set([...r.seen,a.value])),restored:false};break;
  case 'dataset':if(r.prediction&&validContext(id,a.value,r.budget))next={...r,dataset:a.value};break;
  case 'budget':if(r.prediction&&validContext(id,r.dataset,a.value))next={...r,budget:a.value};break;
  case 'control':if(allVariantsSeen(r,id)&&!r.completed&&['careful','absolute'].includes(a.value))next={...r,control:a.value as AblationRecord['control']};break;
  case 'restore':if(r.view)next={...r,view:null,restored:true};break;
  case 'finish':if(allVariantsSeen(r,id)&&r.control==='careful'&&r.restored&&!r.view)next={...r,completed:true};break;
 }
 return next===r?s:{...s,records:{...s.records,[id]:next}};
}
const key='adaptive-engine:act7:v1';
export function restoreAblation():AblationState{try{const s=JSON.parse(localStorage.getItem(key)||'null');if(!s||s.version!==1||!ablations.some(c=>c.id===s.active)||typeof s.completed!=='boolean'||typeof s.boundaryRead!=='boolean'||![null,'zero','unreported','same'].includes(s.missingPrediction)||![null,'sum','unknown'].includes(s.combinationPrediction)||![null,'conditional','universal','sum'].includes(s.reflection))return initialAblation();
 for(const c of ablations){const r=s.records?.[c.id];if(!r||![null,'lower','similar','uncertain'].includes(r.prediction)||!validContext(c.id,r.dataset,r.budget)||![null,...c.methods].includes(r.view)||!Array.isArray(r.seen)||new Set(r.seen).size!==r.seen.length||r.seen.some((m:string)=>!(c.methods as readonly string[]).includes(m))||![null,'careful','absolute'].includes(r.control)||[r.restored,r.completed].some(v=>typeof v!=='boolean')||r.seen.length&&!r.prediction||r.view&&(!r.seen.includes(r.view)||r.restored)||r.restored&&(!r.seen.length||r.view)||r.control&&!allVariantsSeen(r,c.id)||r.completed&&(!allVariantsSeen(r,c.id)||r.control!=='careful'))return initialAblation();}
 if((s.missingPrediction||s.combinationPrediction)&&!allAblationsDone(s)||s.boundaryRead&&(!s.missingPrediction||!s.combinationPrediction)||s.reflection&&!s.boundaryRead||s.completed&&(!s.boundaryRead||s.reflection!=='conditional'||!allAblationsDone(s))||!eligibleAblation(s,s.step))return initialAblation();return s;
 }catch{return initialAblation();}}
export function useAblation(){const [state,dispatch]=useReducer(ablationReducer,undefined,restoreAblation);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Session progress remains available. */}},[state]);return {state,dispatch};}
