import React, { useMemo, useState } from 'react';

type Region = 'edge' | 'cross' | 'petiole' | 'spot';

const regions: Record<Region, {
  label: string;
  hint: string;
  x: number;
  y: number;
  vector: number[];
}> = {
  edge: {
    label: '叶缘',
    hint: '锯齿边缘形成连续轮廓证据',
    x: 205,
    y: 225,
    vector: [0.1, 0.2, 0.8, 0.15, 0.35, 0.1, 0.55, 0.2, 0.05, 0.35, 0.15, 0.25],
  },
  cross: {
    label: '叶脉交叉',
    hint: '交叉纹理同时点亮多个通用方向',
    x: 350,
    y: 205,
    vector: [0.55, 0.7, 0.4, 0.85, 0.6, 0.35, 0.75, 0.5, 0.65, 0.3, 0.8, 0.45],
  },
  petiole: {
    label: '叶柄',
    hint: '细长柄部给出一组稳定的方向证据',
    x: 485,
    y: 340,
    vector: [0.15, 0.5, 0.2, 0.1, 0.75, 0.65, 0.15, 0.8, 0.2, 0.05, 0.3, 0.55],
  },
  spot: {
    label: '叶斑',
    hint: '局部色差只点亮少量教学维度',
    x: 440,
    y: 270,
    vector: [0.05, 0.1, 0.15, 0.45, 0.1, 0.05, 0.2, 0.1, 0.8, 0.15, 0.1, 0.05],
  },
};

const classes = [
  [0.7, 0.25, 0.6, 0.2, 0.15, 0.55, 0.3, 0.2, 0.1, 0.45, 0.35, 0.25],
  [0.2, 0.65, 0.15, 0.5, 0.7, 0.1, 0.55, 0.4, 0.25, 0.3, 0.15, 0.6],
  [0.35, 0.15, 0.25, 0.75, 0.2, 0.4, 0.15, 0.7, 0.55, 0.1, 0.65, 0.45],
];

function cosine(a: number[], b: number[]) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const na = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const nb = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return dot / Math.max(0.0001, na * nb);
}

