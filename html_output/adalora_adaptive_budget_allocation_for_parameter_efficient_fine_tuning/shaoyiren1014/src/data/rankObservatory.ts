import evidence from './rankDistributionEvidence.json';
export const rankEvidence=evidence;
export const matrices=['Wf2','Wf1','Wo','Wv','Wk','Wq'] as const;
export type Matrix=typeof matrices[number];
export type ModuleFilter='all'|'Attention'|'FFN';
export type LayerFilter='all'|'lower'|'higher';
export interface RankCell{matrix:Matrix;layer:number;}
export const matrixLabels:Record<Matrix,string>={Wf2:'FFN · 输出变换',Wf1:'FFN · 扩展变换',Wo:'Attention · 输出',Wv:'Attention · 内容 V',Wk:'Attention · 索引 K',Wq:'Attention · 查询 Q'};
export const modulePredictions=[{id:'ffn',label:'FFN 会留下更多容量。'},{id:'attention',label:'Attention 会留下更多容量。'},{id:'same',label:'各类位置可能差不多。'}];
export const layerPredictions=[{id:'higher',label:'较后面的层会留下更多容量。'},{id:'lower',label:'较前面的层会留下更多容量。'},{id:'same',label:'层的位置可能没有明显区别。'}];
export function rowsFor(filter:ModuleFilter):Matrix[]{return matrices.filter(m=>filter==='all'||(filter==='FFN'?m.startsWith('Wf'):!m.startsWith('Wf')));}
export function layersFor(filter:LayerFilter):number[]{return evidence.layers.filter(l=>filter==='all'||(filter==='lower'?l<=6:l>=7));}
export function validCell(c:unknown):c is RankCell{if(!c||typeof c!=='object')return false;const v=c as RankCell;return matrices.includes(v.matrix)&&Number.isInteger(v.layer)&&v.layer>=1&&v.layer<=12;}
export function rankAt(c:RankCell):number{return evidence.values[c.matrix][c.layer-1];}
export function isSupport(c:RankCell){return c.matrix==='Wf1'&&c.layer>=5&&c.layer<=11&&rankAt(c)>=11;}
export function isException(c:RankCell){return c.layer===12&&['Wf1','Wf2','Wq'].includes(c.matrix);}
export function cellLabel(c:RankCell){return `第 ${c.layer} 层 ${c.matrix} · Rank ${rankAt(c)}`;}
export function neighbor(c:RankCell,key:string,module:ModuleFilter,layer:LayerFilter):RankCell{const rows=rowsFor(module),cols=layersFor(layer),ri=rows.indexOf(c.matrix),ci=cols.indexOf(c.layer);return {matrix:rows[Math.max(0,Math.min(rows.length-1,ri+(key==='ArrowDown'?1:key==='ArrowUp'?-1:0)))],layer:cols[Math.max(0,Math.min(cols.length-1,ci+(key==='ArrowRight'?1:key==='ArrowLeft'?-1:0)))]};}
export function rankColor(rank:number){const t=rank/12;return `rgb(${Math.round(225-94*t)}, ${Math.round(207-32*t)}, ${Math.round(169-5*t)})`;}
