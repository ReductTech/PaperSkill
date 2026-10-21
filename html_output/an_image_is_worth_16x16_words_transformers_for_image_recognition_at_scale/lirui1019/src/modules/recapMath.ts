import {patchInputs,projection,clsSeed,positions,headWeights,multiply,norm,softmax} from './architectureMath';
// Fixed illustrative weights, not a trained ViT or a paper ablation.
export function recapForward(mode:'position'|'mixing',changed:boolean,repaired:boolean){
 const order=mode==='position'&&changed?[1,0,2,3]:[0,1,2,3];
 const raw=order.map(i=>patchInputs[i].map(v=>mode==='mixing'&&changed&&i===1?0:v));
 const projected=raw.map(r=>multiply(r,projection));
 const seeded=[clsSeed,...projected];
 const z=seeded.map((r,i)=>r.map((v,j)=>v+(mode!=='position'||repaired?positions[i][j]:0)));
 const normalized=z.map(norm);
 const weights=softmax(normalized.map(k=>normalized[0].reduce((s,v,j)=>s+v*k[j],0)/2));
 const mixed=z.map((r,i)=>r.map((v,j)=>v+((mode==='mixing'&&!repaired)?0:.3*softmax(normalized.map(k=>normalized[i].reduce((s,a,d)=>s+a*k[d],0)/2)).reduce((s,p,k)=>s+p*normalized[k][j],0))));
 const encoded=mixed.map(r=>r.map((v,j)=>v+.2*Math.tanh(norm(r)[j])));
 const cls=norm(encoded[0]),probabilities=softmax(multiply(cls,headWeights));
 return {order,raw,cls,probabilities,weights:mode==='mixing'&&!repaired?[1,0,0,0]:weights};
}
export function clsDifference(mode:'position'|'mixing',repaired:boolean){
 const a=recapForward(mode,false,repaired),b=recapForward(mode,true,repaired);
 return Math.sqrt(a.cls.reduce((s,v,i)=>s+(v-b.cls[i])**2,0));
}
