import {useEffect,useReducer} from 'react';
import type {ScoreMode} from '../data/importanceTribunal';
export const tribunalSections=['提出问题','先做预测','比较信号','对照机制','检查实验','修正认识','本章发现'];
export interface TribunalState{version:1;step:number;prediction:ScoreMode|null;mode:ScoreMode;visited:ScoreMode[];batch:number;seenBatches:number[];observation:'estimate'|'truth'|'penalty'|null;mechanismRead:boolean;experimentPrediction:'usually'|'always'|'same'|null;experimentRead:boolean;dataset:number;reflection:'conditional'|'guarantee'|'causal'|null;completed:boolean;}
export const tribunalInitial:TribunalState={version:1,step:0,prediction:null,mode:'magnitude',visited:[],batch:0,seenBatches:[],observation:null,mechanismRead:false,experimentPrediction:null,experimentRead:false,dataset:0,reflection:null,completed:false};
const key='adaptive-engine:act4:v1';const modes=['magnitude','current','history'];
export function eligibleTribunal(s:TribunalState,n:number):boolean{return Number.isInteger(n)&&n>=0&&n<=6&&(n<=1||n===2&&!!s.prediction||n===3&&!!s.prediction&&s.visited.length===3&&s.seenBatches.includes(0)&&s.seenBatches.includes(5)&&s.observation==='estimate'||n===4&&eligibleTribunal(s,3)&&s.mechanismRead||n===5&&eligibleTribunal(s,4)&&s.experimentRead||n===6&&s.completed);}
type Action={type:'step'|'batch'|'dataset';value:number}|{type:'predict'|'mode';value:ScoreMode}|{type:'observe';value:NonNullable<TribunalState['observation']>}|{type:'experiment-predict';value:NonNullable<TribunalState['experimentPrediction']>}|{type:'reflect';value:NonNullable<TribunalState['reflection']>}|{type:'mechanism-read'|'experiment-read'|'complete'|'reset'};
export function tribunalReducer(s:TribunalState,a:Action):TribunalState{
  switch(a.type){
    case 'step':return eligibleTribunal(s,a.value)?{...s,step:a.value}:s;
    case 'predict':return s.prediction||!modes.includes(a.value)?s:{...s,prediction:a.value,mode:a.value,visited:[a.value],seenBatches:[0]};
    case 'mode':return !s.prediction||!modes.includes(a.value)?s:{...s,mode:a.value,visited:Array.from(new Set([...s.visited,a.value]))};
    case 'batch':return !s.prediction||!Number.isInteger(a.value)||a.value<0||a.value>5||Math.abs(a.value-s.batch)>1?s:{...s,batch:a.value,seenBatches:Array.from(new Set([...s.seenBatches,a.value]))};
    case 'observe':return s.mechanismRead||s.visited.length!==3||!s.seenBatches.includes(5)||!['estimate','truth','penalty'].includes(a.value)?s:{...s,observation:a.value};
    case 'mechanism-read':return eligibleTribunal(s,3)?{...s,mechanismRead:true}:s;
    case 'experiment-predict':return !s.mechanismRead||s.experimentPrediction||!['usually','always','same'].includes(a.value)?s:{...s,experimentPrediction:a.value};
    case 'experiment-read':return eligibleTribunal(s,4)&&!!s.experimentPrediction?{...s,experimentRead:true}:s;
    case 'dataset':return !s.experimentRead||!Number.isInteger(a.value)||a.value<0||a.value>2?s:{...s,dataset:a.value};
    case 'reflect':return !s.experimentRead||s.completed||!['conditional','guarantee','causal'].includes(a.value)?s:{...s,reflection:a.value};
    case 'complete':return eligibleTribunal(s,5)&&s.reflection==='conditional'?{...s,completed:true,step:6}:s;
    case 'reset':return {...tribunalInitial,visited:[],seenBatches:[]};
  }
}
export function restoreTribunal():TribunalState{
  try{const s=JSON.parse(localStorage.getItem(key)||'null');
    if(!s||s.version!==1||!Number.isInteger(s.batch)||s.batch<0||s.batch>5||!Number.isInteger(s.dataset)||s.dataset<0||s.dataset>2||!modes.includes(s.mode))return tribunalInitial;
    if(![null,...modes].includes(s.prediction)||![null,'estimate','truth','penalty'].includes(s.observation)||![null,'usually','always','same'].includes(s.experimentPrediction)||![null,'conditional','guarantee','causal'].includes(s.reflection))return tribunalInitial;
    if(!Array.isArray(s.visited)||s.visited.some((m:string)=>!modes.includes(m))||new Set(s.visited).size!==s.visited.length||!Array.isArray(s.seenBatches)||s.seenBatches.some((n:number)=>!Number.isInteger(n)||n<0||n>5)||new Set(s.seenBatches).size!==s.seenBatches.length)return tribunalInitial;
    if(['mechanismRead','experimentRead','completed'].some(k=>typeof s[k]!=='boolean'))return tribunalInitial;
    if(s.prediction&&(!s.visited.includes(s.mode)||!s.visited.includes(s.prediction)||!s.seenBatches.includes(0)||!s.seenBatches.includes(s.batch))||!s.prediction&&(s.visited.length||s.seenBatches.length||s.batch!==0)||s.observation&&(s.visited.length!==3||!s.seenBatches.includes(5))||s.mechanismRead&&!eligibleTribunal(s,3)||s.experimentPrediction&&!s.mechanismRead||s.experimentRead&&(!s.experimentPrediction||!eligibleTribunal(s,4))||s.reflection&&!s.experimentRead||s.completed&&(!s.experimentRead||s.reflection!=='conditional')||!eligibleTribunal(s,s.step))return tribunalInitial;
    return {...tribunalInitial,...s};
  }catch{return tribunalInitial;}
}
export function useTribunal(){const [state,dispatch]=useReducer(tribunalReducer,undefined,restoreTribunal);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{/* Session learning is still available. */}},[state]);return {state,dispatch};}
