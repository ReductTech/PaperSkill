import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1：一张引用图。旧方法（单向引用 = 正负样本）的三类错误直接标在节点上，
// 点错误类型即可定位并看懂它错在哪：
//   ① 相似却不引用（假负例）      ② 无关却礼貌引用（假正例 / 噪声）
//   ③ 方向冲突：同一对论文同时是正例和负例
const W = 1080, H = 280;
const C = {
  bg: '#f5f8f0', ground: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52',
  text: '#21324a', muted: '#68778f', navy: '#27446e', orange: '#f07e47', purple: '#7c3aed',
  halo: '#ffffff',
};

type Kind = 'all' | 'miss' | 'noise' | 'conflict';

type GNode = { id: string; x: number; y: number; r: number; fill?: string; cls: Kind | null; primary?: boolean };
type GEdge = {
  from: string; to: string; cls: Kind | null; color: string;
  dashed?: boolean; dotted?: boolean; noHead?: boolean;
};

const NODES: GNode[] = [
  { id: 'A', x: 150, y: 72, r: 15, cls: null },
  { id: 'B', x: 150, y: 216, r: 15, cls: null },
  { id: 'q', x: 380, y: 144, r: 18, fill: C.navy, cls: null },
  { id: 'C', x: 620, y: 58, r: 15, cls: null },
  { id: 'D', x: 620, y: 148, r: 15, fill: C.orange, cls: 'noise' },
  { id: 'E', x: 620, y: 234, r: 15, fill: C.red, cls: 'miss' },
  { id: 'F', x: 870, y: 60, r: 15, fill: C.purple, cls: 'conflict' },
  { id: 'G', x: 1010, y: 206, r: 15, cls: 'conflict', primary: false },
];
const EDGES: GEdge[] = [
  { from: 'A', to: 'q', cls: null, color: C.navy },
  { from: 'B', to: 'q', cls: null, color: C.navy },
  { from: 'q', to: 'C', cls: null, color: C.navy },
  { from: 'q', to: 'D', cls: 'noise', color: C.orange, dashed: true }, // 礼貌引用：有箭头但内容无关
  { from: 'q', to: 'E', cls: 'miss', color: C.green, dotted: true, noHead: true }, // 语义相似，却没有箭头
  { from: 'q', to: 'F', cls: 'conflict', color: C.purple },
  { from: 'F', to: 'G', cls: 'conflict', color: C.navy },
];

const TYPES: { key: Exclude<Kind, 'all'>; dot: string; label: string; nodes: string }[] = [
  { key: 'miss', dot: C.red, label: '① 相似却不引用', nodes: 'E' },
  { key: 'noise', dot: C.orange, label: '② 礼貌引用', nodes: 'D' },
  { key: 'conflict', dot: C.purple, label: '③ 方向冲突', nodes: 'F' },
];

const FEEDBACK: Record<Kind, { text: string; cls: string }> = {
  all: {
    text: '引用图里埋了 3 处错误：最像的那篇没有箭头、无关的那篇却出于礼貌有箭头、还有一对论文正负同时成立。点上面的按钮定位每一处。',
    cls: '',
  },
  miss: {
    text: '① 假负例：E 与 q 内容最像，但两篇互不引用。旧方法按「没有箭头 = 负例」处理，正好把最该被拉近的一对推开。',
    cls: 'bad',
  },
  noise: {
    text: '② 假正例：q 出于礼貌引用了 D（同会议、同团队，内容并不相关）。旧方法只看到「有箭头」，就把 D 当作相似证据收进正例——噪声进了训练集。',
    cls: 'bad',
  },
  conflict: {
    text: '③ 方向冲突：q → F 有箭头，所以 F 是 q 的正例；但 F → q 没有箭头，所以在 F 眼里 q 是负例。同一对论文正负同时成立。F 自己又引用着 G（既被引又引用），于是它同时出现在正例集与负例集里——论文把这叫 collision。',
    cls: 'bad',
  },
};

