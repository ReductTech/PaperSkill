import { createContext, useContext, useState, type ReactNode } from 'react';
import { simulatedAnswer, scenarios, truth, reward } from './scenario';
function useScenarioState() {
  const [ids,setIds]=useState([1,4]);
  const [example,setExample]=useState(0);
  const [mode,setMode]=useState<'training'|'deployment'>('training');
  const [override,setOverride]=useState<{direct:boolean;augmented:boolean}|null>(null);
  const directAnswer=scenarios[example].direct;
  const augmentedAnswer=simulatedAnswer(ids,example);
  const direct=override?.direct ?? directAnswer===truth;
  const augmented=override?.augmented ?? augmentedAnswer===truth;
  return {ids,example,mode,setMode,override,setOverride,directAnswer,augmentedAnswer,direct,augmented,score:reward(direct,augmented),
    toggle(id:number){setIds(ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setOverride(null)},
    choose(next:number){setExample(next);setIds(next===0?[1,4]:[1]);setOverride(null)},
    reset(){setIds([1,4]);setExample(0);setMode('training');setOverride(null)}
  };
}
const Context=createContext<ReturnType<typeof useScenarioState>|null>(null);
export function ScenarioProvider({children}:{children:ReactNode}) {
  return <Context.Provider value={useScenarioState()}>{children}</Context.Provider>;
}
export function useScenario(){
  const state=useContext(Context);
  if(!state)throw Error('缺少教学案例状态');
  return state;
}
