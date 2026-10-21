import React, { useRef, useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, inset, legend, rrect, text } from './kit';

const W = 720;
const H = 260;
const SY = 92;

type Cfg = 'nohad' | 'had';

// ch9-config：P4 配置切换——no-had（W4A8KV8）vs had（W4A4KV4）
export const Ch9Config: React.FC = () => {
  const [cfg, setCfg] = useState<Cfg>('had');
  const mount = useRef(0);
  const had = cfg === 'had';

  const switchTo = (k: Cfg) => {
    if (k !== cfg) {
      mount.current = performance.now();
      setCfg(k);
    }
  };

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 460, 228, 26);

    // 管线：X → Wqkv → Attention → MLP，徽标挂载
    const ramp = had ? Math.min(1, (performance.now() - mount.current) / 150) : 1;
    const node = (x: number, w: number, label: string) => {
      rrect(ctx, x, SY - 18, w, 36, C.white, C.axis, 1.5, 7);
      text(ctx, label, x + w / 2, SY + 0.5, C.ink, 13, 'center');
    };
    const arrow = (x1: number, x2: number) => {
      ctx.strokeStyle = C.light;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, SY);
      ctx.lineTo(x2 - 6, SY);
      ctx.stroke();
      ctx.fillStyle = C.light;
      ctx.beginPath();
      ctx.moveTo(x2, SY);
      ctx.lineTo(x2 - 8, SY - 4);
      ctx.lineTo(x2 - 8, SY + 4);
      ctx.closePath();
      ctx.fill();
    };
    const rbadge = (x: number, y: number, label: string, color: string, on: boolean, alpha: number) => {
      if (!on) return;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x - 15, y - 11, 30, 22, 6);
      ctx.fill();
      ctx.stroke();
      text(ctx, label, x, y + 0.5, color, 12, 'center');
      ctx.globalAlpha = 1;
    };

    node(32, 64, 'X');
    arrow(96, 130);
    rbadge(112, SY - 34, 'R₁', C.green, true, 1);
    node(130, 72, 'Wqkv');
    arrow(202, 236);
    rbadge(218, SY - 34, 'R₂', C.green, true, 1);
    node(236, 88, 'Attention');
    arrow(324, 368);
    // H₃ 挂在 K 分支（在线）
    if (had) {
      ctx.globalAlpha = ramp;
      ctx.strokeStyle = C.light;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(280, SY - 18);
      ctx.lineTo(280, SY - 44);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    rbadge(280, SY - 56, 'H₃', C.purple, had, ramp);
    node(368, 66, 'MLP');
    arrow(434, 452);
    rbadge(444, SY - 34, 'H₄', C.purple, had, ramp);
    text(ctx, had ? 'R1–R4 全挂载' : '只挂 R1/R2', 250, SY + 40, had ? C.green : C.blue, 13, 'center');
    text(ctx, had ? '在线 Hadamard ×2' : '在线 Hadamard ×0', 420, SY + 40, C.muted, 12, 'right');

    // 位宽条：W · A · KV
    text(ctx, 'W · A · KV 位宽', 32, 178, C.muted, 12);
    const bars = [
      { label: 'W', bits: 4 },
      { label: 'A', bits: had ? 4 : 8 },
      { label: 'KV', bits: had ? 4 : 8 },
    ];
    bars.forEach((b, i) => {
      const bx = 32 + i * 150;
      const bw = (b.bits / 8) * 100;
      ctx.fillStyle = 'rgba(39,68,110,0.12)';
      ctx.beginPath();
      ctx.roundRect(bx, 194, 100, 14, 5);
      ctx.fill();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(bx, 194, Math.max(6, bw), 14, 5);
      ctx.fill();
      text(ctx, b.label, bx + 50, 224, C.ink, 12, 'center');
      text(ctx, `${b.bits}-bit`, bx + 112, 201, C.blue, 12);
    });

    // 右侧读数
    inset(ctx, 500, 20, 200, 220);
    text(ctx, had ? 'SpinQuant_Had' : 'SpinQuant_no-had', 516, 46, had ? C.green : C.blue, 14);
    text(ctx, had ? 'W4A4KV4 · LLaMA-2 7B' : 'W4A8KV8 · Mistral-7B', 516, 68, C.muted, 12);
    if (had) {
      text(ctx, '64.0 分', 516, 104, C.green, 22);
      text(ctx, '距全精度 2.9（66.9）', 516, 132, C.ink, 12.5);
    } else {
      text(ctx, '12.1 → 1.6', 516, 104, C.blue, 22);
      text(ctx, '与 FP 的差距（分）', 516, 132, C.ink, 12.5);
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(516, 154);
    ctx.lineTo(684, 154);
    ctx.stroke();
    text(ctx, '消融：旋转对 16-4-KV 优化', 516, 174, C.muted, 11.5);
    text(ctx, '→ 4-4-4 均值 64.0 优于 60.9', 516, 190, C.muted, 11.5);
    text(ctx, '（Table 3）', 516, 206, C.muted, 11.5);
    text(ctx, had ? '表 1 口径' : '§1 贡献口径', 684, 222, C.orange, 11, 'right');

    // 图例
    legend(ctx, [
      { label: '可学习融合', color: C.green },
      { label: '在线固定', color: C.purple },
      { label: '位宽条', color: C.blue },
    ], 32, 34, 12);
  });

  const fb = had
    ? { text: 'R3/R4 在线 Hadamard 就位，W4A4KV4 可用——7B 达 64.0 分', cls: 'good' }
    : { text: 'R1/R2 就位，W4A8KV8 差距缩到 1.6 分', cls: 'good' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="发布配置">
        <button className={`chip${cfg === 'nohad' ? ' on' : ''}`} style={cfg === 'nohad' ? { background: C.blue, borderColor: C.blue } : undefined} onClick={() => switchTo('nohad')}>
          SpinQuant_no-had
        </button>
        <button className={`chip${had ? ' on' : ''}`} style={had ? { background: C.blue, borderColor: C.blue } : undefined} onClick={() => switchTo('had')}>
          SpinQuant_Had
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <p className="sq-note">
        <b>读图方式：</b>绿色徽标 = 可学习融合（R₁/R₂），紫色 = 在线固定 Hadamard（H₃/H₄），
        位宽条越短位宽越低。「12.1→1.6」来自论文 §1 贡献；「64.0 / 距 FP 2.9」来自 Table 1；
        消融数字 64.0 vs 60.9 来自 Table 3。
      </p>
    </div>
  );
};

export default Ch9Config;
