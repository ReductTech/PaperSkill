import { softmax } from "./math-model.ts";
import { reservoirInsert, type MemoryRecord, type MemoryState } from "./reservoir-model.ts";
export type Mode = "DER" | "DER++";
export type Vec = readonly number[];
export type Matrix = readonly Vec[];
export type TrainingRecord = MemoryRecord & { u: Vec; y?: number };
export type TrainingState = MemoryState<TrainingRecord> & { W: Matrix; updates: number };
export const W0: Matrix = [[.2,-.1],[0,.1],[-.1,0]];
export const CONFIG = { eta: .1, alpha: .5, beta: .5, capacity: 2 } as const;
export const STREAM = [
 { id:"x₁",model:0,u:[1,0],y:0,s:1,rd:null,sd:-1,ry:null,sy:1,j:undefined },
 { id:"x₂",model:1,u:[0,1],y:1,s:-1,rd:"x₁",sd:-1,ry:"x₁",sy:1,j:undefined },
 { id:"x₃",model:2,u:[1,1],y:2,s:1,rd:"x₁",sd:1,ry:"x₂",sy:-1,j:0 },
 { id:"x₄",model:0,u:[1,-1],y:0,s:-1,rd:"x₂",sd:-1,ry:"x₃",sy:1,j:3 },
] as const;
export const viewOf = (u: Vec, s: number): number[] => [u[0]+.1*s,u[1]];
export const forward = (W: Matrix, u: Vec) => W.map(row=>row.reduce((sum,v,k)=>sum+v*u[k],0));
const zeros = (): number[][] => [[0,0],[0,0],[0,0]];
const outer = (v: Vec, u: Vec) => v.map(x=>u.map(y=>x*y));
export const crossEntropy = (logits: Vec, y: number) => {
 const max=Math.max(...logits);return Math.log(logits.reduce((sum,v)=>sum+Math.exp(v-max),0))+max-logits[y];
};
export function initialState(): TrainingState { return {W:W0.map(r=>[...r]),K:2,N:0,M:[],updates:0}; }
/** Deterministic single step. Choices reference only existing M; no access to removed records. */
export function trainStep(before: TrainingState, input: typeof STREAM[number], mode: Mode) {
 const {W,M}=before, currentView=viewOf(input.u,input.s), currentLogits=forward(W,currentView);
 const q=softmax(currentLogits), gc=outer(q.map((v,k)=>v-(k===input.y?1:0)),currentView);
 const read = (id: string | null) => { if(!id)return null;const record=M.find(r=>r.id===id);if(!record)throw Error("Replay must read old M");return record; };
 const rd=read(input.rd), ry=mode==="DER++"?read(input.ry):null;
 const replayView=rd?viewOf(rd.u,input.sd):null, replayLogits=replayView?forward(W,replayView):null;
 const labelView=ry?viewOf(ry.u,input.sy):null, labelLogits=labelView?forward(W,labelView):null;
 const delta=rd&&replayLogits?replayLogits.map((v,k)=>v-rd.z[k]):[];
 const dark=delta.reduce((sum,v)=>sum+v*v,0);
 const gd=replayView?outer(delta.map(v=>2*v),replayView):zeros();
 const label=ry&&labelLogits?crossEntropy(labelLogits,ry.y!):0;
 const gl=ry&&labelLogits&&labelView?outer(softmax(labelLogits).map((v,k)=>v-(k===ry.y?1:0)),labelView):zeros();
 const current=crossEntropy(currentLogits,input.y), total=current+CONFIG.alpha*dark+(mode==="DER++"?CONFIG.beta*label:0);
 const gradient=gc.map((row,k)=>row.map((v,j)=>v+CONFIG.alpha*gd[k][j]+(mode==="DER++"?CONFIG.beta*gl[k][j]:0)));
 const nextW=W.map((row,k)=>row.map((v,j)=>v-CONFIG.eta*gradient[k][j]));
 const candidate: TrainingRecord={id:input.id,model:input.model,u:[...input.u],z:[...currentLogits],origin:`θ${before.updates}`,...(mode==="DER++"?{y:input.y}:{})};
 const insertion=reservoirInsert<TrainingRecord>(before,candidate,input.j);
 const updated: TrainingState={...before,W:nextW,updates:before.updates+1};
 const after: TrainingState={...insertion.after,W:nextW,updates:before.updates+1};
 return {mode,input,before,updated,after,candidate,currentView,currentLogits,q,rd,ry,replayView,replayLogits,labelView,labelLogits,
  losses:{current,dark,label,total},gradients:{current:gc,dark:gd,label:gl,total:gradient},insertion};
}
export const runTraining = (mode: Mode) => {
 let state=initialState();return STREAM.map(input=>{const step=trainStep(state,input,mode);state=step.after;return step;});
};
export type TrainStep = ReturnType<typeof trainStep>;
export const predict = (state: TrainingState,u: Vec=[1,.5]) => {
 const logits=forward(state.W,u),q=softmax(logits);return {u,logits,q,label:logits.indexOf(Math.max(...logits))};
};
export const TRAIN_PHASES = ["读取旧记忆","当前前向与冻结","回放与损失","合并后一次更新","更新后选留"] as const;
export const WORKBENCH_CLIPS = [
 ...STREAM.flatMap((item,i)=>TRAIN_PHASES.map((name,phase)=>({id:`第 ${i+1} 轮 · ${item.id} / ${name}`,durationMs:[2200,6200,4600,3400,3200][phase],holdMs:1000}))),
 {id:"训练结束 · 只读预测",durationMs:4200,holdMs:1200},
];
export function trainingSceneAt(steps: readonly TrainStep[],clip: number,p: number) {
 const prediction=clip>=20,round=prediction?3:Math.floor(clip/5),phase=prediction?5:clip%5,step=steps[round];
 const state=phase>=5?step.after:phase===4?(p>=.88?step.after:step.updated):phase===3&&p>=.8?step.updated:step.before;
 return {step,round,phase,prediction,state};
}
