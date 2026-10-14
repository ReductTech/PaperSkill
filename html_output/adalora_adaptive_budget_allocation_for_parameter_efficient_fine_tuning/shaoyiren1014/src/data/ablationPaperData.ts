import verified from './ablationEvidence.json';
import {ablationConfig,type AblationId} from './ablationLaboratory';
export interface AblationRow{method:string;dataset:string;metric:string;value:number|null;budget:{kind:string;value:number;matched:string};source:{type:string;sourceId:string;page:number;locator:string;verification:string};}
export interface AblationExperiment{id:string;source:AblationRow['source'];evaluationProtocol:string;rows:AblationRow[];}
export const ablationEvidence=verified as unknown as AblationExperiment[];
export function experimentFor(id:AblationId){return ablationEvidence.find(e=>e.id===ablationConfig(id).table)!;}
export function pairFor(id:AblationId,method:string,dataset:string,budget:string){return experimentFor(id).rows.filter(r=>r.dataset===dataset&&r.budget.value===Number(budget)&&(r.method==='AdaLoRA'||r.method===method));}
export function describePair(rows:AblationRow[]){const full=rows.find(r=>r.method==='AdaLoRA'),variant=rows.find(r=>r.method!=='AdaLoRA');if(!full||!variant||full.value===null||variant.value===null)return '这一组未报告完整的可比较结果，不能把空缺当成零。';return full.value>variant.value?'当前这组报告值中，完整方法较高。':full.value<variant.value?'当前这组报告值中，简化变体略高；这处例外也需要保留。':'当前这组报告值相同，不能声称完整方法在这里严格更高。';}
