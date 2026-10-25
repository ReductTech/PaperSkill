import {useEffect,useReducer} from 'react';
import type {SchedulePolicy} from '../data/budgetSchedule';
export const towerSections=['接管调度','先做预测','运行时间轴','观察关系','对照论文','修正认识','本章发现'];
export interface TowerState{version:1;step:number;prediction:SchedulePolicy|null;policy:SchedulePolicy;visited:SchedulePolicy[];time:number;stagedSeen:number[];observation:'allocation'|'freeze'|'accuracy'|null;evidenceRead:boolean;reflection:'conditional'|'guarantee'|'memory'|null;completed:boolean;}
export const towerInitial:TowerState={version:1,step:0,prediction:null,policy:'staged',visited:[],time:0,stagedSeen:[],observation:null,evidenceRead:false,reflection:null,completed:false};
const key='adaptive-engine:act5:v1';const policies=['immediate','never','staged'];
export function hasRunSchedule(s:TowerState){return !!s.prediction&&s.visited.length===3&&s.stagedSeen.length===12;}
export function eligibleTower(s:TowerState,n:number):boolean{return Number.isInteger(n)&&n>=0&&n<=6&&(n<=1||n===2&&!!s.prediction||n===3&&hasRunSchedule(s)||n===4&&hasRunSchedule(s)&&s.observation==='allocation'||n===5&&eligibleTower(s,4)&&s.evidenceRead||n===6&&s.completed);}
type Action={type:'step'|'time';value:number}|{type:'predict'|'policy';value:SchedulePolicy}|{type:'observe';value:NonNullable<TowerState['observation']>}|{type:'reflect';value:NonNullable<TowerState['reflection']>}|{type:'read'|'complete'|'reset'};
export function towerReducer(s:TowerState,a:Action):TowerState{
  switch(a.type){
    case 'step':return eligibleTower(s,a.value)?{...s,step:a.value}:s;
    case 'predict':return s.prediction||!policies.includes(a.value)?s:{...s,prediction:a.value,policy:a.value,visited:[a.value],stagedSeen:a.value==='staged'?[0]:[]};
    case 'policy':return !s.prediction||!policies.includes(a.value)?s:{...s,policy:a.value,time:0,visited:Array.from(new Set([...s.visited,a.value])),stagedSeen:a.value==='staged'?Array.from(new Set([...s.stagedSeen,0])):s.stagedSeen};
    case 'time':return !s.prediction||!Number.isInteger(a.value)||a.value<0||a.value>11||Math.abs(a.value-s.time)!==1?s:{...s,time:a.value,stagedSeen:s.policy==='staged'?Array.from(new Set([...s.stagedSeen,a.value])):s.stagedSeen};
    case 'observe':return s.evidenceRead||!hasRunSchedule(s)||!['allocation','freeze','accuracy'].includes(a.value)?s:{...s,observation:a.value};
    case 'read':return eligibleTower(s,4)?{...s,evidenceRead:true}:s;
    case 'reflect':return !s.evidenceRead||s.completed||!['conditional','guarantee','memory'].includes(a.value)?s:{...s,reflection:a.value};
    case 'complete':return eligibleTower(s,5)&&s.reflection==='conditional'?{...s,completed:true,step:6}:s;
    case 'reset':return {...towerInitial,visited:[],stagedSeen:[]};
  }
}
export function restoreTower():TowerState{
  try{const s=JSON.parse(localStorage.getItem(key)||'null');
    if(!s||s.version!==1||!Number.isInteger(s.time)||s.time<0||s.time>11||!policies.includes(s.policy)||![null,...policies].includes(s.prediction)||![null,'allocation','freeze','accuracy'].includes(s.observation)||![null,'conditional','guarantee','memory'].includes(s.reflection))return towerInitial;
    if(!Array.isArray(s.visited)||s.visited.some((p:string)=>!policies.includes(p))||new Set(s.visited).size!==s.visited.length||!Array.isArray(s.stagedSeen)||s.stagedSeen.some((n:number)=>!Number.isInteger(n)||n<0||n>11)||new Set(s.stagedSeen).size!==s.stagedSeen.length)return towerInitial;
    if(s.stagedSeen.length&&(!s.visited.includes('staged')||Array.from({length:Math.max(...s.stagedSeen)+1},(_,i)=>i).some(i=>!s.stagedSeen.includes(i))))return towerInitial;
    if(['evidenceRead','completed'].some(k=>typeof s[k]!=='boolean')||s.prediction&&(!s.visited.includes(s.prediction)||!s.visited.includes(s.policy)||s.policy==='staged'&&!s.stagedSeen.includes(s.time))||!s.prediction&&(s.visited.length||s.stagedSeen.length||s.time!==0)||s.observation&&!hasRunSchedule(s)||s.evidenceRead&&!eligibleTower(s,4)||s.reflection&&!s.evidenceRead||s.completed&&(!s.evidenceRead||s.reflection!=='conditional')||!eligibleTower(s,s.step))return towerInitial;
    return {...towerInitial,...s};
  }catch{return towerInitial;}
}
export function useTower(){const [state,dispatch]=useReducer(towerReducer,undefined,restoreTower);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Session learning remains available. */}},[state]);return {state,dispatch};}
