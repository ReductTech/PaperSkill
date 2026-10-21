import {useEffect,useReducer} from 'react';
import {rankExperiment} from '../data/rankAllocation';
export const rankSections=['接管配额','先做预测','重新分配','观察代价','对照论文','修正认识','本章发现'];
export interface RankTransfer {from:number;to:number;before:number[];after:number[]}
export interface RankState {
  version:1;step:number;prediction:'tradeoff'|'free'|'accuracy'|null;ranks:number[];
  from:number;to:number;transfers:RankTransfer[];observation:'capacity'|'accuracy'|'weights'|null;
  evidenceRead:boolean;reflection:'conditional'|'universal'|'automatic'|null;completed:boolean;
}
const key='adaptive-engine:act2:v1';
export const rankInitial:RankState={version:1,step:0,prediction:null,ranks:[...rankExperiment.initialRanks],from:0,to:2,transfers:[],observation:null,evidenceRead:false,reflection:null,completed:false};
const validIndex=(value:number)=>Number.isInteger(value)&&value>=0&&value<4;
const validRanks=(value:unknown):value is number[]=>Array.isArray(value)&&value.length===4&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=8)&&value.reduce((a,b)=>a+b,0)===12;
export function eligibleRank(s:RankState,n:number){
  return Number.isInteger(n)&&n>=0&&n<=6&&(n<=1 || !!s.prediction&&(n<=2 || s.transfers.length>0&&(n<=3 || s.observation==='capacity'&&(n<=4 || s.evidenceRead&&(n<=5 || s.completed)))));
}
export function transferBlocked(s:Pick<RankState,'ranks'|'from'|'to'>){
  if(!validIndex(s.from)||!validIndex(s.to))return '请选择有效的位置。';
  if(s.from===s.to)return '转出和转入需要是两个不同位置。';
  if(s.ranks[s.from]===0)return `位置 ${rankExperiment.positions[s.from].id} 已没有通道可转出，请换一个来源。`;
  if(s.ranks[s.to]>=8)return `位置 ${rankExperiment.positions[s.to].id} 已到教学上限 8，请换一个目标。`;
  return null;
}
type Action={type:'step';value:number}|{type:'predict';value:NonNullable<RankState['prediction']>}|
  {type:'from'|'to';value:number}|{type:'transfer'|'equal'|'read'|'complete'|'reset'}|
  {type:'observe';value:NonNullable<RankState['observation']>}|{type:'reflect';value:NonNullable<RankState['reflection']>};
export function rankReducer(s:RankState,a:Action):RankState{
  switch(a.type){
    case 'step':return eligibleRank(s,a.value)?{...s,step:a.value}:s;
    case 'predict':return s.prediction||!['tradeoff','free','accuracy'].includes(a.value)?s:{...s,prediction:a.value};
    case 'from':case 'to':return validIndex(a.value)?{...s,[a.type]:a.value}:s;
    case 'transfer':{
      if(!s.prediction||transferBlocked(s))return s;
      const ranks=[...s.ranks];ranks[s.from]--;ranks[s.to]++;
      return {...s,ranks,transfers:[...s.transfers,{from:s.from,to:s.to,before:[...s.ranks],after:[...ranks]}]};
    }
    case 'equal':return {...s,ranks:[...rankExperiment.initialRanks]};
    case 'observe':return !s.evidenceRead && s.transfers.length && ['capacity','accuracy','weights'].includes(a.value)?{...s,observation:a.value}:s;
    case 'read':return eligibleRank(s,4)?{...s,evidenceRead:true}:s;
    case 'reflect':return s.completed||!['conditional','universal','automatic'].includes(a.value)?s:{...s,reflection:a.value};
    case 'complete':return eligibleRank(s,5)&&s.reflection==='conditional'?{...s,completed:true,step:6}:s;
    case 'reset':return {...rankInitial,ranks:[...rankExperiment.initialRanks],transfers:[]};
  }
}
export function restoreRank():RankState{
  try{
    const s=JSON.parse(localStorage.getItem(key)||'null');
    if(!s||s.version!==1||!Number.isInteger(s.step)||!validRanks(s.ranks)||!validIndex(s.from)||!validIndex(s.to)||!Array.isArray(s.transfers))return rankInitial;
    if(![null,'tradeoff','free','accuracy'].includes(s.prediction)||![null,'capacity','accuracy','weights'].includes(s.observation)||![null,'conditional','universal','automatic'].includes(s.reflection))return rankInitial;
    if(typeof s.evidenceRead!=='boolean'||typeof s.completed!=='boolean')return rankInitial;
    if(s.transfers.some((t:RankTransfer)=>!t||!validIndex(t.from)||!validIndex(t.to)||t.from===t.to||!validRanks(t.before)||!validRanks(t.after)||t.before.some((n,i)=>t.after[i]!==n+(i===t.from?-1:i===t.to?1:0))))return rankInitial;
    if(s.transfers.length&&!s.prediction||s.observation&&!s.transfers.length||s.evidenceRead&&s.observation!=='capacity'||s.completed&&(!s.evidenceRead||s.reflection!=='conditional')||!eligibleRank(s,s.step))return rankInitial;
    return {...rankInitial,...s};
  }catch{return rankInitial;}
}
export function useRank(){
  const [state,dispatch]=useReducer(rankReducer,undefined,restoreRank);
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Learning works without persistent storage. */}},[state]);
  return {state,dispatch};
}
