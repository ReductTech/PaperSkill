import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.1：引文图对称化（引 = 被引）+ 名次刻度（正例 / 难负例 / 易负例）。
const W = 1080, H = 280;
const C = {
  bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c',
  blue: '#27446e', red: '#c43f52', text: '#21324a', muted: '#68778f',
};
const Q = { x: 270, y: 138, r: 15 };
// dir='out'：q 引用它（引）；dir='in'：它引用 q（被引）
const NODES: Array<{ x: number; y: number; dir: 'out' | 'in' }> = [
  { x: 270, y: 34, dir: 'in' },
  { x: 138, y: 76, dir: 'out' },
  { x: 402, y: 76, dir: 'out' },
  { x: 150, y: 206, dir: 'in' },
  { x: 392, y: 206, dir: 'in' },
];
const RX0 = 600, RDX = 37.5, RY = 116, RN = 12;

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

const fbFor = (sym: boolean, k: number) => {
  if (!sym) {
    return {
      text: '只认一个方向：绿实线算「引」，蓝虚线的「被引」被无视。换个方向看，同一篇论文还会变成负例。',
      cls: '',
    };
  }
  return {
    text: `引与被引都算邻居：5 篇全部进入邻域。正例取名次最靠前的 ${k} 篇——越靠前，内容相关性越高；名次稍远的可当难负例，更远的当易负例。`,
    cls: 'good',
  };
};

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sym: false, morph: 0, k: 3 });
  const [sym, setSym] = useState(false);
  const [k, setK] = useState(3);
  const [fb, setFb] = useState(fbFor(false, 3));

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const head = (x: number, y: number, ang: number, color: string, alpha: number) => {
      if (alpha <= 0.03) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 11 * Math.cos(ang - 0.42), y - 11 * Math.sin(ang - 0.42));
      ctx.lineTo(x - 11 * Math.cos(ang + 0.42), y - 11 * Math.sin(ang + 0.42));
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    const render = () => {
      const s = stateRef.current;
      const target = s.sym ? 1 : 0;
      s.morph += (target - s.morph) * 0.16;
      if (Math.abs(target - s.morph) < 0.005) s.morph = target;
      const m = s.morph;

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);

      // ── 左：引用图 ──
      NODES.forEach((n) => {
        const isOut = n.dir === 'out';
        const col = isOut ? C.green : mix(C.blue, C.green, m);
        const alpha = isOut ? 1 : 0.4 + 0.6 * m;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.setLineDash(m > 0.5 || isOut ? [] : [7, 6]);
        ctx.beginPath();
        if (isOut) { ctx.moveTo(Q.x, Q.y); ctx.lineTo(n.x, n.y); }
        else { ctx.moveTo(n.x, n.y); ctx.lineTo(Q.x, Q.y); }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        // 箭头：有向状态显示；对称化后褪去
        if (m < 0.97) {
          if (isOut) {
            head(n.x - 3, n.y, Math.atan2(n.y - Q.y, n.x - Q.x), col, (1 - m) * alpha);
          } else {
            const ang = Math.atan2(Q.y - n.y, Q.x - n.x);
            const d = Q.r + 12;
            head(Q.x - Math.cos(ang) * d, Q.y - Math.sin(ang) * d, ang, col, (1 - m) * alpha);
          }
        }
        ctx.fillStyle = col; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(n.x, n.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(Q.x, Q.y, Q.r, 0, Math.PI * 2); ctx.fill();

      // ── 分隔 ──
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(520, 34); ctx.lineTo(520, 236); ctx.stroke();

      // ── 右：名次刻度 ──
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(RX0 - 26, RY); ctx.lineTo(RX0 + (RN - 1) * RDX + 26, RY); ctx.stroke();
      for (let i = 0; i < RN; i++) {
        const x = RX0 + i * RDX;
        const isPos = i < s.k, isHard = i >= s.k && i < s.k + 2;
        const col = isPos ? C.green : isHard ? C.red : C.muted;
        ctx.beginPath(); ctx.arc(x, RY, 8, 0, Math.PI * 2);
        if (isHard) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); }
        else { ctx.fillStyle = col; ctx.fill(); }
        ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
        ctx.fillText(String(i + 1), x, RY + 26);
      }
      // 三分段图例（3 项）
      const seg = (a: number, b: number, label: string, col: string) => {
        const xa = RX0 + a * RDX - 15, xb = RX0 + b * RDX + 15, y = RY + 48;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xa, y - 8); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y - 8); ctx.stroke();
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = col;
        ctx.fillText(label, (xa + xb) / 2, y + 22);
      };
      seg(0, s.k - 1, '正例', C.green);
      seg(s.k, s.k + 1, '难负例', C.red);
      seg(s.k + 2, RN - 1, '易负例', C.muted);

      ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.text;
      ctx.fillText('越靠前越相关', RX0 + ((RN - 1) * RDX) / 2, 62);

      requestAnimationFrame(render);
    };
    const raf = requestAnimationFrame(render);
    const stop = observeCanvas(canvas, () => { }, () => { });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const apply = (nextSym: boolean, nextK: number) => {
    stateRef.current.sym = nextSym;
    stateRef.current.k = nextK;
    setSym(nextSym); setK(nextK);
    setFb(fbFor(nextSym, nextK));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${sym ? '' : 'active'}`} onClick={() => apply(false, k)}>原始引文图（有向）</button>
        <button className={`chip ${sym ? 'active' : ''}`} onClick={() => apply(true, k)}>对称化（引 = 被引）</button>
        <label>正例数 k <span className="val">{k}</span></label>
        <input type="range" min={1} max={8} value={k} onChange={(e) => apply(sym, Number(e.target.value))} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M21;
