import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, rr, label, rgba, approach, rand, toCanvas, mix } from './stageKit';
import { ALLOC, EFFICIENCY, TOKEN_COUNTS } from './paperData';
import { clamp } from '../lib/canvasKit';
import { ChipGroup, useIsMobile, CanvasPan } from './ui';

type Kind = 'sys' | 'img' | 'ins' | 'out';
const KINDS: Kind[] = ['sys', 'img', 'ins', 'out'];
const COL: Record<Kind, string> = { sys: C.sys, img: C.img, ins: C.ins, out: C.out };
const NAME: Record<Kind, string> = { sys: '系统提示', img: '图像 token', ins: '用户指令', out: '输出 token' };
const TOTAL_TOK = TOKEN_COUNTS.sys + TOKEN_COUNTS.img + TOKEN_COUNTS.ins + TOKEN_COUNTS.out;

function Legend() {
  return (
    <div className="chip-row legend-row" style={{ marginBottom: 6 }}>
      {KINDS.map((k) => (
        <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', color: 'var(--ink-2)' }}>
          <i style={{ width: 12, height: 12, borderRadius: 3, background: COL[k], display: 'inline-block' }} />
          {NAME[k]}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
//  模块 3.1（P1 滑块）：层号 -> 注意力分配 λ（圆环 + 流带）与注意力效率 ε（对数条）
// ============================================================================
function scrubLayout(mobile: boolean) {
  return mobile
    ? { W: 420, H: 624, tx: 22, tw: 376, cx: 210, cy: 158, R: 72, bx: 24, bw: 330, yTop: 292, yBot: 420, ex: 128, ew: 236, ey: 482, es: 34, names: true }
    : { W: 1080, H: 320, tx: 40, tw: 1000, cx: 170, cy: 182, R: 92, bx: 330, bw: 420, yTop: 92, yBot: 252, ex: 830, ew: 200, ey: 92, es: 46, names: false };
}

export const LayerScrubber: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const Lay = useMemo(() => scrubLayout(mobile), [mobile]);
  const LRef = useRef(Lay);
  LRef.current = Lay;
  const [layer, setLayer] = useState(1);
  const layerRef = useRef(1);
  layerRef.current = layer;
  const cur = useRef({ ...ALLOC.shallow, e_sys: 2, e_img: 1, e_ins: 3, e_out: 9, ring: 0 });

  const canvasRef = useStage(Lay.W, Lay.H, (ctx, t, dt) => {
    const P = LRef.current;
    const L = layerRef.current;
    const deep = L > 2;
    const tgt = deep ? ALLOC.deep : ALLOC.shallow;
    const eff = deep ? EFFICIENCY.deep : EFFICIENCY.shallow;
    const c = cur.current;
    KINDS.forEach((k) => {
      c[k] = approach(c[k], tgt[k], dt, 6);
    });
    c.e_sys = approach(c.e_sys, eff.sys, dt, 5);
    c.e_img = approach(c.e_img, eff.img, dt, 5);
    c.e_ins = approach(c.e_ins, eff.ins, dt, 5);
    c.e_out = approach(c.e_out, eff.out, dt, 5);
    c.ring += dt;
    drawStage(ctx, P.W, P.H, t, 0.96);

    // ---- 顶部层轨道：32 层 ----
    for (let l = 1; l <= 32; l++) {
      const x = P.tx + ((l - 0.5) / 32) * P.tw;
      const isCur = l === L;
      const sh = l <= 2;
      ctx.fillStyle = isCur ? C.emph : sh ? rgba(C.out, 0.55) : 'rgba(150,175,220,0.25)';
      ctx.beginPath();
      ctx.arc(x, 22, isCur ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (isCur) glow(ctx, x, 22, 20, C.emph, 0.6);
    }
    ctx.strokeStyle = rgba(C.out, 0.6);
    ctx.setLineDash([3, 3]);
    const sepX = P.tx + (2 / 32) * P.tw;
    ctx.beginPath();
    ctx.moveTo(sepX, 10);
    ctx.lineTo(sepX, 34);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, deep ? '深层' : '浅层', P.tx, 48, mobile ? 16 : 13, deep ? C.bad : C.out, 'left', 700);

    // ---- 圆环（注意力分配 λ）----
    let a0 = -Math.PI / 2;
    KINDS.forEach((k) => {
      const span = c[k] * Math.PI * 2;
      if (span > 0.002) {
        ctx.save();
        ctx.shadowColor = COL[k];
        ctx.shadowBlur = 18;
        ctx.strokeStyle = COL[k];
        ctx.lineWidth = k === 'img' ? 34 : 28;
        ctx.beginPath();
        ctx.arc(P.cx, P.cy, P.R, a0 + 0.012, a0 + span - 0.012);
        ctx.stroke();
        ctx.restore();
      }
      a0 += span;
    });
    const ha = c.ring * 0.8;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(P.cx, P.cy, P.R, ha, ha + 0.5);
    ctx.stroke();
    ctx.restore();
    label(ctx, `${Math.round(c.img * 100)}%`, P.cx, P.cy - 6, 34, C.img, 'center', 800, true);
    label(ctx, 'λ 图像', P.cx, P.cy + 26, mobile ? 16 : 13, C.muted, 'center', 700);

    // ---- token 数量占比 vs 注意力占比（流带）----
    const { bx, bw, yTop, yBot } = P;
    const bh = 22;
    let xt = bx;
    let xb = bx;
    KINDS.forEach((k) => {
      const wt = (TOKEN_COUNTS[k] / TOTAL_TOK) * bw;
      const wb = c[k] * bw;
      const g = ctx.createLinearGradient(0, yTop + bh, 0, yBot);
      g.addColorStop(0, rgba(COL[k], 0.42));
      g.addColorStop(1, rgba(COL[k], 0.22));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(xt, yTop + bh);
      ctx.bezierCurveTo(xt, (yTop + yBot) / 2, xb, (yTop + yBot) / 2, xb, yBot);
      ctx.lineTo(xb + wb, yBot);
      ctx.bezierCurveTo(xb + wb, (yTop + yBot) / 2, xt + wt, (yTop + yBot) / 2, xt + wt, yTop + bh);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COL[k];
      rr(ctx, xt + 1, yTop, Math.max(2, wt - 2), bh, 4);
      ctx.fill();
      if (wb > 1.5) {
        rr(ctx, xb + 1, yBot, Math.max(2, wb - 2), bh, 4);
        ctx.fill();
      }
      xt += wt;
      xb += wb;
    });
    for (let q = 0; q < 5; q++) {
      const u = (t * 0.5 + q / 5) % 1;
      const xs = bx + (TOKEN_COUNTS.sys / TOTAL_TOK) * bw + ((TOKEN_COUNTS.img / TOTAL_TOK) * bw) * (0.2 + 0.6 * rand(q));
      const xe = bx + c.sys * bw + c.img * bw * 0.5;
      const yy = yTop + bh + (yBot - yTop - bh) * u;
      const xx = xs + (xe - xs) * (u * u * (3 - 2 * u));
      glow(ctx, xx, yy, 10, '#cfe3ff', 0.5 * (1 - u * 0.6));
    }
    label(ctx, '64%', bx + bw + 12, yTop + bh / 2, 15, C.img, 'left', 800, true);
    label(ctx, `${Math.round(c.img * 100)}%`, bx + bw + 12, yBot + bh / 2, 15, C.img, 'left', 800, true);
    if (mobile) {
      label(ctx, '占的位置', bx, yTop - 14, 15, C.muted, 'left', 700);
      label(ctx, '分到的注意力', bx, yBot + bh + 18, 15, C.muted, 'left', 700);
    }

    // ---- 注意力效率 ε（对数刻度，以图像为 1×）----
    const effs: [Kind, number][] = [
      ['sys', c.e_sys],
      ['img', c.e_img],
      ['ins', c.e_ins],
      ['out', c.e_out],
    ];
    effs.forEach(([k, v], i) => {
      const y = P.ey + i * P.es;
      const frac = Math.log10(Math.max(1, v)) / Math.log10(500);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, P.ex, y, P.ew, 16, 8);
      ctx.fill();
      const w = Math.max(10, frac * P.ew);
      const g = ctx.createLinearGradient(P.ex, 0, P.ex + w, 0);
      g.addColorStop(0, rgba(COL[k], 0.5));
      g.addColorStop(1, COL[k]);
      ctx.fillStyle = g;
      rr(ctx, P.ex, y, w, 16, 8);
      ctx.fill();
      if (k === 'sys' && v > 100) glow(ctx, P.ex + w, y + 8, 26, C.sys, 0.6 + 0.2 * Math.sin(t * 4));
      if (P.names) label(ctx, NAME[k].replace(' token', ''), P.ex - 12, y + 8, 15, COL[k], 'right', 700);
      label(ctx, `${v >= 100 ? Math.round(v) : v.toFixed(1)}×`, P.ex + P.ew, y + 30, 14, k === 'img' ? C.img : C.text, 'right', 800, true);
    });
  });

  const deep = layer > 2;
  return (
    <div>
      <Legend />
      <CanvasPan fit>
        <canvas ref={canvasRef} width={Lay.W} height={Lay.H} aria-label="各层注意力分配与注意力效率" />
      </CanvasPan>
      <div className="ctrl">
        <label>
          当前层 <span className="val">{layer} / 32</span>
        </label>
        <input
          type="range"
          min={1}
          max={32}
          step={1}
          value={layer}
          onChange={(e) => setLayer(Number(e.target.value))}
          aria-label="选择层号"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className={`feedback ${deep ? 'bad' : ''}`}>
        {deep
          ? `第 ${layer} 层属于深层（第 3–32 层）：系统提示拿走 85% 的注意力，图像 token 只剩 3%；每个图像 token 的人均注意力仅为系统提示的 1/472（Fig. 3）。论文只报告了浅层与深层两组平均值，滑块在第 3–32 层之间显示的是同一组数。`
          : `第 ${layer} 层属于浅层（第 1–2 层）：注意力相对均衡，图像 token 还能分到 24%；输出 token 主要关注之前生成的内容（57%）（Fig. 3）。`}
      </div>
    </div>
  );
};

// ============================================================================
//  模块 3.2（P4 + 点击）：合成注意力图（示意，按论文 Fig.4 的规律）
// ============================================================================
const W2 = 1080;
const H2 = 340;
const NS = 6;
const NI = 48;
const NN = 10;
const NO = 34;
const NCOL = NS + NI + NN + NO;
const MX = 100;
const MY = 40;
const CW = 9;
const RH = 5.6;

type Mode = 0 | 1 | 2;
const MODES = [
  { name: '第 1 层（浅层）', alloc: ALLOC.shallow, sysPeak: 0.25, imgSpiky: 0.0 },
  { name: '第 16 层（深层）', alloc: ALLOC.deep, sysPeak: 0.9, imgSpiky: 0.9 },
  { name: '第 32 层（深层）', alloc: ALLOC.deep, sysPeak: 0.75, imgSpiky: 0.7 },
];

function buildMap(mode: Mode): number[][] {
  const m = MODES[mode];
  const rows: number[][] = [];
  for (let i = 0; i < NO; i++) {
    const row = new Array(NCOL).fill(0);
    // 系统提示：深层集中在开头 token（竖直亮线）
    const sysW: number[] = [];
    for (let j = 0; j < NS; j++) sysW.push(j === 0 ? 1 + 40 * m.sysPeak : j === 1 ? 1 + 10 * m.sysPeak : 1 - 0.7 * m.sysPeak + 0.3 * rand(j + 3));
    const sSum = sysW.reduce((a, b) => a + b, 0);
    sysW.forEach((w, j) => (row[j] = (m.alloc.sys * w) / sSum));
    // 图像：浅层平滑，深层稀疏
    const imgW: number[] = [];
    for (let j = 0; j < NI; j++) {
      const smooth = 0.6 + 0.4 * Math.sin(j * 0.35 + i * 0.05) ** 2 + 0.3 * rand(j * 7 + i * 3 + mode);
      const spike = rand(j * 13 + 1) > 0.9 ? 3 * rand(j * 3 + i + 2) : 0.08 * rand(j + i);
      imgW.push((1 - m.imgSpiky) * smooth + m.imgSpiky * spike);
    }
    const iSum = imgW.reduce((a, b) => a + b, 0);
    imgW.forEach((w, j) => (row[NS + j] = (m.alloc.img * w) / iSum));
    // 指令
    for (let j = 0; j < NN; j++) row[NS + NI + j] = (m.alloc.ins / NN) * (0.6 + 0.8 * rand(j * 5 + i + mode * 11));
    // 输出：只能看见已生成的（因果），偏向最近的 token
    const outW: number[] = [];
    for (let j = 0; j <= i; j++) outW.push(Math.exp(-(i - j) / (mode === 0 ? 2.2 : 1.4)) + 0.05);
    const oSum = outW.reduce((a, b) => a + b, 0);
    outW.forEach((w, j) => (row[NS + NI + NN + j] = (m.alloc.out * w) / oSum));
    rows.push(row);
  }
  return rows;
}

function heat(v: number) {
  const s = clamp((Math.log10(Math.max(v, 1e-5)) + 4) / 3.7, 0, 1);
  if (s < 0.33) return mix('#101a30', '#2f5fae', s / 0.33);
  if (s < 0.66) return mix('#2f5fae', '#4fd1e0', (s - 0.33) / 0.33);
  return mix('#4fd1e0', '#fff1c4', (s - 0.66) / 0.34);
}

function kindOf(col: number): Kind {
  if (col < NS) return 'sys';
  if (col < NS + NI) return 'img';
  if (col < NS + NI + NN) return 'ins';
  return 'out';
}

export const AttentionMap: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>(0);
  const [col, setCol] = useState<number | null>(null);
  const maps = useMemo(() => [buildMap(0), buildMap(1), buildMap(2)], []);
  const st = useRef({ mode: 0 as Mode, blend: maps[0].map((r) => r.slice()), col: null as number | null, hoverCol: -1 });
  st.current.mode = mode;
  st.current.col = col;

  const colMeans = useMemo(
    () =>
      maps.map((mp) => {
        const out: number[] = new Array(NCOL).fill(0);
        for (let j = 0; j < NCOL; j++) {
          let s = 0;
          let n = 0;
          for (let i = 0; i < NO; i++) {
            if (j >= NS + NI + NN && j - (NS + NI + NN) > i) continue;
            s += mp[i][j];
            n += 1;
          }
          out[j] = n ? s / n : 0;
        }
        return out;
      }),
    [maps]
  );

  const canvasRef = useStage(W2, H2, (ctx, t, dt) => {
    const s = st.current;
    const tgt = maps[s.mode];
    for (let i = 0; i < NO; i++) for (let j = 0; j < NCOL; j++) s.blend[i][j] = approach(s.blend[i][j], tgt[i][j], dt, 5);
    drawStage(ctx, W2, H2, t, 0.99);
    // 分组底色
    const groups: [number, number, Kind][] = [
      [0, NS, 'sys'],
      [NS, NS + NI, 'img'],
      [NS + NI, NS + NI + NN, 'ins'],
      [NS + NI + NN, NCOL, 'out'],
    ];
    groups.forEach(([a, b, k]) => {
      ctx.fillStyle = rgba(COL[k], 0.9);
      rr(ctx, MX + a * CW, MY - 12, (b - a) * CW - 2, 5, 2);
      ctx.fill();
    });
    // 热力图
    for (let i = 0; i < NO; i++) {
      for (let j = 0; j < NCOL; j++) {
        const isOut = j >= NS + NI + NN;
        if (isOut && j - (NS + NI + NN) > i) continue;
        ctx.fillStyle = heat(s.blend[i][j]);
        ctx.fillRect(MX + j * CW, MY + i * RH, CW - 1, RH - 0.6);
      }
    }
    // 解码扫描线：当前正在生成的 token 行
    const scan = Math.floor((t * 6) % NO);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(MX - 2, MY + scan * RH - 1, NCOL * CW + 2, RH + 1);
    // 列均值条（= FastV 排序所用的“平均被关注度”的示意）
    const by = MY + NO * RH + 18;
    const bh = 58;
    let maxv = 0;
    for (let j = 0; j < NCOL; j++) {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < NO; i++) {
        if (j >= NS + NI + NN && j - (NS + NI + NN) > i) continue;
        sum += s.blend[i][j];
        n++;
      }
      const v = n ? sum / n : 0;
      maxv = Math.max(maxv, v);
    }
    for (let j = 0; j < NCOL; j++) {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < NO; i++) {
        if (j >= NS + NI + NN && j - (NS + NI + NN) > i) continue;
        sum += s.blend[i][j];
        n++;
      }
      const v = n ? sum / n : 0;
      const h = Math.sqrt(v / maxv) * bh;
      const k = kindOf(j);
      ctx.fillStyle = rgba(COL[k], j === s.col ? 1 : 0.7);
      ctx.fillRect(MX + j * CW, by + bh - h, CW - 1, h);
    }
    // 选中列
    const showCol = s.col ?? (s.hoverCol >= 0 ? s.hoverCol : null);
    if (showCol !== null) {
      ctx.strokeStyle = C.emph;
      ctx.lineWidth = 2;
      ctx.strokeRect(MX + showCol * CW - 1.5, MY - 2, CW + 2, NO * RH + bh + 22);
      glow(ctx, MX + showCol * CW + CW / 2, MY - 6, 16, C.emph, 0.7);
    }
    // 深层竖直亮线的强调
    if (s.mode > 0) glow(ctx, MX + CW / 2, MY + (NO * RH) / 2, 40 + 6 * Math.sin(t * 3), C.sys, 0.18);
    // 色标
    const lx = MX + NCOL * CW + 26;
    for (let q = 0; q < 60; q++) {
      ctx.fillStyle = heat(10 ** (-4 + (3.7 * (60 - q)) / 60));
      ctx.fillRect(lx, MY + q * 3.2, 14, 3.4);
    }
    label(ctx, '高', lx + 22, MY + 4, 12, C.muted, 'left', 700);
    label(ctx, '低', lx + 22, MY + 190, 12, C.muted, 'left', 700);
  });

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, click: boolean) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { x, y } = toCanvas(e, cv, W2, H2);
    const j = Math.floor((x - MX) / CW);
    const inside = j >= 0 && j < NCOL && y > MY - 16 && y < MY + NO * RH + 80;
    st.current.hoverCol = inside ? j : -1;
    cv.style.cursor = inside ? 'pointer' : 'default';
    if (click && inside) setCol(j);
  };

  const means = colMeans[mode];
  const avgAll = means.reduce((a, b) => a + b, 0) / NCOL;
  let fb: { text: string; cls: string };
  if (col === null) {
    fb =
      mode === 0
        ? { text: '浅层：注意力在各类 token 之间分布较平滑，图像区域整体可见。点击任意一列查看细节。', cls: '' }
        : { text: '深层：最左侧系统提示的开头几列出现竖直亮线——几乎每个输出 token 都在看它们；图像区域则又暗又稀疏。', cls: 'bad' };
  } else {
    const k = kindOf(col);
    const ratio = means[col] / avgAll;
    fb = {
      text: `这一列是「${NAME[k]}」，平均被关注度约为全部列平均值的 ${ratio.toFixed(ratio < 1 ? 2 : 1)} 倍。${
        k === 'img' && mode > 0 ? '深层里大多数图像列都很暗。论文描述的排序依据正是这类“平均被关注度”（官方代码实际只用最后一个 token 的注意力，见第 5 章）。' : ''
      }${k === 'sys' && mode > 0 && col < 2 ? '这就是 Fig. 4 中竖直亮线所在的位置：被高度关注，但这并不说明这里储存了视觉信息（见第 4 章）。' : ''}`,
      cls: k === 'img' && mode > 0 ? 'bad' : k === 'sys' && mode > 0 ? 'good' : '',
    };
  }

  return (
    <div>
      <ChipGroup
        label="选择层"
        value={mode}
        onChange={(v) => {
          setMode(v as Mode);
          setCol(null);
        }}
        options={MODES.map((m, i) => ({ key: i, label: m.name }))}
      />
      <Legend />
      <CanvasPan>
      <canvas
        ref={canvasRef}
        width={W2}
        height={H2}
        aria-label="解码过程注意力图（示意）"
        onPointerMove={(e) => onPointer(e, false)}
        onPointerDown={(e) => onPointer(e, true)}
        onPointerLeave={() => (st.current.hoverCol = -1)}
      />
      </CanvasPan>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
