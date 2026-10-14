export function budgetLabel(r:{budget:{kind:string;value:number}}){return r.budget.kind==='trainable_params_million'?`${r.budget.value.toFixed(2)}M（百万参数）`:`${r.budget.value.toFixed(2)}%`;}
