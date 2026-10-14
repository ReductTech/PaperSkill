import {useEffect,useReducer} from 'react';
import {foundrySimulation} from '../data/singularFoundry';
export const foundrySections=['进入工坊','先做预测','调节贡献','比较删除','对照论文','修正认识','本章发现'];
export interface FoundryState {
  version:1;step:number;prediction:'retain'|'delete'|'same'|null;strengths:number[];
  zeroed:boolean;restored:boolean;pairDeleted:boolean;recoveryTried:boolean;
  observation:'retained'|'memory'|'accuracy'|null;evidenceRead:boolean;
  reflection:'conditional'|'guarantee'|'exact'|null;completed:boolean;
}
export const foundryInitial:FoundryState={version:1,step:0,prediction:null,strengths:[...foundrySimulation.initialStrengths],zeroed:false,restored:false,pairDeleted:false,recoveryTried:false,observation:null,evidenceRead:false,reflection:null,completed:false};
const key='adaptive-engine:act3:v1';
export function eligibleFoundry(s:FoundryState,n:number):boolean{
  if(!Number.isInteger(n)||n<0||n>6)return false;
  return n<=1||(n===2&&!!s.prediction)||(n===3&&!!s.prediction&&s.zeroed&&s.restored)||(n===4&&eligibleFoundry(s,3)&&s.pairDeleted&&s.recoveryTried&&s.observation==='retained')||(n===5&&eligibleFoundry(s,4)&&s.evidenceRead)||(n===6&&s.completed);
}
type Action={type:'step';value:number}|{type:'predict';value:NonNullable<FoundryState['prediction']>}|{type:'strength';index:number;value:number}|{type:'delete'|'try-recover'|'read'|'complete'|'reset'}|{type:'observe';value:NonNullable<FoundryState['observation']>}|{type:'reflect';value:NonNullable<FoundryState['reflection']>};
export function foundryReducer(s:FoundryState,a:Action):FoundryState{
  switch(a.type){
    case 'step':return eligibleFoundry(s,a.value)?{...s,step:a.value}:s;
    case 'predict':return s.prediction||!['retain','delete','same'].includes(a.value)?s:{...s,prediction:a.value};
    case 'strength':{
      if(!s.prediction||!Number.isInteger(a.index)||a.index<0||a.index>2||!Number.isInteger(a.value)||a.value<0||a.value>10)return s;
      const strengths=s.strengths.map((n,i)=>i===a.index?a.value:n);
      return {...s,strengths,zeroed:s.zeroed||(a.index===2&&a.value===0),restored:s.restored||(a.index===2&&s.zeroed&&s.strengths[2]===0&&a.value>0)};
    }
    case 'delete':return eligibleFoundry(s,3)?{...s,pairDeleted:true}:s;
    case 'try-recover':return s.pairDeleted?{...s,recoveryTried:true}:s;
    case 'observe':return s.evidenceRead||!s.recoveryTried||!['retained','memory','accuracy'].includes(a.value)?s:{...s,observation:a.value};
    case 'read':return eligibleFoundry(s,4)?{...s,evidenceRead:true}:s;
    case 'reflect':return !s.evidenceRead||s.completed||!['conditional','guarantee','exact'].includes(a.value)?s:{...s,reflection:a.value};
    case 'complete':return eligibleFoundry(s,5)&&s.reflection==='conditional'?{...s,completed:true,step:6}:s;
    case 'reset':return {...foundryInitial,strengths:[...foundrySimulation.initialStrengths]};
  }
}
export function restoreFoundry():FoundryState{
  try{
    const s=JSON.parse(localStorage.getItem(key)||'null');
    if(!s||s.version!==1||!Array.isArray(s.strengths)||s.strengths.length!==3||!s.strengths.every((n:number)=>Number.isInteger(n)&&n>=0&&n<=10))return foundryInitial;
    if(![null,'retain','delete','same'].includes(s.prediction)||![null,'retained','memory','accuracy'].includes(s.observation)||![null,'conditional','guarantee','exact'].includes(s.reflection))return foundryInitial;
    if(['zeroed','restored','pairDeleted','recoveryTried','evidenceRead','completed'].some(k=>typeof s[k]!=='boolean'))return foundryInitial;
    if(s.zeroed&&!s.prediction||s.restored&&!s.zeroed||s.pairDeleted&&!eligibleFoundry(s,3)||s.recoveryTried&&!s.pairDeleted||s.observation&&!s.recoveryTried||s.evidenceRead&&!eligibleFoundry(s,4)||s.reflection&&!s.evidenceRead||s.completed&&(!s.evidenceRead||s.reflection!=='conditional')||!eligibleFoundry(s,s.step))return foundryInitial;
    return {...foundryInitial,...s};
  }catch{return foundryInitial;}
}
export function useFoundry(){const [state,dispatch]=useReducer(foundryReducer,undefined,restoreFoundry);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Session learning remains available. */}},[state]);return {state,dispatch};}
