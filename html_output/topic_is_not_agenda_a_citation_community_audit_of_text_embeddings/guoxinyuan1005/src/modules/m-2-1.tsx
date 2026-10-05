import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.1：切换两把尺子。同一批 358 万篇论文——粗尺子（L1 子领域）划出
// 73,477 个区；细尺子（L2 议程）在同一张图上划出 328,738 个格。
// 关键不是「再细一点」，而是一个 L1 内部本来就并存着很多条互不相同的议程：
// 论文只把 1,896 个 ≥200 篇的 L1 二次切分，按论文数字推算每个平均含约 136 条 L2。
const W = 1080;
const H = 300;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  purple: '#7c3aed', green: '#228d5c', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const ZONES = ['生物', '生医', '化学', '计算', '工程', '环境', '材料', '物理'];

const FB_L1 =
  '粗尺子：358 万篇划出 <b>73,477</b> 个子领域，最大一个只占 1.5%，看着很清爽。<b>但这个视角看不到内部</b>——L1 太粗，把子领域内部并存的若干条研究议程抹成了一块。';
const FB_L2 =
  '细尺子：论文只把 <b>1,896</b> 个 ≥200 篇的子领域二次切分，同一张图就划出 <b>328,738</b> 条议程，按论文数字推算每个平均含约 <b>136</b> 条；随机同格基线只剩 <b>0.009–0.046%</b>。<b>这些议程才是判定单位</b>——§1 里那个 Herbig Ae/Be 子领域，10 篇邻居全都同 L1，只有 1 篇同 L2。';
const FB_PANEL_L1 = '放大任意一个子领域，看到的都是这样一整块——内部结构被 L1 抹平了。';
const FB_PANEL_L2 = '同一块放大后：里面是许多条规模不一的议程。';

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
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(label).width + 18;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, 26, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 9, y + 18);
  return w;
}

// 确定性伪随机：让格位深浅不齐，但每次渲染都一致
function hash2(a: number, b: number) {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<'L1' | 'L2'>('L1');
  const [level, setLevel] = useState<'L1' | 'L2'>('L1');
  const [fb, setFb] = useState({ text: FB_L1, cls: '' });

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
      const isL2 = stateRef.current === 'L2';

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 馆藏堆
      for (let st = 0; st < 3; st++) {
        const sx = 44 + st * 44;
        for (let n = 0; n < 6; n++) {
          ctx.fillStyle = C.shelf;
          roundRect(ctx, sx, 206 - n * 15, 34, 11, 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('358 万篇', 44, 240);

      // 八个大区：2 行 4 列。L1 视角下是八个浑然一体的块，
      // L2 视角下每块内部都碎成一格格议程。
      const size = 76;
      const gx = 248;
      const stepX = 96;
      const stepY = 100;
      const gy = 64;
      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('八个域的大区', gx, 32);
      for (let i = 0; i < 8; i++) {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const x = gx + c * stepX;
        const y = gy + r * stepY;
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ZONES[i], x + size / 2, y - 7);
        ctx.textAlign = 'left';

        if (!isL2) {
          ctx.fillStyle = 'rgba(39,68,110,0.10)';
          roundRect(ctx, x, y, size, size, 6);
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1.8;
          roundRect(ctx, x, y, size, size, 6);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#fff';
          roundRect(ctx, x, y, size, size, 6);
          ctx.fill();
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 3]);
          roundRect(ctx, x, y, size, size, 6);
          ctx.stroke();
          ctx.setLineDash([]);
          const cols = 4;
          const rows = 4;
          const pad = 5;
          const gap = 2;
          const cw = (size - pad * 2 - gap * (cols - 1)) / cols;
          const chh = (size - pad * 2 - gap * (rows - 1)) / rows;
          for (let rr = 0; rr < rows; rr++) {
            for (let cc = 0; cc < cols; cc++) {
              const a = 0.18 + 0.55 * hash2(i * 10 + rr, cc * 3 + 1);
              ctx.fillStyle = `rgba(124,58,237,${a.toFixed(2)})`;
              roundRect(ctx, x + pad + cc * (cw + gap), y + pad + rr * (chh + gap), cw, chh, 2);
              ctx.fill();
            }
          }
        }
      }

      // 右侧：放大一个子领域
      const px = 644;
      const py = 36;
      const pw = 400;
      const ph = 216;
      ctx.fillStyle = '#fff';
      roundRect(ctx, px, py, pw, ph, 8);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.6;
      roundRect(ctx, px, py, pw, ph, 8);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('放大一个子领域', px + 18, py + 26);

      const ix = px + 20;
      const iy = py + 40;
      const iw = pw - 40;
      const ih = 104;

      if (!isL2) {
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        roundRect(ctx, ix, iy, iw, ih, 6);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.8;
        roundRect(ctx, ix, iy, iw, ih, 6);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('看起来是一整块', ix + iw / 2, iy + ih / 2 + 4);
        ctx.textAlign = 'left';
      } else {
        const cols = 6;
        const rows = 4;
        const gap = 3;
        const cw = (iw - gap * (cols - 1)) / cols;
        const chh = (ih - gap * (rows - 1)) / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const hi = r === 1 && c === 4;
            const a = 0.15 + 0.5 * hash2(r * 7 + 1, c * 3 + 5);
            const bx = ix + c * (cw + gap);
            const by = iy + r * (chh + gap);
            ctx.fillStyle = hi ? C.green : `rgba(124,58,237,${a.toFixed(2)})`;
            roundRect(ctx, bx, by, cw, chh, 3);
            ctx.fill();
            if (hi) {
              ctx.strokeStyle = C.green;
              ctx.lineWidth = 1.8;
              roundRect(ctx, bx, by, cw, chh, 3);
              ctx.stroke();
            }
          }
        }
      }

      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isL2 ? FB_PANEL_L2 : FB_PANEL_L1, ix, iy + ih + 20);

      // 数值胶囊
      let cx = px + 18;
      cx += chip(ctx, cx, py + ph - 40, isL2 ? '328,738' : '73,477', isL2 ? C.purple : C.blue) + 8;
      chip(ctx, cx, py + ph - 40, isL2 ? '0.009–0.046%' : '0.16–2.63%', C.muted);

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

  const pick = (lv: 'L1' | 'L2') => {
    stateRef.current = lv;
    setLevel(lv);
    setFb({ text: lv === 'L1' ? FB_L1 : FB_L2, cls: '' });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={
          level === 'L1'
            ? '粗尺子视角：358 万篇被划成 73,477 个子领域，每个子领域在图上是一整块，看不到内部'
            : '细尺子视角：同一个子领域内部碎成许多条规模不一的议程，其中只有一条与查询同议程'
        }
      />
      <div className="chip-row">
        <button className={`chip ${level === 'L1' ? 'selected' : ''}`} aria-pressed={level === 'L1'} onClick={() => pick('L1')}>
          子领域 L1
        </button>
        <button className={`chip ${level === 'L2' ? 'selected' : ''}`} aria-pressed={level === 'L2'} onClick={() => pick('L2')}>
          研究议程 L2
        </button>
      </div>
      <div className="feedback" dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M21;
