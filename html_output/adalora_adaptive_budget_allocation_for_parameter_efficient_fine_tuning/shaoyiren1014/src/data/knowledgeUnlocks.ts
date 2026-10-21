export interface LearningSnapshot {completed:boolean;[key:string]:unknown;}
export function unlockedConcepts(chapters:LearningSnapshot[]):string[]{
 const s=(i:number)=>chapters[i]||{completed:false};const result:string[]=[];const list=(i:number,key:string)=>Array.isArray(s(i)[key])?s(i)[key] as unknown[]:[];
 const add=(condition:unknown,...names:string[])=>{if(condition)result.push(...names);};
 add(list(1,'visited').includes('Attention'),'Attention');
 add(list(1,'visited').includes('FFN'),'FFN');
 add(list(1,'modes').length===2,'LoRA');
 add(s(1).countObserved||s(2).completed,'Rank');
 add(s(3).evidenceRead,'SVD Intuition','Singular Direction','Orthogonality');
 add(s(3).zeroed&&s(3).observation==='retained','Pruning');
 add(s(4).observation==='estimate','Sensitivity','Gradient');
 add(s(4).mechanismRead,'Importance Score');
 add(s(5).evidenceRead,'Budget Scheduler');
 add(s(7).boundaryRead||s(7).completed,'Ablation');
 return result;
}
export const conceptChapters:Record<string,number>={LoRA:1,Rank:1,Attention:1,FFN:1,'SVD Intuition':3,'Singular Direction':3,Sensitivity:4,Gradient:4,'Importance Score':4,Orthogonality:3,Pruning:3,'Budget Scheduler':5,Ablation:7};
