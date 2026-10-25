import verified from './arenaEvidence.json';
import {roomConfig,type RoomId,type EvidenceRow,type Experiment} from './performanceArena';
export const arenaEvidence=verified as unknown as Experiment[];
export function rowsFor(id:RoomId,dataset:string,budget:string){const c=roomConfig(id);return arenaEvidence.find(e=>e.id===c.table)!.rows.filter(r=>id==='nlu'?r.budget.nominalBand===budget:r.dataset===dataset&&r.budget.value===Number(budget));}
export {budgetLabel} from './evidenceFormat';
