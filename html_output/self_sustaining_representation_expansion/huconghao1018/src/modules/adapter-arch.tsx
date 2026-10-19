import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, hl, arrow } from './scene';

// 第8章：新座位怎么安排（残差适配器结构）
// 点方框看它负责什么；换适配器结构，参数量和论文 Table 2 的准确率一起变。

const W = 1000;
const H = 300;

type NodeId = 'conv' | 'bn' | 'adapter' | 'add' | 'out';

const RECTS: Record<NodeId, { x: number; y: number; w: number; h: number }> = {
  conv: { x: 196, y: 64, w: 132, h: 70 },
  bn: { x: 340, y: 74, w: 62, h: 50 },
  adapter: { x: 196, y: 186, w: 206, h: 64 },
  add: { x: 448, y: 132, w: 46, h: 46 },
  out: { x: 540, y: 122, w: 108, h: 66 },
};

const INFO: Record<NodeId, { title: string; text: string }> = {
  conv: {
    title: '主干卷积（冻结）',
    text: '上一批训练好的 3×3 卷积，参数被锁死。新同学的数据会经过它，但不会改它——这是老特征不丢的结构前提。',
  },
  bn: {
    title: 'BatchNorm（冻结）',
    text: '主干里的 BN 统计量同样固定。如果让它跟着新数据更新，老特征的分布会被整体平移，冻结就失效了。',
  },
  adapter: {
    title: '残差适配器（只训练这一支）',
    text: '每个卷积块旁边挂一个 1×1 卷积，只把新知识写进 Δθ。梯度从这条路走，主干一点不动。',
  },
  add: {
    title: '残差相加 ⊕',
    text: '主干的输出加上适配器的输出。加法的形式让"学不动时至少和原来一样好"成立，也让后面的重参数化能无损合并。',
  },
  out: {
    title: '输出特征',
    text: '维度和主干输出一致（512 维）。正因为维度不变，重参数化之后才能把适配器整个拿掉而输出不变。',
  },
};

const VARIANTS = [
  { id: '1x1', label: '1×1 卷积', acc: [65.87, 65.12, 61.6], param: 65536 },
  { id: '1x1bn', label: '1×1 卷积 + BN', acc: [65.88, 64.84, 60.72], param: 65536 + 512 },
  { id: '3x3', label: '3×3 卷积', acc: [64.28, 63.47, 60.81], param: 589824 },
] as const;