const byId = (id: string): GNode => NODES.find((n) => n.id === id) as GNode;

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: Kind; focusT: number }>({ sel: 'all', focusT: 0 });
  const [sel, setSel] = useState<Kind>('all');
  const [fb, setFb] = useState(FEEDBACK.all);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

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
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - ux * s - uy * s * 0.5, y - uy * s + ux * s * 0.5);
      ctx.lineTo(x - ux * s + uy * s * 0.5, y - uy * s - ux * s * 0.5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    // 有向箭头（可选无箭头 / 虚线 / 点线 / 垂直偏移）
    const edge = (
      from: GNode, to: GNode, color: string, alpha: number,
      opt: { dashed?: boolean; dotted?: boolean; noHead?: boolean; off?: number; flow?: number } = {},
    ) => {
      if (alpha <= 0.02) return;
      const off = opt.off || 0;
      const x1 = from.x, y1 = from.y + off, x2 = to.x, y2 = to.y + off;
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      const ux = dx / L, uy = dy / L;
      const sx = x1 + ux * (from.r + 3), sy = y1 + uy * (from.r + 3);
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      if (opt.dotted) ctx.setLineDash([2, 7]);
      else if (opt.dashed) { ctx.setLineDash([8, 6]); ctx.lineDashOffset = -(opt.flow || 0); }
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x2 - ux * (to.r + 11), y2 - uy * (to.r + 11)); ctx.stroke();
      ctx.setLineDash([]);
      if (!opt.noHead) headAt(x2 - ux * (to.r + 2), y2 - uy * (to.r + 2), ux, uy, 11, color, alpha);
      ctx.restore();
    };

    const node = (n: GNode, alpha: number, pulse: number, ringColor?: string) => {
      if (alpha <= 0.02) return;
      ctx.save();
      if (ringColor && pulse > 0) {
        ctx.globalAlpha = alpha * pulse * 0.55;
        ctx.strokeStyle = ringColor; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 4 + pulse * 7, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      if (n.fill) { ctx.fillStyle = n.fill; ctx.fill(); }
      else { ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.4; ctx.stroke(); }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${n.id === 'q' ? 15 : 13}px sans-serif`;
      ctx.fillStyle = n.fill ? '#fff' : C.text;
      ctx.fillText(n.id, n.x, n.y + 0.5);
      ctx.restore();
    };

    const cross = (x: number, y: number, s: number, color: string, alpha: number) => {
      if (alpha <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
      ctx.restore();
    };

    const chipText = (x: number, y: number, txt: string, color: string, alpha = 1, size = 12) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 ${size}px sans-serif`;
      const w = ctx.measureText(txt).width;
      ctx.fillStyle = C.halo; rr(x - w / 2 - 5, y - size / 2 - 4, w + 10, size + 8, 5); ctx.fill();
      ctx.fillStyle = color; ctx.fillText(txt, x, y + 0.5);
      ctx.restore();
    };

    let raf = 0; let t0 = performance.now();

    const render = (now: number) => {
      const s = stateRef.current;
      const focus = s.focusT ? easeInOutQuad(Math.min(1, (now - s.focusT) / 380)) : 1;
      const cyc = ((now - t0) / 1600) % 1;
      const pulse = 0.5 + 0.5 * Math.sin(cyc * Math.PI * 2);

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.ground; ctx.fillRect(0, H - 6, W, 6);

      const live = (cls: Kind | null) => cls === null || s.sel === 'all' || cls === s.sel;
      const aOf = (cls: Kind | null) => (live(cls) ? 1 : 0.14);

      // ---- 边 ----
      for (const e of EDGES) {
        const a = aOf(e.cls);
        const flow = e.cls === 'noise' && s.sel !== 'all' ? cyc * 28 : 0;
        edge(byId(e.from), byId(e.to), e.color, a, {
          dashed: e.dashed, dotted: e.dotted, noHead: e.noHead, flow,
        });
      }
      // 反向那根「不存在」的箭头：只在方向冲突被选中（或总览）时出现
      if (s.sel === 'all' || s.sel === 'conflict') {
        const q = byId('q'), f = byId('F');
        const ga = (s.sel === 'conflict' ? 0.5 : 0.24) * (0.35 + 0.65 * focus);
        edge(f, q, C.purple, ga, { dashed: true, off: 8, flow: cyc * 28 });
        cross((q.x + f.x) / 2 + 1, (q.y + f.y) / 2 + 8, 8, C.red, ga + 0.28);
      }
      // 「相似却没有箭头」：虚线本身 + 一个红叉
      if (s.sel === 'all' || s.sel === 'miss') {
        const q = byId('q'), e = byId('E');
        const ma = s.sel === 'miss' ? 0.85 * focus : 0.6;
        cross((q.x + e.x) / 2, (q.y + e.y) / 2, 9, C.red, ma + 0.15 * pulse);
        chipText((q.x + e.x) / 2, (q.y + e.y) / 2 - 24, '无引用', C.red, ma, 11);
      }

      // ---- 节点 ----
      for (const n of NODES) {
        const a = aOf(n.cls);
        const flagged = n.primary !== false && n.cls !== null && (s.sel === 'all' || s.sel === n.cls);
        node(n, a, flagged ? pulse * focus : 0, n.cls ? (n.cls === 'miss' ? C.red : n.cls === 'noise' ? C.orange : C.purple) : undefined);
      }
      // 方向冲突时，查询论文 q 也在冲突里
      if (s.sel === 'conflict') {
        node(byId('q'), 1, pulse * focus, C.purple);
        chipText(byId('q').x, byId('q').y - 40, '也是负例', C.purple, 0.9 * focus, 11);
      }

      // ---- 标题与图例 ----
      ctx.save();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '600 14px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('引用图', 24, 24);
      ctx.restore();
      TYPES.forEach((ty, i) => {
        const x = 700 + i * 130;
        ctx.save();
        ctx.globalAlpha = s.sel === 'all' || s.sel === ty.key ? 1 : 0.3;
        ctx.fillStyle = ty.dot;
        ctx.beginPath(); ctx.arc(x, 24, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '12px sans-serif';
        ctx.fillText(ty.label.slice(2), x + 11, 24);
        ctx.restore();
      });
    };

    const tick = (now: number) => { render(now); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });

    // 直接点画布上的节点 = 选中它所属的错误类型
    const hit = (clientX: number, clientY: number): Kind => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (W / rect.width);
      const y = (clientY - rect.top) * (H / rect.height);
      for (const n of NODES) {
        if (Math.hypot(x - n.x, y - n.y) <= n.r + 9) return n.cls ?? 'all';
      }
      return 'all';
    };
    const onDown = (e: PointerEvent) => { pick(hit(e.clientX, e.clientY)); };
    canvas.addEventListener('pointerdown', onDown);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      cancelAnimationFrame(raf); stop();
    };
  }, []);

  const pick = (k: Kind) => {
    stateRef.current.sel = k;
    stateRef.current.focusT = performance.now();
    setSel(k);
    setFb(FEEDBACK[k]);
  };

  const count = sel === 'all' ? 3 : sel === 'conflict' ? 2 : 1;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label="引用图：标出相似却不引用、无关却礼貌引用、方向冲突三类错误"
      />
      <div className="ctrl">
        <label>
          错误类型　<span className="val">{count}</span> 处标记
        </label>
        <button className={`chip ${sel === 'all' ? 'selected' : ''}`} aria-pressed={sel === 'all'} onClick={() => pick('all')}>
          显示全部
        </button>
        {TYPES.map((ty) => {
          const on = sel === ty.key;
          return (
            <button
              key={ty.key}
              className={`chip ${on ? 'selected' : ''}`}
              aria-pressed={on}
              style={on ? { background: ty.dot, borderColor: ty.dot, color: '#fff' } : undefined}
              onClick={() => pick(ty.key)}
            >
              <span className="edot" style={{ background: on ? '#fff' : ty.dot }} />
              {ty.label}
            </button>
          );
        })}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M11;
