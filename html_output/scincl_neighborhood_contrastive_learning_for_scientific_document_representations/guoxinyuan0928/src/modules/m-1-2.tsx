import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.2：同一批论文，两种信号下的排布。
//   离散（两个桶）：q 引用了谁，谁就进正例桶。于是 E 最像却没有箭头、被扔进负例桶；
//   D 无关却被礼貌引用、进了正例桶；F 两个方向都成立，两个桶各占一个位置 —— 8 篇里 3 篇判错。
//   连续（一把尺）：同一批论文按真实距离排成一列，错判归零，名次直接给出正例 / 难负例 / 易负例。
const W = 1080, H = 280;
const C = {
  bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52',
  text: '#21324a', muted: '#68778f', navy: '#27446e', orange: '#f07e47', purple: '#7c3aed', white: '#ffffff',
};
const Q = { x: 108, y: 154, r: 13 };
const POS_Y = 100, NEG_Y = 208, AXIS_Y = 154;
const BX = 168, BW = 792, BH = 84, BY0 = 58, BY1 = 166;

type Kind = 'ok' | 'miss' | 'noise' | 'conflict';
const COL: Record<Kind, string> = { ok: C.navy, miss: C.red, noise: C.orange, conflict: C.purple };

type Item = { key: string; kind: Kind; bx: number; by: number; ex: number; rank: number };
// 前 4 个进正例桶（q 引用了它），后 4 个进负例桶（没有箭头）
const ITEMS: Item[] = [
  { key: 'D', kind: 'noise', bx: 280, by: POS_Y, ex: 900, rank: 7 },
  { key: 'B', kind: 'ok', bx: 440, by: POS_Y, ex: 340, rank: 2 },
  { key: 'C', kind: 'ok', bx: 600, by: POS_Y, ex: 430, rank: 3 },
  { key: 'F', kind: 'conflict', bx: 770, by: POS_Y, ex: 565, rank: 4 },
  { key: 'E', kind: 'miss', bx: 280, by: NEG_Y, ex: 250, rank: 1 },
  { key: 'G', kind: 'ok', bx: 440, by: NEG_Y, ex: 775, rank: 6 },
  { key: 'H', kind: 'ok', bx: 600, by: NEG_Y, ex: 665, rank: 5 },
  { key: 'F', kind: 'conflict', bx: 770, by: NEG_Y, ex: 565, rank: 4 },
];
const EDGES: Array<{ i: number; bend: number }> = [
  { i: 0, bend: 0 }, { i: 1, bend: 0 }, { i: 2, bend: 16 }, { i: 3, bend: 16 },
];
const GHOST = 4;                       // q 与 E 之间：本该有、却没有的那根箭头
const FX = 770;                        // F 在两个桶里的横向位置
const BANDS = [
  { x0: 205, x1: 470, col: C.green, label: '正例' },
  { x0: 505, x1: 815, col: C.red, label: '难负例' },
  { x0: 815, x1: 1005, col: C.muted, label: '易负例' },
];
const FB = {
  discrete: {
    text: '离散信号只给两个桶：q 引用了 B、C，无关的 D 也被一起算进正例；最像的 E 因为没有箭头被扔进负例桶，F 更是两个桶各占一个位置——8 篇候选里有 3 篇被判错。',
    cls: '',
  },
  embedding: {
    text: '换成一串连续距离，错判归零：同一批论文排成一列，E 回到第 1 名（正例），B、C 紧随其后，D 落到第 7 名（易负例），F 只剩一个位置。名次本身就把正例 / 难负例 / 易负例分好了。',
    cls: 'good',
  },
};

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ emb: 0, target: 0 });
  const [mode, setMode] = useState<'discrete' | 'embedding'>('discrete');
  const [fb, setFb] = useState(FB.discrete);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };
    const headAt = (x: number, y: number, ux: number, uy: number, s: number, color: string, alpha: number) => {
      if (alpha <= 0.03) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * s - uy * s * 0.5, y - uy * s + ux * s * 0.5);
      ctx.lineTo(x - ux * s + uy * s * 0.5, y - uy * s - ux * s * 0.5);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const xBadge = (x: number, y: number, r: number, col: string, alpha: number) => {
      if (alpha <= 0.03) return;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = C.white; ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const a = r * 0.44;
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, r * 0.42); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - a, y - a); ctx.lineTo(x + a, y + a);
      ctx.moveTo(x + a, y - a); ctx.lineTo(x - a, y + a);
      ctx.stroke(); ctx.restore();
    };
    const bez = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, t: number) => ({
      x: (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2,
      y: (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2,
    });

    // 从 q 到某个候选的箭头（bend 让长线绕开节点）
    const drawEdge = (idx: number, bend: number, alpha: number) => {
      if (alpha <= 0.02) return;
      const it = ITEMS[idx];
      const dx = it.bx - Q.x, dy = it.by - Q.y, L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L;
      const x1 = Q.x + ux * (Q.r + 5), y1 = Q.y + uy * (Q.r + 5);
      const cx = (x1 + it.bx) / 2, cy = (y1 + it.by) / 2 + bend;
      const tx = it.bx - cx, ty = it.by - cy, tl = Math.hypot(tx, ty);
      const ex = it.bx - (tx / tl) * 15, ey = it.by - (ty / tl) * 15;
      const col = COL[it.kind];
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.restore();
      headAt(ex, ey, tx / tl, ty / tl, 11, col, alpha);
      return bez(x1, y1, cx, cy, ex, ey, 0.5);
    };

    const render = () => {
      const s = stateRef.current;
      s.emb += (s.target - s.emb) * 0.11;
      if (Math.abs(s.target - s.emb) < 0.004) s.emb = s.target;
      const m = s.emb;                 // 0 = 离散，1 = 连续
      const dis = 1 - m;
      const now = performance.now();
      const tp = 0.5 + 0.5 * Math.sin(now / 650);

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);

      // ── 离散层：两个桶 ──
      if (dis > 0.02) {
        ctx.save();
        ctx.globalAlpha = dis;
        const bucket = (y: number, col: string, label: string) => {
          rr(BX, y, BW, BH, 14);
          ctx.fillStyle = col; ctx.globalAlpha = dis * 0.07; ctx.fill();
          ctx.globalAlpha = dis; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
          // 桶名挂在外侧左上方，避开桶内的箭头与徽标
          ctx.font = '13px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = col;
          ctx.fillText(label, BX + 4, y - 9);
        };
        bucket(BY0, C.green, '正例桶');
        bucket(BY1, C.red, '负例桶');
        ctx.restore();

        // q → 正例桶的箭头
        EDGES.forEach((e) => {
          const mid = drawEdge(e.i, e.bend, dis);
          if (e.i === 0 && mid) {
            // 礼貌引用：箭头来自「礼」而不是内容
            ctx.save(); ctx.globalAlpha = dis;
            ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(mid.x, mid.y, 10, 0, Math.PI * 2); ctx.fill();
            ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
            ctx.fillText('礼', mid.x, mid.y + 4.4);
            ctx.restore();
          }
        });

        // q ⇢ E：本该有、却没有的那根箭头
        const g = ITEMS[GHOST];
        const gdx = g.bx - Q.x, gdy = g.by - Q.y, gL = Math.hypot(gdx, gdy);
        const gux = gdx / gL, guy = gdy / gL;
        const gx1 = Q.x + gux * (Q.r + 5), gy1 = Q.y + guy * (Q.r + 5);
        const gx2 = g.bx - gux * 15, gy2 = g.by - guy * 15;
        ctx.save();
        ctx.globalAlpha = dis; ctx.strokeStyle = C.red; ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(gx1, gy1); ctx.lineTo(gx2, gy2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        xBadge((gx1 + gx2) / 2, (gy1 + gy2) / 2, 10, C.red, dis);

        // F 在两个桶里各占一个位置
        ctx.save();
        ctx.globalAlpha = dis; ctx.strokeStyle = C.purple; ctx.lineWidth = 2.4;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(FX, POS_Y + 16); ctx.lineTo(FX, AXIS_Y - 15);
        ctx.moveTo(FX, AXIS_Y + 15); ctx.lineTo(FX, NEG_Y - 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.white; ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(FX, AXIS_Y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        headAt(FX + 7, AXIS_Y - 4, 1, 0, 9, C.purple, dis);
        headAt(FX - 7, AXIS_Y + 4, -1, 0, 9, C.purple, dis);
      }

      // ── 连续层：一把尺子 ──
      if (m > 0.02) {
        ctx.save();
        ctx.globalAlpha = m;
        // 环带
        BANDS.forEach((b) => {
          ctx.fillStyle = b.col; ctx.globalAlpha = m * 0.13;
          ctx.fillRect(b.x0, 112, b.x1 - b.x0, 70);
        });
        // 采样诱导边际：两带之间留出的空隙
        ctx.globalAlpha = m * 0.55; ctx.fillStyle = C.white;
        ctx.fillRect(470, 112, 35, 70);
        ctx.globalAlpha = m; ctx.strokeStyle = C.border; ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(470, 112); ctx.lineTo(470, 182);
        ctx.moveTo(505, 112); ctx.lineTo(505, 182);
        ctx.stroke(); ctx.setLineDash([]);

        // 距离轴
        ctx.strokeStyle = C.border; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(150, AXIS_Y); ctx.lineTo(1012, AXIS_Y); ctx.stroke();
        headAt(1016, AXIS_Y, 1, 0, 10, C.border, m);
        ctx.font = '12px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = C.muted;
        ctx.fillText('距离', 1006, AXIS_Y - 12);

        // 图例（3 项）
        BANDS.forEach((b) => {
          const cx = (b.x0 + b.x1) / 2;
          ctx.fillStyle = b.col; ctx.globalAlpha = m;
          ctx.fillRect(cx - 94, 228, 12, 12);
          ctx.font = '13px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = C.text;
          ctx.fillText(b.label, cx - 76, 239);
        });
        ctx.restore();
      }

      // ── 节点：从桶位飞到尺位 ──
      ITEMS.forEach((it, i) => {
        const mi = easeOutCubic(clamp((m - i * 0.035) / 0.72, 0, 1));
        const x = it.bx + (it.ex - it.bx) * mi;
        const y = it.by + (AXIS_Y - it.by) * mi;
        const col = COL[it.kind];
        // 问题节点在离散态脉动
        if (it.kind !== 'ok' && dis > 0.05) {
          ctx.save();
          ctx.globalAlpha = dis * 0.4 * (1 - tp * 0.75);
          ctx.strokeStyle = col; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x, y, 14 + 9 * tp, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        ctx.save();
        ctx.fillStyle = col;
        ctx.strokeStyle = C.white; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
        ctx.fillText(it.key, x, y + 4.3);
        ctx.restore();
        // 名次数字（连续态）
        if (m > 0.05) {
          ctx.save();
          ctx.globalAlpha = m; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = C.muted;
          ctx.fillText(String(it.rank), it.ex, 200);
          ctx.restore();
        }
        // 错判徽标：连续态自动消失
        if (it.kind !== 'ok') xBadge(x + 16, y - 16, 9, col, dis);
      });

      // ── q ──
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.white;
      ctx.fillText('q', Q.x, Q.y + 4.3);

      // ── 模式标题 ──
      ctx.font = '15px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = C.text;
      ctx.fillText(m > 0.5 ? '连续：一把尺' : '离散：两个桶', 28, 36);

      // ── 错判计数 ──
      const cnt = Math.ceil(3 * (1 - m));
      const ccol = lerpColor(C.red, C.green, m);
      ctx.save();
      rr(966, 8, 90, 40, 9);
      ctx.fillStyle = C.white; ctx.fill();
      ctx.strokeStyle = ccol; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = ccol;
      ctx.fillText(String(cnt), 1011, 38);
      ctx.font = '12px sans-serif'; ctx.fillStyle = C.muted;
      ctx.fillText('错判', 1011, 60);
      ctx.restore();

      requestAnimationFrame(render);
    };
    const raf = requestAnimationFrame(render);
    const stop = observeCanvas(canvas, () => { }, () => { });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const switchTo = (next: 'discrete' | 'embedding') => {
    stateRef.current.target = next === 'embedding' ? 1 : 0;
    setMode(next);
    setFb(FB[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'discrete' ? 'active' : ''}`} onClick={() => switchTo('discrete')}>离散引用</button>
        <button className={`chip ${mode === 'embedding' ? 'active' : ''}`} onClick={() => switchTo('embedding')}>引文嵌入邻域</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M12;
