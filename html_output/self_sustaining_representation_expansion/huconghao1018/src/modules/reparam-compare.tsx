import React, { useRef, useState } from 'react';
import { C, useScene, txt, line, rr, dot, bar, clamp, ring, smooth } from './scene';

// 第9章：拆掉临时过道（结构重参数化）
// 拖融合手柄：训练态的两条路被折进主干，参数量回落，输出一点不变。

const W = 1000;
const H = 300;
const N = 11_173_000; // ResNet-18 主干参数（约 11.17M）
const D = 65_536; // 一个 1×1 适配器的参数（C=256）

export default function ReparamCompare() {
  const [f, setF] = useState(0);
  const dragging = useRef(false);
  const fRef = useRef(0);

  const set = (v: number) => {
    const k = clamp(v, 0, 1);
    fRef.current = k;
    setF(k);
  };

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const p = fRef.current;
    const absorb = smooth(p);

    // 主干（始终在）
    rr(ctx, 150, 54, 260, 72, 10);
    ctx.fillStyle = '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    txt(ctx, '主干', 168, 84, 14, C.blue, 'left', 700);
    txt(ctx, '512', 168, 106, 12, C.muted, 'left', 600);

    // 侧分支：随融合上移并淡出
    const cy = 176 - 96 * absorb;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - absorb * 1.05);
    rr(ctx, 150, cy, 260, 62, 10);
    ctx.fillStyle = 'rgba(34,141,92,0.08)';
    ctx.fill();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    txt(ctx, '侧分支', 168, cy + 28, 14, C.green, 'left', 700);
    txt(ctx, 'Δθ', 168, cy + 48, 12, C.green, 'left', 600);
    ctx.restore();

    // 融合节点
    const mg = 462;
    dot(ctx, mg, 122, 16, p > 0.6 ? 'rgba(34,141,92,0.14)' : 'rgba(39,68,110,0.10)');
    ctx.save();
    ctx.strokeStyle = p > 0.6 ? C.green : C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mg, 122, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mg - 6, 122);
    ctx.lineTo(mg + 6, 122);
    ctx.moveTo(mg, 116);
    ctx.lineTo(mg, 128);
    ctx.stroke();
    ctx.restore();

    // 输出
    rr(ctx, 520, 90, 120, 64, 10);
    ctx.fillStyle = '#fdfbf6';
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    txt(ctx, '输出', 580, 112, 13, C.muted, 'center', 600);
    txt(ctx, '0.42', 556, 138, 12, C.ink, 'center', 600);
    txt(ctx, '-0.17', 604, 138, 12, C.ink, 'center', 600);

    line(ctx, 410, 90, mg - 18, 116, p > 0.5 ? C.green : C.blue, 1.8);
    line(ctx, 410, cy + 30, mg - 18, 128, C.green, 1.8);
    line(ctx, mg + 16, 122, 516, 122, C.blue, 1.8);

    // 等价性标记
    if (p > 0.85) {
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(672, 116);
      ctx.lineTo(682, 126);
      ctx.lineTo(700, 104);
      ctx.stroke();
      ctx.restore();
    }

    // 参数量条
    const params = N + D * (1 - p);
    const pw = 300 * ((params - N) / D);
    txt(ctx, '参数量', 700, 62, 12, C.muted, 'left', 600);
    rr(ctx, 700, 72, 300, 12, 6);
    ctx.fillStyle = '#efe9dd';
    ctx.fill();
    if (pw > 1) {
      bar(ctx, 700, 72, Math.max(4, pw), 12, C.green, 6);
    }
    txt(ctx, (params / 1e6).toFixed(3) + ' M', 700, 104, 13, C.ink, 'left', 700);
    txt(ctx, p > 0.9 ? '和训练前一样' : '多出来的部分', 700, 124, 11, C.muted, 'left', 500);

    // 融合拖拽轨道
    const tx0 = 150;
    const tx1 = 520;
    line(ctx, tx0, 280, tx1, 280, C.line, 4);
    line(ctx, tx0, 280, tx0 + (tx1 - tx0) * p, 280, C.orange, 4);
    dot(ctx, tx0 + (tx1 - tx0) * p, 280, 10, C.orange);
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx0 + (tx1 - tx0) * p, 280, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (dragging.current) ring(ctx, tx0 + (tx1 - tx0) * p, 280, 16, C.orange, t);
    txt(ctx, '训练', tx0, 270, 11, C.muted, 'left', 500);
    txt(ctx, '推理', tx1, 270, 11, C.muted, 'right', 500);
  });

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    set((x - 150) / 370);
  };

  const branches = f > 0.9 ? 1 : 2;
  const params = N + D * (1 - f);
  const fb =
    f < 0.15
      ? {
          cls: '',
          text: '训练态：新同学走侧分支，主干预设全冻。两路相加，参数比原来多一点点。',
        }
      : f < 0.85
      ? {
          cls: '',
          text: `融合中（${(f * 100).toFixed(0)}%）：侧分支的卷积核与 BN 被零填充、线性变换折算进主干卷积，数值上完全等价。`,
        }
      : {
          cls: 'good',
          text: '推理态：只剩一条路，参数量回到 11.173M，输出仍是 (0.42, −0.17)。结构回到起点，下一批可以再按同样方式扩——这就是"自持续"的含义。',
        };

  return (
    <div>
      <canvas
        ref={ref}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) * W) / r.width;
          const y = ((e.clientY - r.top) * H) / r.height;
          if (y > 220 || y < 290) set((x - 150) / 370);
        }}
        onPointerMove={onMove}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      />
      <div className="ctrl">
        <label>
          融合进度 <span className="val">{(f * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(f * 100)}
          onChange={(e) => set(Number(e.target.value) / 100)}
        />
        <button className="tiny ghost" onClick={() => set(0)}>
          回到训练态
        </button>
        <button className="tiny ghost" onClick={() => set(1)}>
          直接到推理态
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">分支数</div>
          <div className="v">{branches}</div>
        </div>
        <div className="metric">
          <div className="l">参数量</div>
          <div className="v">{(params / 1e6).toFixed(3)} M</div>
        </div>
        <div className="metric">
          <div className="l">输出（前两维）</div>
          <div className="v" style={{ fontSize: 16 }}>0.42 / −0.17</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}