export default function AdapterArch() {
  const [sel, setSel] = useState<NodeId>('adapter');
  const [variant, setVariant] = useState<'1x1' | '1x1bn' | '3x3'>('1x1');

  const v = VARIANTS.find((x) => x.id === variant)!;

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // 输入
    rr(ctx, 46, 130, 86, 56, 8);
    ctx.fillStyle = '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    txt(ctx, 'x', 89, 164, 16, C.ink, 'center', 700);

    const box = (
      id: NodeId,
      fill: string,
      stroke: string,
      strokeW: number
    ) => {
      const r = RECTS[id];
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeW;
      ctx.stroke();
      if (sel === id) hl(ctx, r.x, r.y, r.w, r.h, C.orange, 8);
      void t;
    };

    // 主干区
    box('conv', '#fdfbf6', sel === 'conv' ? C.orange : C.blue, sel === 'conv' ? 2.4 : 1.6);
    txt(ctx, '主干', RECTS.conv.x + 12, RECTS.conv.y + 26, 14, C.blue, 'left', 700);
    box('bn', '#fdfbf6', sel === 'bn' ? C.orange : C.line, sel === 'bn' ? 2.4 : 1.4);
    txt(ctx, 'BN', RECTS.bn.x + 31, RECTS.bn.y + 30, 13, C.muted, 'center', 700);

    // 锁
    ctx.fillStyle = C.woodDark;
    rr(ctx, 292, 86, 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = C.woodDark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(298, 86, 4, Math.PI, 0);
    ctx.stroke();

    // 适配器
    box('adapter', 'rgba(34,141,92,0.08)', sel === 'adapter' ? C.orange : C.green, sel === 'adapter' ? 2.4 : 1.8);
    txt(ctx, '侧分支', RECTS.adapter.x + 12, RECTS.adapter.y + 24, 14, C.green, 'left', 700);
    // 卷积核示意
    if (variant === '3x3') {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          rr(ctx, RECTS.adapter.x + 104 + j * 14, RECTS.adapter.y + 16 + i * 14, 10, 10, 2);
          ctx.fillStyle = 'rgba(34,141,92,0.35)';
          ctx.fill();
        }
      }
    } else {
      rr(ctx, RECTS.adapter.x + 116, RECTS.adapter.y + 22, 16, 16, 3);
      ctx.fillStyle = 'rgba(34,141,92,0.45)';
      ctx.fill();
      if (variant === '1x1bn') {
        rr(ctx, RECTS.adapter.x + 146, RECTS.adapter.y + 24, 30, 12, 3);
        ctx.fillStyle = 'rgba(39,68,110,0.28)';
        ctx.fill();
      }
    }
    txt(ctx, variant === '3x3' ? '3×3' : '1×1', RECTS.adapter.x + 176, RECTS.adapter.y + 44, 12, C.muted, 'center', 600);

    // 相加与输出
    box('add', sel === 'add' ? 'rgba(240,126,71,0.12)' : '#fdfbf6', sel === 'add' ? C.orange : C.blue, 1.8);
    ctx.save();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RECTS.add.x + 13, RECTS.add.y + 23);
    ctx.lineTo(RECTS.add.x + 33, RECTS.add.y + 23);
    ctx.moveTo(RECTS.add.x + 23, RECTS.add.y + 13);
    ctx.lineTo(RECTS.add.x + 23, RECTS.add.y + 33);
    ctx.stroke();
    ctx.restore();
    box('out', '#fdfbf6', sel === 'out' ? C.orange : C.line, sel === 'out' ? 2.4 : 1.4);
    txt(ctx, '512', RECTS.out.x + 54, RECTS.out.y + 40, 15, C.ink, 'center', 700);

    // 连线
    arrow(ctx, 134, 158, 192, 120, C.blue, 1.6);
    arrow(ctx, 134, 162, 192, 210, C.green, 1.6);
    arrow(ctx, 330, 99, 338, 99, C.blue, 1.6);
    arrow(ctx, 404, 99, 444, 140, C.blue, 1.6);
    arrow(ctx, 404, 218, 444, 174, C.green, 1.6);
    arrow(ctx, 496, 155, 536, 155, C.blue, 1.8);

    // 参数条
    const bars = [
      { v: v.param, c: C.green },
      { v: 11_173_000, c: C.line },
    ];
    txt(ctx, '参数', 700, 62, 13, C.muted, 'left', 600);
    bars.forEach((b, i) => {
      const w = 168 * Math.min(1, b.v / 11_173_000) + (b.v > 0 ? 6 : 0);
      rr(ctx, 700, 80 + i * 34, 168, 16, 8);
      ctx.fillStyle = '#efe9dd';
      ctx.fill();
      rr(ctx, 700, 80 + i * 34, w, 16, 8);
      ctx.fillStyle = b.c;
      ctx.fill();
      txt(ctx, (b.v / 10000).toFixed(1) + '万', 700 + w + 8, 93 + i * 34, 12, C.ink, 'left', 600);
    });
    txt(ctx, '适配器只占主干参数的一小部分，学完还会被合并掉。', 700, 210, 12, C.muted, 'left', 500);
  });

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    (Object.keys(RECTS) as NodeId[]).forEach((k) => {
      const b = RECTS[k];
      if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6) setSel(k);
    });
  };

  const info = INFO[sel];
  return (
    <div>
      <canvas ref={ref} style={{ cursor: 'pointer' }} onClick={onClick} />
      <div className="ctrl">
        <span style={{ color: C.muted }}>适配器结构</span>
        <div className="chip-row" style={{ margin: 0 }}>
          {VARIANTS.map((x) => (
            <button
              key={x.id}
              className={`chip ${variant === x.id ? 'selected' : ''}`}
              onClick={() => setVariant(x.id)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">选中组件</div>
          <div className="v" style={{ fontSize: 15 }}>{info.title}</div>
        </div>
        <div className="metric">
          <div className="l">适配器参数（C=256）</div>
          <div className="v">{(v.param / 10000).toFixed(1)} 万</div>
        </div>
        <div className="metric">
          <div className="l">CIFAR-100（5/10/20 批）</div>
          <div className="v" style={{ fontSize: 15 }}>
            {v.acc.join(' / ')}
          </div>
        </div>
      </div>
      <div className="feedback good">
        {info.text}
        {variant === '3x3'
          ? ' 换成 3×3 后参数是 1×1 的 9 倍，5 批准确率反而从 65.87% 掉到 64.28%——论文据此选了 1×1。'
          : ' 1×1 和 1×1+BN 在 5 批上几乎持平（65.87% vs 65.88%），作者选了更简单的 1×1。'}
      </div>
    </div>
  );
}
