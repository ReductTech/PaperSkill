export interface Attempt { chapter: number; savedAt: string; state: Record<string, unknown> }
const key='adaptive-engine:history:v1';
export function readHistory(): Attempt[]{
  try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(v=>v && [0,1,2,3,4,5,6,7,8,9].includes(v.chapter) && typeof v.savedAt==='string' && v.state && typeof v.state==='object'):[];}catch{return [];}
}
export function archiveAttempt(chapter: number,state: object,history: Attempt[]){
  const next=[...history,{chapter,savedAt:new Date().toISOString(),state:{...state}}];
  try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Current-session history remains in memory. */}
  return next;
}
