import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useStage, Anim, Pulse, rr, txt, clamp, rng, ripple, easeOut } from '../lib/stage';
import { C, rgba } from '../lib/palette';
import { Controls, Feedback, Seg, Tag } from '../ui/kit';
import { StageBox } from '../ui/StageBox';
import { Guess, ModeSwitch, ScoreBar, useChallenge } from '../ui/Challenge';

// 2.1 同一张图，三个问题（重演图 1）。全部为教学示意：
// 图块场景、显著度、“注意力打分”都是按图 1 的现象设定的，不是 FastV / PruMerge 的真实输出。

const COLS = 12;
const ROWS = 8;
type Obj = 'cake' | 'bottle' | 'fork' | 'bg';
type Q = 'q1' | 'q2' | 'q3';
type Method = 'fixed' | 'attn' | 'vtw';

const QUESTIONS: Record<Q, { text: string; obj: Obj; name: string }> = {
  q1: { text: 'Q1：图里有蛋糕吗？', obj: 'cake', name: '蛋糕' },
  q2: { text: 'Q2：图里有瓶子吗？', obj: 'bottle', name: '瓶子' },
  q3: { text: 'Q3：图里有叉子吗？', obj: 'fork', name: '叉子' },
};
const METHOD_NAME: Record<Method, string> = {
  fixed: '问题无关的固定保留（PruMerge 式）',
  attn: '按注意力分数保留一半（FastV 式）',
  vtw: 'VTW：前 K 层全部保留',
};
const METHOD_SHORT: Record<Method, string> = { fixed: '固定保留', attn: '注意力打分', vtw: 'VTW' };

function objAt(c: number, r: number): Obj {
  if (c >= 1 && c <= 4 && r >= 3 && r <= 6) return 'cake';
  if (c >= 7 && c <= 8 && r >= 1 && r <= 6) return 'bottle';
  if (c >= 9 && c <= 11 && r >= 6 && r <= 7) return 'fork';
  return 'bg';
}

const TILES = (() => {
  const rand = rng(42);
  const out: { c: number; r: number; obj: Obj; sal: number; noise: number }[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const obj = objAt(c, r);
      const sal = obj === 'cake' ? 0.9 : obj === 'bottle' ? 0.7 : obj === 'fork' ? 0.2 : 0.1 + rand() * 0.3;
      out.push({ c, r, obj, sal, noise: rand() });
    }
  return out;
})();

/** 返回每个图块是否被保留 */
function keptSet(method: Method, q: Q): boolean[] {
  if (method === 'vtw') return TILES.map(() => true);
  if (method === 'fixed') {
    const order = TILES.map((t, i) => ({ i, s: t.sal + t.noise * 0.01 })).sort((a, b) => b.s - a.s);
    const keep = new Set(order.slice(0, 25).map((o) => o.i));
    return TILES.map((_, i) => keep.has(i));
  }
  // 注意力打分（示意）：显著的蛋糕总是高分；问题对象只有叉子能拿到高分；瓶子被“稀释”（重演图 1(b)）
  const target = QUESTIONS[q].obj;
  const score = TILES.map((t) => {
    if (t.obj === 'cake') return 0.85 + t.noise * 0.1;
    if (t.obj === 'bottle') return target === 'bottle' ? 0.12 + t.noise * 0.2 : 0.3 + t.noise * 0.3;
    if (t.obj === 'fork') return target === 'fork' ? 0.9 + t.noise * 0.05 : 0.25 + t.noise * 0.2;
    return 0.2 + t.noise * 0.45;
  });
  const order = score.map((s, i) => ({ i, s })).sort((a, b) => b.s - a.s);
  const keep = new Set(order.slice(0, 48).map((o) => o.i));
  return TILES.map((_, i) => keep.has(i));
}

function coverage(method: Method, q: Q) {
  const kept = keptSet(method, q);
  const obj = QUESTIONS[q].obj;
  let tot = 0;
  let k = 0;
  TILES.forEach((t, i) => {
    if (t.obj === obj) {
      tot++;
      if (kept[i]) k++;
    }
  });
  return { k, tot, frac: tot ? k / tot : 0, keptN: kept.filter(Boolean).length };
}

