import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 360;
const topics = [
  {
    key: '贡献',
    title: '贡献：规模与系统评测',
    lines: [
      '以四亿图文对做对比预训练，把文本监督推到网络规模。',
      '在三十多个数据集上系统评测零样本、少样本与鲁棒性。',
      '作者自述：图文对比与零样本此前已有工作，本文贡献在规模与行为研究。',
    ],
    evidence: '§7-1（p.9，L633–635）；§3；§4',
    color: '#27446e',
  },
  {
    key: '边界',
    title: '性能边界：追平而非全面领先',
    lines: [
      'ImageNet 零样本 76.2%，追平原版 ResNet50。',
      '27 个数据集中赢 16 个，且只是略优；卫星图、肿瘤、计数等任务落后 10% 以上。',
      '零样本要达总体 SOTA，按曲线外推估计还需约 1000 倍算力。',
    ],
    evidence: '§3.1（p.4，L284–290）；§3.2-2；§3.2-3；§6-1',
    color: '#c43f52',
  },
  {
    key: '局限',
    title: '方法论局限：评测与协议',
    lines: [
      '开发过程中反复查询验证集，不符合真正零样本设定。',
      '27 数据集套件与 CLIP 能力共适应，作者称其为“颇为随意拼凑”。',
      '从零样本切换到少样本，性能反而下降。',
    ],
    evidence: '§6-2、§6-3（p.8–9，L599–629）',
    color: '#92400e',
  },
];

export const AuditWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '选择一层，查看论文原文给出的结论与依据。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('论文自己的三层结论', 40, 34);

    topics.forEach((t, i) => {
      ctx.fillStyle = i === idx ? t.color : '#b8c9a7';
      ctx.fillRect(40 + i * 340, 55, 310, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(t.key, 60 + i * 340, 81);
    });

    const cur = topics[idx];
    ctx.fillStyle = cur.color;
    ctx.fillRect(40, 120, 8, 190);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(cur.title, 66, 148);
    ctx.font = '16px "Segoe UI", sans-serif';
    cur.lines.forEach((line, i) => {
      ctx.fillText('· ' + line, 66, 190 + i * 42);
    });
    ctx.fillStyle = '#68778f';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('依据：' + cur.evidence, 66, 330);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        {topics.map((t, i) => (
          <button key={t.key} onClick={() => {
            setIdx(i);
            setFb({ text: t.title + '。依据：' + t.evidence, cls: i === 1 || i === 2 ? 'bad' : '' });
          }}>{t.key}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default AuditWidget;
