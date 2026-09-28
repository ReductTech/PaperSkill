const datasetRefs = {
  ImageNet: "dataset-imagenet",
  Places365: "dataset-places365",
  CUB: "dataset-cub",
  VOC: "dataset-voc",
  "Indoor Scenes": "dataset-scenes",
  MNIST: "dataset-mnist",
} as const;

export function ResultProtocolCard({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  return <div className="v3-protocol-card" aria-label="论文实验协议概览">
    <article><span>OLD TASKS</span><div>{(["ImageNet", "Places365"] as const).map((name) => <button key={name} type="button" onClick={() => onOpenReference(datasetRefs[name])}>{name}</button>)}</div></article>
    <article><span>NEW TASKS</span><div>{(["CUB", "PASCAL VOC", "Indoor Scenes", "MNIST"] as const).map((name) => <button key={name} type="button" onClick={() => onOpenReference(datasetRefs[name === "PASCAL VOC" ? "VOC" : name])}>{name}</button>)}</div></article>
    <article><span>ARCHITECTURE</span><strong>主要使用 AlexNet；较小范围的复核使用 VGG-16</strong></article>
    <article><span>METRIC & SPLIT</span><strong>VOC 报告 mAP，其余任务报告 accuracy；数据集使用的验证 / 测试划分不同</strong></article>
    <article><span>TRAINING-DATA AVAILABILITY</span><strong>LwF 适配只用新任务训练数据；旧任务 validation / test 仍用于评估。Joint Training 对照使用新旧任务图像与标签</strong></article>
    <article><span>COMPARED METHODS</span><strong>Fine-tuning · Feature Extraction · Fine-tune FC · LFL · Joint Training，以及架构与损失消融</strong></article>
    <p>论文包含多组任务对，不能把一张表的任务、划分或指标套到全篇。选中证据后，先看该实验的具体协议，再看结果。</p>
  </div>;
}
