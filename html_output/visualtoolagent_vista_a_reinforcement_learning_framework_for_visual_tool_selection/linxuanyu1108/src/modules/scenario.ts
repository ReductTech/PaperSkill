export const chartTools = ['UniChart','DePlot','ChartMoE','OpenCV','ChartDet','ChartQCR','ChartAssistant','ChartVLM','QwenVL-32B'];
export const geometryTools = ['DiagramFormalizer','Inter-GPS','G-LLaVA 13B','MultiMath'];
export const chartTypes = ['转表 · 提取类别与数值','转 SVG 类 · 形状与颜色证据','生成描述 · 概括图表内容'];
export const scenarios = [
  {question:'橙色柱对应的入场人数是多少？',direct:20,withEvidence:32},
  {question:'乙厅的入场人数是多少？',direct:32,withEvidence:20}
];
export const truth=32;
export function toolOutput(id:number, example:number) {
  if(id<3) return example===1?'模拟抽取误差 · 甲厅 32、乙厅 20':'甲厅 20、乙厅 32';
  if(id<6) return '橙色柱对应乙厅';
  return '报表比较甲、乙两厅的入场人数';
}
export function simulatedAnswer(ids:number[],example:number) {
  const table=ids.some(id=>id<3);
  const color=ids.some(id=>id>=3&&id<6);
  return table&&(example===1||color) ? scenarios[example].withEvidence : scenarios[example].direct;
}
export function reward(direct:boolean, augmented:boolean) {
  return augmented?1:direct?-.5:0;
}
export function groupStats(scores:number[]) {
  const mean=scores.reduce((a,b)=>a+b,0)/scores.length;
  const std=Math.sqrt(scores.reduce((a,b)=>a+(b-mean)**2,0)/scores.length);
  return {mean,std,advantages:scores.map(score=>std?(score-mean)/std:null)};
}
