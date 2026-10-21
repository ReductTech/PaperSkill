import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { approach, useCanvasBox, useStageLoop, useTween } from '../lib/hooks';
import { C } from '../lib/palette';
import { Feedback, Seg, Slider } from '../ui/kit';
import { coverError, euclidOf, greedyMaxMin, makeCloud, minPair, randomSubset, rng, topK } from '../lib/maxmin';

// 2.1 教学示意：比较 Top-k / 随机 / Max-Min 在同一预算下的覆盖与相关性。
// 三个场景（分数 = 场景设定的“任务相关性”，不是模型输出）：
//   高分集中：分数被人为集中在左下簇（模拟“注意力集中在少数区域”）——Top-k 会扎堆；
//   高分分散：高分点散落在各簇——这时按分数挑也能兼顾覆盖，Top-k 是合理的；
//   离群点：远处有几个被设定为与任务无关的离群点——Max-Min 会把名额花在它们身上。

type Method = 'topk' | 'random' | 'maxmin';
type Scene = 'cluster' | 'spread' | 'outlier';
const SCENES: { value: Scene; label: string }[] = [
  { value: 'cluster', label: '场景 A · 高分集中' },
  { value: 'spread', label: '场景 B · 高分分散' },
  { value: 'outlier', label: '场景 C · 远处有无关离群点' },
];
// 场景 C 的离群点：放在四角与上沿，簇编号记为 OUT（不计入“覆盖簇数”）
const OUT = 99;
const OUTLIERS = [
  { x: 0.03, y: 0.05 },
  { x: 0.97, y: 0.04 },
  { x: 0.98, y: 0.96 },
  { x: 0.03, y: 0.95 },
  { x: 0.5, y: 0.02 },
];
const NAMES: Record<Method, string> = { topk: '重要性 Top-k（示意）', random: '随机', maxmin: 'Max-Min（DivPrune）' };
const COLORS: Record<Method, string> = { topk: C.mustard, random: C.gray, maxmin: C.verm };

const SPECS = [
  { cx: 0.22, cy: 0.7, sx: 0.06, sy: 0.06, n: 55 },
  { cx: 0.5, cy: 0.5, sx: 0.07, sy: 0.06, n: 40 },
  { cx: 0.8, cy: 0.66, sx: 0.06, sy: 0.07, n: 35 },
  { cx: 0.72, cy: 0.22, sx: 0.05, sy: 0.04, n: 20 },
  { cx: 0.25, cy: 0.18, sx: 0.03, sy: 0.03, n: 10 },
];

