export type LearnParams={a1:number;a2:number;v:number;b:number};
export const initialParams:LearnParams={a1:.3,a2:-.5,v:.8,b:-.5};
export const learnInput=[1,.4] as const;
export const learnRate=.5;
export const parameterKeys=['a1','a2','v','b'] as const;
export function forward(t:LearnParams,x:readonly number[]=learnInput){
 const u=t.a1*x[0]+t.a2*x[1],h=Math.tanh(u),z=t.v*h+t.b,p=1/(1+Math.exp(-z));
 return {u,h,z,p,loss:Math.max(z,0)-z+Math.log1p(Math.exp(-Math.abs(z)))};
}
export function learningRound(t:LearnParams){
 const before=forward(t),dz=before.p-1,dh=dz*t.v,du=dh*(1-before.h**2);
 const gradient:LearnParams={a1:du*learnInput[0],a2:du*learnInput[1],v:dz*before.h,b:dz};
 const updated={...t};for(const key of parameterKeys)updated[key]=t[key]-learnRate*gradient[key];
 return {before,dz,dh,du,gradient,updated,after:forward(updated)};
}
