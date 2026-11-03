export type Experiment={id:string;title:string;protocol:string;capacity:number;metric:string;setup:string;locator:string;evidence:string;values:readonly {method:string;mean:number;spread:number}[];conclusion:string};
export const EXPERIMENTS: readonly Experiment[]=[
{id:"cifar-class",title:"S-CIFAR-10",protocol:"Class-IL · 不提供测试任务 ID",capacity:500,metric:"全部任务训练结束后的平均准确率 (%)",setup:"5×2 类；非预训练 ResNet18；50 epochs/task；Table 2 平均十次不同初始化，± 按原表保留。",locator:"Table 2, p.6；§4.1–4.2",evidence:"R01",values:[{method:"ER",mean:57.74,spread:.27},{method:"DER",mean:70.51,spread:1.67},{method:"DER++",mean:72.70,spread:1.36}],conclusion:"在这个 Class-IL、K=500 设置下，DER 与 DER++ 的表中最终平均准确率高于 ER。"},
{id:"cifar-task",title:"S-CIFAR-10",protocol:"Task-IL · 测试提供任务身份",capacity:500,metric:"全部任务训练结束后的平均准确率 (%)",setup:"5×2 类；非预训练 ResNet18；50 epochs/task；与左一选例的主要区别是测试协议。Table 2 平均十次不同初始化。",locator:"Table 2, p.6；§4.2",evidence:"R02",values:[{method:"ER",mean:93.61,spread:.27},{method:"DER",mean:93.40,spread:.39},{method:"DER++",mean:93.88,spread:.50}],conclusion:"DER 的表中均值略低于 ER，不能概括为每一设置都胜出。这里可用测试任务身份，不能与 Class-IL 混作同一指标。"},
{id:"mnist500",title:"MNIST-360",protocol:"无稳定任务边界 · 渐变与突变分布",capacity:500,metric:"整条流训练结束后的准确率 (%)",setup:"数字0–8；九组连续类别对重复三轮；每图像只呈现一次；2×100 ReLU MLP；当前与回放 batch 大小经搜索。",locator:"Table 3, p.7；§4.3；Appendix B.2",evidence:"R04",values:[{method:"ER",mean:65.04,spread:1.53},{method:"DER",mean:69.11,spread:1.66},{method:"DER++",mean:69.62,spread:1.59}],conclusion:"支持这个 GCL 基准中的竞争力；数据流、网络与 batch 搜索条件同时限定了结论，不是单独机制的因果证明。"},
{id:"mnist200",title:"MNIST-360",protocol:"无稳定任务边界 · 整条流结束 · 小容量反例",capacity:200,metric:"整条流训练结束后的准确率 (%)",setup:"同一 MNIST-360 数据流与 MLP；K=200。展示经 W3 核对的 DER / DER++ 表项。",locator:"Table 3, p.7",evidence:"R05",values:[{method:"DER",mean:55.22,spread:1.67},{method:"DER++",mean:54.16,spread:3.02}],conclusion:"在 K=200 时，DER++ 的表中均值低于 DER。额外标签监督不保证每个容量设置更优。"}
];
export const COUNTEREXAMPLES=[
{setting:"S-Tiny ImageNet · Class-IL · K=200",text:"DER 11.87±0.78 > DER++ 10.96±1.17",source:"Table 2, p.6",evidence:"R05"},
{setting:"S-CIFAR-10 · Task-IL · K=5120",text:"ER 96.98±0.17 > DER++ 96.12±0.21",source:"Table 2, p.6",evidence:"R05"},
{setting:"MNIST-360 · K=200",text:"DER 55.22±1.67 > DER++ 54.16±3.02",source:"Table 3, p.7",evidence:"R05"},
] as const;
