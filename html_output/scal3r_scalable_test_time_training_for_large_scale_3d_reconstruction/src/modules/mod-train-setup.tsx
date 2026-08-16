import React from 'react';
import type { WidgetProps } from './registry';

// §6 模块 6.2 —— 实验设置（训练细节）。
// 静态规格卡片，逐项摘自论文 4.3 Training，格式参考 ELF 教程 10.2 的
// compare-row / compare-cell（label + 大字 val + 一行 mini 说明），末尾附出处脚注。
interface Spec {
  label: string;
  val: string;
  mini: string;
}

const SPECS: Spec[] = [
  {
    label: '① 优化器',
    val: 'AdamW',
    mini: 'GCM 模块与 VGGT 主干端到端联合训练',
  },
  {
    label: '② 峰值学习率',
    val: '1e-4 / 1e-5',
    mini: 'GCM 用 1×10⁻⁴，主干（backbone）用 1×10⁻⁵',
  },
  {
    label: '③ 学习率调度',
    val: 'cosine + 2k warmup',
    mini: '余弦衰减，配 2k 迭代的线性预热',
  },
  {
    label: '④ 梯度裁剪',
    val: 'max norm 1.0',
    mini: '按最大范数 1.0 裁剪梯度，稳定训练',
  },
  {
    label: '⑤ 训练步数 · 硬件',
    val: '60k · 32×A800',
    mini: '在 32 张 A800 上跑 6 万迭代，约 3 天完成',
  },
  {
    label: '⑥ 训练数据',
    val: '17 个数据集',
    mini: 'Co3Dv2 / BlendedMVS / MegaDepth / ScanNet++ … MatrixCity，室内外·合成/真实',
  },
  {
    label: '⑦ 训练目标',
    val: '多任务损失（式 11）',
    mini: '相机 L1 + 深度/点图（置信度加权 + 梯度正则），见 6.1',
  },
  {
    label: '⑧ 长度泛化技巧',
    val: '有效序列 1–32 块',
    mini: '每步随机把 32 GPU 分组，仅组内做 GCS，训练时序列长度可变',
  },
];

export const ModTrainSetup: React.FC<WidgetProps> = () => {
  return (
    <div>
      <div className="spec-grid">
        {SPECS.map((s) => (
          <div className="spec-card" key={s.label}>
            <div className="spec-label">{s.label}</div>
            <div className="spec-val">{s.val}</div>
            <div className="spec-mini">{s.mini}</div>
          </div>
        ))}
      </div>
      <div className="feedback good">
        以上参数逐项摘自论文 <b>4.3 Training</b>（Implementation details）。训练目标一栏对应式 11，详见 6.1。
      </div>
    </div>
  );
};

export default ModTrainSetup;
