import {useEffect,useReducer} from 'react';
import {rooms,roomConfig,metricsFor,type RoomId} from '../data/performanceArena';
export const arenaSections=['进入竞技场','检验三个任务','整理认识','本章发现'];
export interface RoomState{prediction:string|null;dataset:string;metric:string;budget:string;revealed:boolean;seen:string[];exceptionPrediction:'yes'|'no'|null;exceptionRead:boolean;reflection:'conditional'|'universal'|null;completed:boolean;}
export interface ArenaState{version:1;step:number;room:RoomId;rooms:Record<RoomId,RoomState>;reflection:'conditional'|'universal'|'causal'|null;completed:boolean;}
function freshRoom(id:RoomId):RoomState{const c=roomConfig(id);return {prediction:null,dataset:c.datasets[0],metric:metricsFor(id,c.datasets[0])[0][0],budget:c.budgets[0],revealed:false,seen:[],exceptionPrediction:null,exceptionRead:false,reflection:null,completed:false};}
export function initialArena():ArenaState{return {version:1,step:0,room:'nlu',rooms:{nlu:freshRoom('nlu'),qa:freshRoom('qa'),nlg:freshRoom('nlg')},reflection:null,completed:false};}
export function comparedRoom(s:RoomState,id:RoomId){const b=roomConfig(id).budgets;return s.revealed&&s.seen.includes(b[0])&&s.seen.includes(b[b.length-1]);}
export function eligibleArena(s:ArenaState,n:number){return Number.isInteger(n)&&n>=0&&n<=3&&(n<=1||n===2&&rooms.every(r=>s.rooms[r.id].completed)||n===3&&s.completed);}
type Action={type:'step';value:number}|{type:'room';value:RoomId}|{type:'predict'|'dataset'|'metric'|'budget'|'exceptionPredict'|'reflect'|'finalReflect';value:string}|{type:'read'|'exceptionRead'|'finishRoom'|'complete'|'reset'};
export function arenaReducer(s:ArenaState,a:Action):ArenaState{
 if(a.type==='reset')return initialArena();
 if(a.type==='step')return eligibleArena(s,a.value)?{...s,step:a.value}:s;
 if(a.type==='room')return rooms.some(r=>r.id===a.value)?{...s,room:a.value}:s;
 if(a.type==='finalReflect')return eligibleArena(s,2)&&!s.completed&&['conditional','universal','causal'].includes(a.value)?{...s,reflection:a.value as ArenaState['reflection']}:s;
 if(a.type==='complete')return eligibleArena(s,2)&&s.reflection==='conditional'?{...s,completed:true,step:3}:s;
 const id=s.room,r=s.rooms[id],c=roomConfig(id);let next=r;
 switch(a.type){
  case 'predict':if(!r.prediction&&['always','budget','conditional'].includes(a.value))next={...r,prediction:a.value};break;
  case 'read':if(r.prediction)next={...r,revealed:true,seen:Array.from(new Set([...r.seen,r.budget]))};break;
  case 'dataset':if(r.revealed&&(c.datasets as readonly string[]).includes(a.value))next={...r,dataset:a.value,metric:metricsFor(id,a.value)[0][0]};break;
  case 'metric':if(r.revealed&&metricsFor(id,r.dataset).some(m=>m[0]===a.value))next={...r,metric:a.value};break;
  case 'budget':if(r.revealed&&(c.budgets as readonly string[]).includes(a.value))next={...r,budget:a.value,seen:Array.from(new Set([...r.seen,a.value]))};break;
  case 'exceptionPredict':if(comparedRoom(r,id)&&!r.exceptionPrediction&&['yes','no'].includes(a.value))next={...r,exceptionPrediction:a.value as 'yes'|'no'};break;
  case 'exceptionRead':if(comparedRoom(r,id)&&r.exceptionPrediction)next={...r,exceptionRead:true};break;
  case 'reflect':if(r.exceptionRead&&!r.completed&&['conditional','universal'].includes(a.value))next={...r,reflection:a.value as RoomState['reflection']};break;
  case 'finishRoom':if(comparedRoom(r,id)&&r.exceptionRead&&r.reflection==='conditional')next={...r,completed:true};break;
 }
 return next===r?s:{...s,rooms:{...s.rooms,[id]:next}};
}
const key='adaptive-engine:act6:v1';
export function restoreArena():ArenaState{try{const s=JSON.parse(localStorage.getItem(key)||'null');if(!s||s.version!==1||!rooms.some(r=>r.id===s.room)||typeof s.completed!=='boolean'||![null,'conditional','universal','causal'].includes(s.reflection))return initialArena();
 for(const c of rooms){const r=s.rooms?.[c.id];if(!r||![null,'always','budget','conditional'].includes(r.prediction)||!(c.datasets as readonly string[]).includes(r.dataset)||!metricsFor(c.id,r.dataset).some(m=>m[0]===r.metric)||!(c.budgets as readonly string[]).includes(r.budget)||!Array.isArray(r.seen)||new Set(r.seen).size!==r.seen.length||r.seen.some((b:string)=>!(c.budgets as readonly string[]).includes(b))||[r.revealed,r.exceptionRead,r.completed].some(v=>typeof v!=='boolean')||![null,'yes','no'].includes(r.exceptionPrediction)||![null,'conditional','universal'].includes(r.reflection)||r.revealed&&!r.prediction||!r.revealed&&r.seen.length||r.revealed&&!r.seen.includes(r.budget)||r.exceptionPrediction&&!comparedRoom(r,c.id)||r.exceptionRead&&!r.exceptionPrediction||r.reflection&&!r.exceptionRead||r.completed&&(!comparedRoom(r,c.id)||!r.exceptionRead||r.reflection!=='conditional'))return initialArena();}
 if(!eligibleArena(s,s.step)||s.reflection&&!eligibleArena(s,2)||s.completed&&(s.reflection!=='conditional'||!rooms.every(r=>s.rooms[r.id].completed)))return initialArena();return s;
 }catch{return initialArena();}}
export function useArena(){const [state,dispatch]=useReducer(arenaReducer,undefined,restoreArena);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Learning remains available in this session. */}},[state]);return {state,dispatch};}