const TILE_COLOR: Record<Obj, string> = { cake: '#F2B8A0', bottle: '#7FC4E8', fork: '#D7DCEA', bg: '#3A4A78' };

/** 画一张桌面示意图（与 objAt 的图块位置对齐）；按尺寸缓存 */
const sceneCache: Record<string, HTMLCanvasElement> = {};
function getScene(W: number, H: number): HTMLCanvasElement {
  const key = `${W}x${H}`;
  if (sceneCache[key]) return sceneCache[key];
  const c = document.createElement('canvas');
  c.width = Math.max(12, W * 2);
  c.height = Math.max(8, H * 2);
  const g = c.getContext('2d')!;
  const u = c.width / COLS; // 一个图块的宽度
  const v = c.height / ROWS;
  // 墙与桌面
  const wall = g.createLinearGradient(0, 0, 0, v * 4);
  wall.addColorStop(0, '#24345f');
  wall.addColorStop(1, '#33467a');
  g.fillStyle = wall;
  g.fillRect(0, 0, c.width, v * 4.2);
  const table = g.createLinearGradient(0, v * 4.2, 0, c.height);
  table.addColorStop(0, '#6b4a3a');
  table.addColorStop(1, '#4a3128');
  g.fillStyle = table;
  g.fillRect(0, v * 4.2, c.width, c.height);
  // 盘子与蛋糕（列 1–4，行 3–6）
  g.fillStyle = '#e8e6f0';
  g.beginPath();
  g.ellipse(u * 3, v * 6.4, u * 2.1, v * 0.55, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f6d7a8';
  g.fillRect(u * 1.3, v * 3.6, u * 3.4, v * 2.6);
  g.fillStyle = '#f2a0a8';
  g.fillRect(u * 1.3, v * 4.5, u * 3.4, v * 0.45);
  g.fillRect(u * 1.3, v * 5.4, u * 3.4, v * 0.35);
  g.fillStyle = '#fff4e2';
  g.fillRect(u * 1.3, v * 3.3, u * 3.4, v * 0.45);
  g.fillStyle = '#e0303e';
  g.beginPath();
  g.arc(u * 3, v * 3.1, Math.min(u, v) * 0.45, 0, Math.PI * 2);
  g.fill();
  // 瓶子（列 7–8，行 1–6）
  const glass = g.createLinearGradient(u * 7, 0, u * 9, 0);
  glass.addColorStop(0, '#3f8fb8');
  glass.addColorStop(0.5, '#a9e4ff');
  glass.addColorStop(1, '#2f6f98');
  g.fillStyle = glass;
  g.fillRect(u * 7.65, v * 1.1, u * 0.7, v * 1.2);
  g.beginPath();
  g.moveTo(u * 7.65, v * 2.3);
  g.lineTo(u * 7.15, v * 3.1);
  g.lineTo(u * 7.15, v * 6.8);
  g.lineTo(u * 8.85, v * 6.8);
  g.lineTo(u * 8.85, v * 3.1);
  g.lineTo(u * 8.35, v * 2.3);
  g.fill();
  g.fillStyle = '#f0d2a8';
  g.fillRect(u * 7.25, v * 4.2, u * 1.5, v * 1.2);
  // 叉子（列 9–11，行 6–7）
  g.fillStyle = '#d7dcea';
  g.fillRect(u * 9.3, v * 6.85, u * 1.9, v * 0.22);
  for (let k = 0; k < 4; k++) g.fillRect(u * (11.15 + k * 0.0), v * (6.55 + k * 0.17), u * 0.7, v * 0.08);
  g.beginPath();
  g.ellipse(u * 11.1, v * 6.95, u * 0.25, v * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  sceneCache[key] = c;
  return c;
}

const CHALLENGES: { id: string; q: Q; ask: string; answer: Method }[] = [
  { id: 'c1', q: 'q2', ask: '问题换成 Q2（瓶子），哪种规则会把瓶子几乎全部丢掉？', answer: 'attn' },
  { id: 'c2', q: 'q3', ask: '问题换成 Q3（叉子），哪种规则会把叉子全部丢掉？', answer: 'fixed' },
  { id: 'c3', q: 'q1', ask: 'Q1（蛋糕）时，哪种规则在浅层保留的图块最多（因而浅层计算也最多）？', answer: 'vtw' },
];

export const M2Questions: React.FC<WidgetProps> = () => {
  const [q, setQ] = useState<Q>('q2');
  const [method, setMethod] = useState<Method>('attn');
  const ch = useChallenge(CHALLENGES.length);
  const [ci, setCi] = useState(0);
  const [picked, setPicked] = useState<Method | null>(null);
  const anim = useRef(new Anim()).current;
  const pulse = useRef(new Pulse(0.8)).current;
  const geo = useRef<{ panels: { m: Method; x: number; y: number; w: number; h: number }[] }>({ panels: [] });
  const tapAt = useRef<{ x: number; y: number } | null>(null);

  const cur = CHALLENGES[ci];
  const activeQ: Q = ch.guessing ? cur.q : q;
  const reveal = !ch.guessing || picked !== null;
  const panels: Method[] = ch.guessing ? ['fixed', 'attn', 'vtw'] : [method];

  const covs = useMemo(() => ({ fixed: coverage('fixed', activeQ), attn: coverage('attn', activeQ), vtw: coverage('vtw', activeQ) }), [activeQ]);

  const s = useStage(
    {
      heightOf: (w) => (ch.guessing ? Math.round(64 + (((w - 24) / 3 - 4) / COLS) * ROWS) : clamp(w * 0.62, 240, 380)),
      draw: ({ ctx, w, h, t, dt, final }) => {
        anim.begin();
        ctx.clearRect(0, 0, w, h);
        const n = panels.length;
        const gap = 12;
        const top = 30;
        const pw = (w - gap * (n - 1)) / n;
        const tile = Math.min((pw - 4) / COLS, (h - top - 30) / ROWS);
        geo.current.panels = [];
        txt(ctx, QUESTIONS[activeQ].text, 2, 12, { size: 12, color: C.ink, weight: 600 });
        panels.forEach((m, pi) => {
          const gw = tile * COLS;
          const gh = tile * ROWS;
          const ox = pi * (pw + gap) + (pw - gw) / 2;
          const oy = top;
          geo.current.panels.push({ m, x: ox, y: oy, w: gw, h: gh });
          const kept = keptSet(m, activeQ);
          // 底图：一张画出来的桌面（蛋糕、瓶子、叉子），按图块切开；保留的图块清晰，丢弃的图块变暗缩小
          const scene = getScene(Math.round(tile * COLS), Math.round(tile * ROWS));
          const sw = scene.width / COLS;
          const sh = scene.height / ROWS;
          TILES.forEach((tt, i) => {
            const show = reveal ? (kept[i] ? 1 : 0) : 0.5;
            // 保留的图块依次亮起（按行列错开），丢弃的淡出
            const v = anim.to(`${pi}-${m}-${i}`, show, dt, final, 7 + ((tt.c + tt.r) % 6));
            const x = ox + tt.c * tile;
            const y = oy + tt.r * tile;
            const sz = tile - 1.2;
            const shrink = reveal ? 0.62 + 0.38 * v : 1;
            const a = reveal ? 0.14 + 0.86 * v : 0.6;
            const ss = sz * shrink;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.drawImage(scene, tt.c * sw, tt.r * sh, sw, sh, x + (sz - ss) / 2, y + (sz - ss) / 2, ss, ss);
            ctx.restore();
            if (reveal && v > 0.6 && tt.obj !== 'bg') {
              ctx.strokeStyle = rgba(C.vis, 0.35 * v);
              ctx.strokeRect(x + (sz - ss) / 2 + 0.5, y + (sz - ss) / 2 + 0.5, ss - 1, ss - 1);
            }
          });
          // 关键区域虚线框（逐步画出来）
          const obj = QUESTIONS[activeQ].obj;
          const tiles = TILES.filter((tt) => tt.obj === obj);
          const minC = Math.min(...tiles.map((tt) => tt.c));
          const maxC = Math.max(...tiles.map((tt) => tt.c));
          const minR = Math.min(...tiles.map((tt) => tt.r));
          const maxR = Math.max(...tiles.map((tt) => tt.r));
          const bx = ox + minC * tile - 2;
          const by = oy + minR * tile - 2;
          const bw = (maxC - minC + 1) * tile + 3;
          const bh = (maxR - minR + 1) * tile + 3;
          const drawP = anim.to(`box-${activeQ}-${pi}`, 1, dt, final, 5);
          ctx.save();
          ctx.strokeStyle = rgba(C.moon, 0.95);
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 3]);
          const per = 2 * (bw + bh);
          ctx.lineDashOffset = 0;
          ctx.beginPath();
          // 按进度画出矩形的一部分
          const len = per * drawP;
          const segs: [number, number, number, number][] = [
            [bx, by, bx + bw, by],
            [bx + bw, by, bx + bw, by + bh],
            [bx + bw, by + bh, bx, by + bh],
            [bx, by + bh, bx, by],
          ];
          let left = len;
          ctx.moveTo(bx, by);
          for (const [x1, y1, x2, y2] of segs) {
            const L = Math.hypot(x2 - x1, y2 - y1);
            if (left <= 0) break;
            const f = Math.min(1, left / L);
            ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f);
            left -= L;
          }
          ctx.stroke();
          ctx.restore();
          // 物体短标签（只在单面板时显示，避免拥挤）
          if (n === 1) {
            const lab = (o: Obj, name: string) => {
              const ts = TILES.filter((tt) => tt.obj === o);
              const c0 = Math.min(...ts.map((tt) => tt.c));
              const r0 = Math.min(...ts.map((tt) => tt.r));
              txt(ctx, name, ox + c0 * tile + 2, oy + r0 * tile - 7, { size: 10, color: C.moon, weight: 700 });
            };
            lab('cake', '蛋糕');
            lab('bottle', '瓶子');
            lab('fork', '叉子');
          }
          // 面板标题与结果
          txt(ctx, METHOD_SHORT[m], ox, oy + gh + 14, { size: 11, color: C.ink2, weight: 600 });
          if (reveal) {
            const cv = covs[m];
            const lost = cv.frac < 0.25;
            txt(ctx, `${QUESTIONS[activeQ].name} ${cv.k}/${cv.tot}`, ox + gw, oy + gh + 14, {
              size: 11,
              color: lost ? C.bad : C.ink,
              align: 'right',
              weight: 700,
            });
          }
          if (ch.guessing && picked === m) {
            ctx.strokeStyle = picked === cur.answer ? C.ok : C.warn;
            ctx.lineWidth = 2;
            rr(ctx, ox - 4, oy - 4, gw + 8, gh + 8, 6);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        });
        const pp = pulse.p(t, final);
        if (pp >= 0 && tapAt.current) {
          ripple(ctx, tapAt.current.x, tapAt.current.y, easeOut(pp), C.moon, 30);
          anim.moving = true;
        }
        return anim.moving;
      },
    },
    [activeQ, method, ch.guessing, picked, ci]
  );

  const pick = (m: Method) => {
    if (picked !== null) return;
    setPicked(m);
    ch.record(cur.id, m === cur.answer);
  };

  const onTap = (x: number, y: number) => {
    const p = geo.current.panels.find((g) => x >= g.x - 6 && x <= g.x + g.w + 6 && y >= g.y - 6 && y <= g.y + g.h + 20);
    if (!p) return;
    tapAt.current = { x, y };
    pulse.fire(performance.now() / 1000);
    if (ch.guessing) pick(p.m);
  };

  const cv = covs[method];
  const lost = cv.frac < 0.25;
  const explain = (
    <p>
      在 {QUESTIONS[cur.q].text.slice(0, 2)} 下，关键图块保住的数量：固定保留 {covs.fixed.k}/{covs.fixed.tot}，注意力打分 {covs.attn.k}/{covs.attn.tot}，VTW（前 K 层）{covs.vtw.k}/{covs.vtw.tot}。
      {cur.answer === 'attn' ? ' 这里的“注意力打分”按图 1(b) 的现象设定：显眼的蛋糕高分，真正被问到的瓶子反而低分。' : ''}
      {cur.answer === 'fixed' ? ' 固定保留只看图块本身是否显眼，与问题无关，细小的叉子从来进不了前 25 名。' : ''}
      {cur.answer === 'vtw' ? ' VTW 在前 K 层保留全部 96 块，浅层的计算量也就最大；它的节省全部来自第 K+1 层起。' : ''}
    </p>
  );

  return (
    <div className="mod-stack">
      <div className="mod-toolbar">
        <ModeSwitch
          ch={{
            ...ch,
            setMode: (m) => {
              ch.setMode(m);
              setCi(0);
              setPicked(null);
            },
          }}
        />
        <Tag kind="demo" />
      </div>
      <StageBox
        s={s}
        onTap={onTap}
        label={
          ch.guessing
            ? `挑战：${cur.ask}三个面板分别是固定保留、注意力打分、VTW。`
            : `${QUESTIONS[q].text}${METHOD_NAME[method]}保留了 ${cv.keptN} 个图块，关键区域保住 ${cv.k}/${cv.tot}`
        }
      />
      {ch.guessing ? (
        <>
          <Guess
            q={cur.ask}
            options={(['fixed', 'attn', 'vtw'] as Method[]).map((m) => ({ value: m, label: METHOD_SHORT[m] }))}
            answer={cur.answer}
            picked={picked}
            onPick={pick}
            explain={explain}
            canvasHint="点画布上的三个面板之一，或点下面的选项"
          />
          <div className="ctrl-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={picked === null || ci >= CHALLENGES.length - 1}
              onClick={() => {
                setCi((i) => i + 1);
                setPicked(null);
              }}
            >
              下一题（{Math.min(ci + 2, CHALLENGES.length)}/{CHALLENGES.length}）
            </button>
          </div>
          <ScoreBar
            ch={ch}
            onRestart={() => {
              setCi(0);
              setPicked(null);
            }}
          />
        </>
      ) : (
        <>
          <Controls>
            <Seg
              small
              label="问题"
              value={q}
              onChange={setQ}
              options={[
                { value: 'q1', label: 'Q1 蛋糕' },
                { value: 'q2', label: 'Q2 瓶子' },
                { value: 'q3', label: 'Q3 叉子' },
              ]}
            />
            <Seg
              small
              label="保留规则"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'fixed', label: '固定保留' },
                { value: 'attn', label: '注意力打分' },
                { value: 'vtw', label: 'VTW（浅层）' },
              ]}
            />
          </Controls>
          <Feedback
            tone={lost ? 'bad' : 'info'}
            k={`${q}-${method}`}
            lead={
              lost ? (
                <>
                  <b>{QUESTIONS[q].name}丢了：</b>只保住 {cv.k}/{cv.tot} 个关键图块，后面的层再也看不到它。
                </>
              ) : method === 'vtw' ? (
                <>
                  <b>前 K 层一个不丢：</b>96 块全部参与计算；代价是浅层没有任何节省。
                </>
              ) : (
                <>
                  <b>{QUESTIONS[q].name}保住了</b> {cv.k}/{cv.tot} 个关键图块（共保留 {cv.keptN} 块）。
                </>
              )
            }
            more={
              <p>
                {METHOD_NAME[method]}。图块场景与打分都是教学示意：固定保留取最显眼的 25 块，与问题无关；注意力打分保留一半（48 块），按图 1(b)
                的现象设定为“显眼的蛋糕总拿高分”。VTW 并不是在这里“赢”——它在浅层保留全部图块，节省只发生在第 K+1 层起，而且前提是信息已经迁移（第 4 章）。
              </p>
            }
          />
        </>
      )}
    </div>
  );
};