export const Ch2Compare: React.FC<WidgetProps> = () => {
  const [method, setMethod] = useState<Method>('topk');
  const [scene, setScene] = useState<Scene>('cluster');
  const [pct, setPct] = useState(10);
  const pts = useMemo(() => {
    const base = makeCloud(31, SPECS);
    return scene === 'outlier' ? [...base, ...OUTLIERS.map((o) => ({ ...o, c: OUT }))] : base;
  }, [scene]);
  const n = pts.length;
  // 固定纵横比 1.6 : 1 计算距离，绘制时统一比例
  const AR = 1.6;
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  // 示意分数 = 场景设定的任务相关性
  const scores = useMemo(() => {
    const r = rng(77);
    if (scene === 'spread') return pts.map(() => (r() < 0.22 ? 0.7 + 0.3 * r() : 0.3 * r()));
    if (scene === 'outlier') return pts.map((p) => (p.c === OUT ? 0 : 0.3 + 0.55 * r()));
    return pts.map((p) => (p.c === 0 ? 0.65 + 0.35 * r() : p.c === 1 ? 0.25 + 0.3 * r() : 0.35 * r()));
  }, [pts, scene]);
  const k = Math.max(2, Math.round((pct / 100) * n));

  const sel = useMemo(() => {
    const out: Record<Method, number[]> = {
      topk: topK(scores, k),
      random: randomSubset(n, k, 5),
      maxmin: greedyMaxMin(n, k, d),
    };
    return out;
  }, [scores, k, n, d]);

  const stats = useMemo(() => {
    const res = {} as Record<Method, { clusters: number; mm: number; cover: number; rel: number; out: number }>;
    (Object.keys(sel) as Method[]).forEach((m) => {
      const s = sel[m];
      res[m] = {
        clusters: new Set(s.map((i) => pts[i].c).filter((c) => c !== OUT)).size,
        mm: minPair(s, d).v,
        cover: coverError(n, s, d),
        rel: s.reduce((a, i) => a + scores[i], 0) / s.length,
        out: s.filter((i) => pts[i].c === OUT).length,
      };
    });
    return res;
  }, [sel, pts, d, n, scores]);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => Math.min(420, Math.max(240, W * 0.6)));

  // 动画状态：每个点的“被选中程度”从旧值平滑过渡到新值；切换方法时，旧名额收缩、新名额亮起。
  const animRef = useRef<{ wt: Float32Array; heat: number; since: number; key: string }>({
    wt: new Float32Array(pts.length),
    heat: 1,
    since: 0,
    key: '',
  });

  useStageLoop(canvasRef, w, h, (ctx, t, dt) => {
    const a = animRef.current;
    if (a.wt.length !== n) a.wt = new Float32Array(n);
    const s = sel[method];
    const chosen = new Set(s);
    const key = scene + ':' + method + ':' + s.join(',');
    if (a.key !== key) {
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900;
    for (let i = 0; i < n; i++) a.wt[i] = final ? (chosen.has(i) ? 1 : 0) : approach(a.wt[i], chosen.has(i) ? 1 : 0, dt, 10);
    a.heat = final ? (method === 'topk' ? 1 : 0) : approach(a.heat, method === 'topk' ? 1 : 0, dt, 8);
    const lineA = final ? 1 : Math.min(1, Math.max(0, (a.since - 0.12) / 0.45));

    ctx.clearRect(0, 0, w, h);
    const sc = Math.min((w - 28) / AR, h - 28);
    const ox = (w - sc * AR) / 2;
    const oy = (h - sc) / 2;
    const X = (x: number) => ox + x * AR * sc;
    const Y = (y: number) => oy + y * sc;
    // 簇的淡色底（不加文字标签）
    SPECS.forEach((sp) => {
      ctx.beginPath();
      ctx.ellipse(X(sp.cx), Y(sp.cy), Math.max(1, sp.sx * 2.6 * AR * sc), Math.max(1, sp.sy * 2.6 * sc), 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 91, 255, 0.05)';
      ctx.fill();
    });
    // 未选中的点：Top-k 模式下用“分数热度”着色（它看到的东西）
    pts.forEach((p, i) => {
      const off = 1 - a.wt[i];
      if (off < 0.02) return;
      const r = 2.3 + a.heat * (scores[i] * 2.4 - 0.3);
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), Math.max(0.5, r), 0, Math.PI * 2);
      const hot = 0.12 + scores[i] * 0.45;
      ctx.fillStyle = `rgba(${Math.round(90 + 124 * a.heat)},${Math.round(100 + 48 * a.heat)},${Math.round(130 - 112 * a.heat)},${(0.45 * (1 - a.heat) + hot * a.heat) * off})`;
      ctx.fill();
    });
    // 场景 C 的离群点：虚线圈标出
    if (scene === 'outlier') {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(20, 28, 52, 0.45)';
      ctx.lineWidth = 1;
      pts.forEach((p) => {
        if (p.c !== OUT) return;
        ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), 9, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }
    // 每个原始点连到最近的选中点（覆盖关系，淡）
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = `rgba(59, 91, 255, ${0.2 * lineA})`;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (chosen.has(i)) return;
      let best = -1;
      let bv = Infinity;
      for (const j of s) {
        const v = d(i, j);
        if (v < bv) {
          bv = v;
          best = j;
        }
      }
      if (best >= 0) {
        ctx.moveTo(X(p.x), Y(p.y));
        ctx.lineTo(X(pts[best].x), Y(pts[best].y));
      }
    });
    ctx.stroke();
    // 最近的一对（短板）：沿连线“画出来”，并带一点光晕
    const mp = minPair(s, d);
    if (mp.a >= 0) {
      const x1 = X(pts[mp.a].x);
      const y1 = Y(pts[mp.a].y);
      const x2 = X(pts[mp.b].x);
      const y2 = Y(pts[mp.b].y);
      ctx.save();
      ctx.shadowColor = C.cobalt;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = C.cobalt;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * lineA, y1 + (y2 - y1) * lineA);
      ctx.stroke();
      ctx.restore();
    }
    // 选中的点：按“被选中程度”放大、发光；Top-k 用三角，其余用圆
    const col = COLORS[method];
    for (let i = 0; i < n; i++) {
      const k2 = a.wt[i];
      if (k2 < 0.03) continue;
      const x = X(pts[i].x);
      const y = Y(pts[i].y);
      const pulse = final ? 1 : 0.85 + 0.15 * Math.sin(t * 3 + i);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * k2);
      g.addColorStop(0, col + '88');
      g.addColorStop(1, col + '00');
      ctx.globalAlpha = k2 * pulse;
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 16, 32, 32);
      ctx.globalAlpha = Math.min(1, k2 * 1.4);
      ctx.fillStyle = col;
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const r = 5 * (0.4 + 0.6 * k2);
      if (method === 'topk') {
        ctx.moveTo(x, y - r * 1.2);
        ctx.lineTo(x + r * 1.1, y + r * 0.8);
        ctx.lineTo(x - r * 1.1, y + r * 0.8);
        ctx.closePath();
      } else {
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [sel, method, scene, n]);

  const st = stats[method];
  const mmT = useTween(st.mm, 360);
  const covT = useTween(st.cover, 360);
  const best = (Object.keys(stats) as Method[]).reduce((a, b) => (stats[a].mm >= stats[b].mm ? a : b));
  const coverBest = (Object.keys(stats) as Method[]).reduce((a, b) => (stats[a].cover <= stats[b].cover ? a : b));

  const relTxt = (m: Method) => stats[m].rel.toFixed(2);
  const sceneNote: Record<Scene, Record<Method, string>> = {
    cluster: {
      topk: `${k} 个名额里有 ${sel.topk.filter((i) => pts[i].c === 0).length} 个落在左下那个“高分”簇，选中点之间最近只有 ${st.mm.toFixed(3)}——名额被重复信息占满。`,
      random: '小簇常被漏掉，最近一对的距离也没有保证。',
      maxmin: `每轮挑离已选集合最远的点，最近一对的距离为 ${st.mm.toFixed(3)}，三种方法中${best === 'maxmin' ? '最大' : '并非最大'}；平均覆盖距离为 ${st.cover.toFixed(3)}，${coverBest === 'maxmin' ? '也是三者中最小的' : '不是三者中最小的'}。`,
    },
    spread: {
      topk: '这个场景里高分点本来就散落在各簇，按分数挑也能兼顾覆盖，而且平均相关性最高——这时 Top-k 是合理的选择。',
      random: '随机不看分数，平均相关性明显低于 Top-k。',
      maxmin: `覆盖更均匀，但它不看相关性：平均相关性 ${relTxt('maxmin')}，Top-k 为 ${relTxt('topk')}。多样性高不等于对任务更有用。`,
    },
    outlier: {
      topk: '离群点在本场景中被设定为与任务无关（分数为 0），Top-k 不会选它们。',
      random: `随机选中了 ${stats.random.out} 个离群点。`,
      maxmin: `${st.out} 个名额给了远处的离群点——它们几何上最“分散”，但本场景设定它们与任务无关，平均相关性因此降到 ${relTxt('maxmin')}（Top-k 为 ${relTxt('topk')}）。这是“只看多样性”的代价。`,
    },
  };
  const fb: Record<Method, string> = {
    topk: `Top-k 只看分数：覆盖 ${st.clusters}/5 个簇，平均相关性 ${relTxt('topk')}。${sceneNote[scene].topk}`,
    random: `随机既不看分数也不看距离：覆盖 ${st.clusters}/5 个簇，平均相关性 ${relTxt('random')}。${sceneNote[scene].random}`,
    maxmin: `Max-Min 只看距离：覆盖 ${st.clusters}/5 个簇，平均相关性 ${relTxt('maxmin')}。${sceneNote[scene].maxmin}`,
  };

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg label="场景" small options={SCENES} value={scene} onChange={setScene} />
        <Seg label="选择方法" options={(Object.keys(NAMES) as Method[]).map((m) => ({ value: m, label: NAMES[m] }))} value={method} onChange={setMethod} />
        <Slider label="保留比例" value={pct} min={4} max={40} onChange={setPct} display={`${pct}%（${k} / ${n} 个点）`} />
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`${NAMES[method]}：选中 ${k} 个点，覆盖 ${st.clusters} 个簇`} />
      </div>
      <div className="cv-legend">
        <span><i className="dot" style={{ background: COLORS[method] }} />选中点</span>
        <span><i className="line" style={{ background: C.cobalt }} />选中点中最近的一对（短板）</span>
        <span><i className="line faint" />每个点 → 最近的选中点</span>
        {method === 'topk' ? <span><i className="dot" style={{ background: C.mustardSoft }} />点越大越黄 = 示意分数（任务相关性）越高</span> : null}
        {scene === 'outlier' ? <span><i className="ring" />虚线圈 = 离群点（场景设定为与任务无关）</span> : null}
      </div>
      <div className="mini-table-wrap">
        <table className="mini-table">
          <thead>
            <tr>
              <th scope="col">方法</th>
              <th scope="col">覆盖簇数</th>
              <th scope="col">最近一对距离 ↑</th>
              <th scope="col">平均覆盖距离 ↓</th>
              <th scope="col">平均相关性 ↑（场景设定）</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(NAMES) as Method[]).map((m) => (
              <tr key={m} className={m === method ? 'is-on' : ''}>
                <th scope="row"><i className="dot" style={{ background: COLORS[m] }} />{NAMES[m]}</th>
                <td>{stats[m].clusters} / 5</td>
                <td>{m === method ? mmT.toFixed(3) : stats[m].mm.toFixed(3)}</td>
                <td>{m === method ? covT.toFixed(3) : stats[m].cover.toFixed(3)}</td>
                <td>{stats[m].rel.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback tone={scene === 'cluster' ? (method === 'maxmin' ? 'good' : method === 'topk' ? 'bad' : 'info') : scene === 'spread' ? (method === 'topk' ? 'good' : 'info') : method === 'maxmin' ? 'warn' : 'info'}>{fb[method]}</Feedback>
      <p className="w-note">教学示意：二维点、欧氏距离、人为构造的分数；“相关性”来自场景设定，不是模型输出，几何上的覆盖也不等于任务精度。真实的 FastV 分数来自 LLM 第 K 层注意力，真实的 DivPrune 在 4096 维投影特征上用余弦距离。</p>
    </div>
  );
};

export default Ch2Compare;
