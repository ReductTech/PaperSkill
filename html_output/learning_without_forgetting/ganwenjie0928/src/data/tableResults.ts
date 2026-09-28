export type Table1MethodId = 'lwf' | 'fine-tuning' | 'feature-extraction' | 'joint-training';
export type Table1Row = { id: Table1MethodId; label: string; oldDelta: number | null; newDelta: number | null; oldData: boolean; trainableShared: boolean; oldResponse: boolean };

export const table1ImageNetCub = {
  experiment: {
    oldTask: 'ImageNet classification',
    newTask: 'CUB-200-2011 bird classification',
    architecture: 'AlexNet; fc8 task-specific',
    split: 'ImageNet validation; CUB test',
    metric: 'Top-1 accuracy',
    runs: 'Mean of three runs; center crop',
    source: 'Table 1(a), PDF p.7; protocol p.6',
  },
  baseline: { old: 54.7, next: 57.7 },
  methods: [
    { id:'lwf', label:'LwF', oldDelta:null, newDelta:null, oldData:false, trainableShared:true, oldResponse:true },
    { id:'fine-tuning', label:'Fine-tuning', oldDelta:-3.8, newDelta:-.7, oldData:false, trainableShared:true, oldResponse:false },
    { id:'feature-extraction', label:'Feature Extraction', oldDelta:2.3, newDelta:-5.2, oldData:false, trainableShared:false, oldResponse:false },
    { id:'joint-training', label:'Joint Training', oldDelta:.6, newDelta:-1.1, oldData:true, trainableShared:true, oldResponse:false },
  ] satisfies Table1Row[],
};

export function table1Absolute(row: Table1Row) {
  if (row.id === 'lwf') return table1ImageNetCub.baseline;
  return {
    old: table1ImageNetCub.baseline.old + row.oldDelta!,
    next: table1ImageNetCub.baseline.next + row.newDelta!,
  };
}
