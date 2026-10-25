export const evidenceModels=['ViT-H/14 · JFT','ViT-L/16 · JFT','ViT-L/16 · IN-21k','BiT-L · JFT'];
export const evidenceTasks=[
 {name:'ImageNet',values:[88.55,87.76,85.30,87.54],sd:[.04,.03,.02,.02]},
 {name:'CIFAR-100',values:[94.55,93.90,93.25,93.51],sd:[.04,.05,.05,.08]},
 {name:'Flowers',values:[99.68,99.74,99.61,99.63],sd:[.02,0,.02,.03]},
 {name:'VTAB-19',values:[77.63,76.28,72.72,76.29],sd:[.23,.46,.21,1.70]}
];
export const evidenceCosts=[2500,680,230,9900];
export const evidenceClaims=[
 {title:'图块 + Transformer 能有效迁移',a:0,b:3,answer:0,reason:'这些任务支持有效迁移；前提是 JFT 大规模监督预训练与相应微调，不能推广到任意数据量与任务。'},
 {title:'H/14 比 L/16 每项都好',a:0,b:1,answer:1,reason:'Flowers 的报告均值：H/14 为 99.68%，L/16 为 99.74%。“每项均值都更高”有反例；这里未做显著性检验。'},
 {title:'L/16 在 VTAB 上确定优于 BiT',a:1,b:3,answer:2,reason:'76.28 ± 0.46 与 76.29 ± 1.70 很接近；标准差不是置信区间，仅凭汇总数不能认定确定优劣。'},
 {title:'预训练更省，所以推理也更快',a:0,b:3,answer:2,reason:'2,500 与 9,900 是预训练计算开销，没有推理延迟。训练更省不能推出推理更快，也不能隔离架构的因果作用。'}
];
