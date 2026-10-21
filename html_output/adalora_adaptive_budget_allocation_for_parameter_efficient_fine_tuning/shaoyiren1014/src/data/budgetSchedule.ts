export type SchedulePolicy='immediate'|'never'|'staged';
export const schedulePolicies=[
  {id:'immediate',label:'刚开始立即削减',detail:'从起点就只留下目标数量。'},
  {id:'never',label:'永远不削减',detail:'继续保留全部方向。'},
  {id:'staged',label:'先预热，再逐减，最后固定',detail:'先积累信号，再收紧预算，最后稳定分配。'},
] as const;
export const scheduleSimulation={
  source:{type:'conceptual_simulation' as const,scenarioId:'act-5-schedule',mechanismReferences:['scheduler'],assumptions:['24 条初始方向、目标 16','12 个教学时间点','前三点预热、中间六点削减、最后三点固定','归一化三次下降示意，向上取整','人工优先级，用固定函数生成，不是论文重要性实测'],disclaimer:'教学示意，不是训练日志，也不是三策略的性能实验'},
  initialBudget:24,targetBudget:16,points:12,performanceMetrics:null,
};
export const scheduleSource={type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:6,section:'3.3',locator:'Section 3.3; Appendix A p.14',representation:'author_statement',url:'https://arxiv.org/abs/2303.10512v2'};
export function schedulePhase(t:number){return t<3?'warmup':t<9?'reduction':'final';}
export const phaseNames={warmup:'预热 · Warm-up',reduction:'逐步削减 · Progressive Reduction',final:'固定分配后微调 · Final Fine-Tuning'};
export function budgetAt(policy:SchedulePolicy,t:number){
  if(policy==='immediate')return 16;
  if(policy==='never'||t<3)return 24;
  if(t>=9)return 16;
  const progress=(t-2)/6;
  return Math.ceil(16+8*Math.pow(1-progress,3));
}
export const directionIds=Array.from({length:24},(_,i)=>`${'ABCD'[Math.floor(i/6)]}${i%6+1}`);
export function artificialPriority(index:number,t:number){return 2+Math.sin(index*1.7+t*.8)+.7*Math.cos(index*.6-t*.45)+index*.001;}
export function maskAt(policy:SchedulePolicy,t:number):string[]{
  // Freeze the last allocation, not the learned parameter values.
  const scoringTime=t>=9?8:t;
  return directionIds.map((id,index)=>({id,index,score:artificialPriority(index,scoringTime)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,budgetAt(policy,t)).map(d=>d.id).sort();
}
export function snapshotAt(policy:SchedulePolicy,t:number){return {time:t,budget:budgetAt(policy,t),mask:maskAt(policy,t)};}
