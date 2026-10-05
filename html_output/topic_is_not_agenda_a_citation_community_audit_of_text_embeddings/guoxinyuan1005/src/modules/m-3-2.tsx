import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.2：三步走一遍论文的分区过程。0 = 先得到子领域；1 = 全局调细会把图撕碎；
// 2 = 在足够大的子领域内部二次划分，得到议程尺度。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', purple: '#7c3aed',
  red: '#c43f52', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const STEPS = [
  {
    name: '① 先得到子领域',
    desc: 'Leiden CPM 在 γ=10⁻⁴ 上跑一次，得到 73,477 个子领域，最大一个只占全图 1.5%。',
    fb: '先得到子领域：<b>73,477</b> 个社区，最大占图 <b>1.5%</b>。',
    cls: '',
  },
  {
    name: '② 全局调细（失败）',
    desc: '把 γ 直接调到 10⁻²：跨子领域的边被撕开，图上冒出十万量级的孤点——分辨率不能一路调大。',
    fb: '把 γ 全局调到 10⁻²：跨子领域的边被撕开，出现 <b>&gt;10 万</b> 个孤点——全局调细不是办法。',
    cls: 'bad',
  },
  {
    name: '③ 分层细分（可行）',
    desc: '改为在每个规模 ≥200 的子领域内部二次划分，共切开 1,896 个子领域，得到议程尺度。',
    fb: '改为在每个规模 ≥200 的子领域内部二次划分（共切开 <b>1,896</b> 个子领域）：得到 <b>328,738</b> 个议程格位，非单点平均 <b>19</b> 篇，最大 <b>1,712</b> 篇。',
    cls: 'good',
  },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  ctx.font = '700 14px "Segoe UI", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(label).width + 20;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 10, y + 19);
  return w;
}

const seeded = (i: number) => {
  const v = Math.sin(i * 127.1) * 43758.5453;
  return v - Math.floor(v);
};

export const M32: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: STEPS[0].fb, cls: STEPS[0].cls });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const s = stateRef.current.step;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      const gx = 48;
      const gy = 52;
      const gw = 560;
      const gh = 180;

      // 底板
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      roundRect(ctx, gx, gy, gw, gh, 8);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.4;
      roundRect(ctx, gx, gy, gw, gh, 8);
      ctx.stroke();

      const zc = 4;
      const zw = (gw - 40) / zc;
      const zh = (gh - 40) / 2;

      if (s === 0) {
        for (let i = 0; i < 8; i++) {
          const r = Math.floor(i / zc);
          const c = i % zc;
          const x = gx + 20 + c * zw;
          const y = gy + 20 + r * zh;
          ctx.fillStyle = 'rgba(39,68,110,0.08)';
          roundRect(ctx, x + 4, y + 4, zw - 8, zh - 8, 5);
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1.8;
          roundRect(ctx, x + 4, y + 4, zw - 8, zh - 8, 5);
          ctx.stroke();
        }
      } else if (s === 1) {
        // 三个巨区（吞掉大半图）
        ctx.fillStyle = 'rgba(196,63,82,0.10)';
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.6;
        const bigs = [
          [gx + 16, gy + 16, 300, 100],
          [gx + 250, gy + 90, 200, 78],
          [gx + 420, gy + 30, 128, 130],
        ];
        for (const [x, y, w, h] of bigs) {
          roundRect(ctx, x, y, w, h, 5);
          ctx.fill();
          ctx.stroke();
        }
        // 被撕碎的孤点
        ctx.fillStyle = C.red;
        for (let i = 0; i < 70; i++) {
          const x = gx + 20 + seeded(i) * (gw - 44);
          const y = gy + 20 + seeded(i + 90) * (gh - 44);
          ctx.fillRect(x, y, 6, 6);
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const r = Math.floor(i / zc);
          const c = i % zc;
          const x = gx + 20 + c * zw;
          const y = gy + 20 + r * zh;
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1.6;
          roundRect(ctx, x + 4, y + 4, zw - 8, zh - 8, 5);
          ctx.stroke();
          // 大区内部的格位线
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.3;
          ctx.setLineDash([4, 3]);
          for (let n = 1; n <= 5; n++) {
            const lx = x + 4 + ((zw - 8) / 6) * n;
            ctx.beginPath();
            ctx.moveTo(lx, y + 8);
            ctx.lineTo(lx, y + zh - 12);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
      }

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('分区图', 26, 30);

      // 数值胶囊
      let cx2 = gx;
      if (s === 1) {
        cx2 += chip(ctx, cx2, 244, '>10万 单点', C.red) + 10;
      } else if (s === 2) {
        cx2 += chip(ctx, cx2, 244, '328,738 格位', C.purple) + 10;
        chip(ctx, cx2, 244, '1,896 个子领域', C.blue);
      }

      // 图例（2 项）
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let lx2 = 830;
      for (const it of [
        { color: C.blue, fill: false, label: '大区' },
        { color: C.purple, fill: false, label: '格位' },
      ]) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.8;
        if (it.label === '格位') ctx.setLineDash([4, 3]);
        ctx.strokeRect(lx2, 18, 12, 12);
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, lx2 + 17, 28);
        lx2 += 17 + ctx.measureText(it.label).width + 16;
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  const go = (n: number) => {
    stateRef.current.step = n;
    setStep(n);
    setFb({ text: STEPS[n].fb, cls: STEPS[n].cls });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`分区图第 ${step + 1} 步：${STEPS[step].name}`}
      />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          步骤 <b>{step + 1}</b> / 3
        </span>
        <button className="tiny" onClick={() => go(Math.min(2, step + 1))} disabled={step === 2}>
          {step === 2 ? '已完成' : '下一步 →'}
        </button>
        <button className="tiny ghost" onClick={() => go(0)} disabled={step === 0}>
          重置
        </button>
      </div>
      <div className="step-desc">{STEPS[step].desc}</div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M32;