export function RpCh2FeatureLens() {
  const [region, setRegion] = useState<Region>('cross');
  const selected = regions[region];
  const scores = useMemo(() => classes.map((vector) => cosine(selected.vector, vector)), [selected]);
  const best = scores.indexOf(Math.max(...scores));

  return (
    <div className="rp-widget rp-two-col rp-lens-widget">
      <section className="rp-panel rp-canvas-panel">
        <div className="rp-context-block">
          <h3>预训练模型提供什么</h3>
          <p>
            RanPAC 的起点是<strong>冻结的预训练模型</strong>。
            论文使用在 ImageNet 上预训练的 ViT-B/16（Vision Transformer），
            它将输入图像映射为 <strong>L=768 维的特征向量 f</strong>。
            这个特征提取器在整个持续学习过程中保持冻结，参数完全不更新。
          </p>
          <p>
            <strong>为什么冻结预训练模型有效？</strong>
            预训练模型在大规模数据集上学到的通用表征（generic representations）
            已经包含丰富的可复用证据。只要下游任务与预训练数据分布不是完全无关，
            这些冻结特征就能为新类别提供有意义的区分信号。
          </p>
          <p>
            论文第2页图1的 t-SNE 可视化显示：即使是冻结的 ViT-B/16 特征，
            CIFAR-100 的不同类别在特征空间中也已经呈现出一定的聚类结构。
          </p>
        </div>
        <div className="rp-panel-heading">
          <span>冻结 ViT-B/16 原始特征 f</span>
          <strong>{`L=768 · 教学显示 12 维`}</strong>
        </div>
        <div className="rp-leaf-stage">
          <svg viewBox="0 0 680 420" role="img" aria-label="叶片的四个局部观察区域">
            <path d="M95 265 C170 55 470 45 585 190 C505 360 220 405 95 265 Z" className="rp-leaf-body" />
            <path d="M115 280 C235 235 420 170 565 190" className="rp-leaf-vein" />
            <path d="M205 225 C280 150 340 120 430 90" className="rp-leaf-vein is-thin" />
            <path d="M350 205 C385 245 420 285 485 340" className="rp-leaf-vein is-thin" />
            <path d="M440 270 C470 230 505 190 550 140" className="rp-leaf-vein is-thin" />
            {(Object.keys(regions) as Region[]).map((key) => (
              <circle
                key={key}
                cx={regions[key].x}
                cy={regions[key].y}
                r={key === region ? 30 : 17}
                className={`rp-hotspot ${key === region ? 'is-active' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`选择${regions[key].label}`}
                onClick={() => setRegion(key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setRegion(key);
                  } else if (event.key.startsWith('Arrow')) {
                    event.preventDefault();
                    const all = Object.keys(regions) as Region[];
                    const current = all.indexOf(key);
                    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                      ? (current + 1) % all.length
                      : (current - 1 + all.length) % all.length;
                    setRegion(all[next]);
                  }
                }}
              />
            ))}
          </svg>
          <div className="rp-lens-loupe" style={{
            transform: `translate(calc(${selected.x}px - 50%), calc(${selected.y}px - 50%))`,
          }} aria-hidden="true">
            <span />
          </div>
        </div>
        <div className="rp-region-buttons">
          {(Object.keys(regions) as Region[]).map((key) => (
            <button
              key={key}
              className={key === region ? 'is-active' : ''}
              onClick={() => setRegion(key)}
            >
              {regions[key].label}
            </button>
          ))}
        </div>
      </section>

      <section className="rp-panel rp-controls-panel">
        <div className="rp-context-block">
          <p>
            <strong>特征向量的结构：</strong>
            实际的 ViT-B/16 输出 768 维特征向量，这里用 12 维教学向量演示。
            不同的图像区域（叶缘、叶脉交叉、叶柄、叶斑）激活不同的特征维度组合，
            反映了预训练模型对纹理、形状、边缘等通用视觉模式的编码。
          </p>
          <p>
            <strong>余弦相似度分类（NCM）：</strong>
            最简单的分类方法是计算测试特征与各类均值的余弦相似度，
            选择相似度最高的类别。这就是<strong>最近类均值（Nearest Class Mean, NCM）</strong>分类器，
            对应论文第4页公式(1)：
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '26px', paddingLeft: '16px' }}>
            ŷ = argmax_y cos(f_test, c_y) = argmax_y (f_test^T c_y) / (||f_test|| ||c_y||)
          </p>
          <p>
            其中 c_y 是类 y 的特征均值（类原型）。
          </p>
        </div>
        <div className="rp-panel-heading">
          <span>选中区域</span>
          <strong>{selected.label}</strong>
        </div>
        <div className="rp-kicker">{selected.hint}</div>
        <div className="rp-feature-grid">
          {selected.vector.map((value, index) => (
            <div key={index} className="rp-feature-bar">
              <span>{`d${index + 1}`}</span>
              <i style={{ width: `${value * 100}%`, opacity: 0.5 + value * 0.5 }} />
            </div>
          ))}
        </div>
        <div className="rp-panel-heading" style={{ marginTop: '8px' }}>
          <span>最近类</span>
          <strong>{['类 A · 橙叶', '类 B · 蓝叶', '类 C · 紫叶'][best]}</strong>
        </div>
        <div className="rp-score-stack">
          {scores.map((score, index) => (
            <div key={index} className={index === best ? 'is-best' : ''}>
              <span>{`类 ${String.fromCharCode(65 + index)}`}</span>
              <i style={{ width: `${score * 100}%` }} />
              <strong>{score.toFixed(3)}</strong>
            </div>
          ))}
        </div>
        <div className="rp-context-block">
          <p>
            <strong>问题在哪里？</strong>
            虽然冻结特征已经包含区分信号，但不同类别的特征均值可能共享很多公共方向
            （例如背景纹理、光照模式）。余弦相似度只比较方向，无法消除这些共享成分，
            导致类别区分度不够高。下一章将展示这个问题，并引入 Gram 矩阵去相关的方法。
          </p>
        </div>
      </section>
    </div>
  );
}
