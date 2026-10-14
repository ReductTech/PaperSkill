export type ScoreMode='magnitude'|'current'|'history';
export const scoreMethods=[
  {id:'magnitude',label:'只看强度大小',detail:'看起来贡献大的方向，先留下。'},
  {id:'current',label:'只看当前批次的敏感性',detail:'利用这一次训练信号判断。'},
  {id:'history',label:'结合历史敏感性与变化',detail:'多看一些过去的信号，再作估计。'},
] as const;
export const importanceSimulation={
  source:{type:'conceptual_simulation' as const,scenarioId:'act-4-score',assumptions:['四条教学方向，每条包含一个 λ、两个 P 参数、两个 Q 参数','六组人工敏感性信号，不来自训练日志','每次暂选评分最高的两条方向','EMA 系数均为 0.6，初值为 0，仅为教学设定'],disclaimer:'没有真实重要性标签，没有训练模型或测量准确率'},
  beta1:.6,beta2:.6,performanceMetrics:null,
  parameterScales:[1,.8,1.2,.7,1.3],
  directions:[
    {id:'A',magnitude:.9,signals:[8,2,7,2,6,3]},
    {id:'B',magnitude:.3,signals:[3,4,4,5,5,5]},
    {id:'C',magnitude:.6,signals:[1,1,8,1,1,1]},
    {id:'D',magnitude:.2,signals:[6,6,5,6,5,6]},
  ],
};
// Each parameter is smoothed independently before triplet aggregation (Eq. 7–11).
export function directionScore(index:number,batch:number){
  const direction=importanceSimulation.directions[index];
  const params=importanceSimulation.parameterScales.map(scale=>{
    let average=0,variation=0;
    for(let t=0;t<=batch;t++){const sensitivity=direction.signals[t]*scale;average=.6*average+.4*sensitivity;variation=.6*variation+.4*Math.abs(sensitivity-average);}
    return {average,variation,score:average*variation,current:direction.signals[batch]*scale};
  });
  const aggregate=(field:'score'|'current')=>params[0][field]+(params[1][field]+params[2][field])/2+(params[3][field]+params[4][field])/2;
  return {magnitude:direction.magnitude,current:aggregate('current'),history:aggregate('score'),lambda:params[0],pMean:(params[1].score+params[2].score)/2,qMean:(params[3].score+params[4].score)/2};
}
export function rankedDirections(mode:ScoreMode,batch:number){return importanceSimulation.directions.map((d,i)=>({id:d.id,index:i,score:directionScore(i,batch)[mode]})).sort((a,b)=>b.score-a.score||a.index-b.index);}
export const scoreSource={type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:5,section:'3.2',locator:'Eq. 7–11',representation:'author_statement',url:'https://arxiv.org/abs/2303.10512v2'};
export const scoreExperiment={
  source:{type:'paper_evidence' as const,sourceId:'uploaded-pdf',page:9,section:'4.4',locator:'Table 4',representation:'verbatim_values',url:'https://arxiv.org/abs/2303.10512v2'},
  question:'改变重要性评分，任务表现会怎样变化？',controls:['DeBERTaV3-base','同一数据集和论文预算档','其余 AdaLoRA 训练设置'],changed:'评分方法',budgets:[.08,.16,.65],
  datasets:[
    {id:'SST-2',metric:'正确率（%）',full:[95.52,95.80,96.10],current:[94.61,95.30,95.64],magnitude:[95.41,95.41,95.87]},
    {id:'RTE',metric:'正确率（%）',full:[87.36,87.73,88.09],current:[87.36,87.71,88.10],magnitude:[87.00,86.28,88.00]},
    {id:'CoLA',metric:'MCC（论文报告分数）',full:[70.21,70.04,71.45],current:[66.71,68.83,70.19],magnitude:[67.67,68.44,70.38]},
  ],
  boundary:'只支持这些模型、任务、预算和配置；微小差值不证明统计显著。不用于给人工信号的保留集合打分。',
};
