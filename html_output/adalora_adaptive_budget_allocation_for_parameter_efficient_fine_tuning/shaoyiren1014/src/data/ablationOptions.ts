export type AblationId='structure'|'allocation'|'orthogonal'|'score';
export const ablationPredictions=[{id:'lower',label:'我预计报告值会降低。'},{id:'similar',label:'我预计会比较接近。'},{id:'uncertain',label:'我还不能确定，可能因条件而异。'}] as const;
export const ablationOptions=[
 {id:'structure',name:'替换方向结构',table:'table-4',page:9,datasets:['SST-2','RTE','CoLA'],budgets:['0.08','0.16','0.65'],methods:['Prune LoRA']},
 {id:'allocation',name:'移除动态分配',table:'table-5',page:10,datasets:['SST-2','MNLI'],budgets:['0.08','0.16','0.32','0.65'],methods:['SVD-LoRA']},
 {id:'orthogonal',name:'移除方向约束',table:'table-5',page:10,datasets:['SST-2','MNLI'],budgets:['0.08','0.16','0.32','0.65'],methods:['AdaLoRA gamma=0']},
 {id:'score',name:'简化重要性评分',table:'table-4',page:9,datasets:['SST-2','RTE','CoLA'],budgets:['0.08','0.16','0.65'],methods:['Sensitivity only','Magnitude only']},
] as const;
export function ablationConfig(id:AblationId){return ablationOptions.find(a=>a.id===id)!;}
export function validContext(id:AblationId,dataset:string,budget:string){const c=ablationConfig(id);return (c.datasets as readonly string[]).includes(dataset)&&(c.budgets as readonly string[]).includes(budget);}
