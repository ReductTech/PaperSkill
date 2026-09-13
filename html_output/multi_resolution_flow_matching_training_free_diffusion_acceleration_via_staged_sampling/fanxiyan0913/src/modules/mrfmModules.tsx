import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// MrFlow 论文的交互控件集（数学/技术 或 混合视图）。
// 语义配色见 contract.md §5：
//   蓝 #27446e 引导/当前  绿 #228d5c 成功/论文方法  红 #c43f52 失败/旧方法
//   橙 #f07e47 强调  紫 #7c3aed 辅助  底 #f5f8f0  浅 #b8c9a7  深 #76906a
//   路径 #92400e  文字 #21324a  次要文字 #68778f  边框 #d7deea

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
const FONT = '20px "Segoe UI", system-ui, sans-serif';
const FONT_S = '16px "Segoe UI", system-ui, sans-serif';

function useCanvas(W: number, H: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef(paint);
  paintRef.current = paint;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const tick = () => { paintRef.current(ctx); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); };
    tick();
    const id = window.setInterval(tick, 120);
    return () => window.clearInterval(id);
  }, [W, H]);
  return ref;
}

function bg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
}

/* ---------- 1. 步数与总时间（P1 滑块） ---------- */
const W1 = 1080, H1 = 260;
export const TimeCost: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [nfe, setNfe] = useState(50);
  const perStep = 0.94; // 单步耗时（秒级示意）
  const total = (nfe * perStep).toFixed(1);
  const ref = useCanvas(W1, H1, (ctx) => {
    bg(ctx, W1, H1);
    const maxT = 100;
    const w = map(Math.min(nfe * perStep, maxT), 0, maxT, 0, W1 - 260);
    ctx.fillStyle = C.red; ctx.fillRect(120, 60, w, 46);
    ctx.fillStyle = C.ink; ctx.font = FONT;
    ctx.fillText('旧做法：步数多 × 每步贵', 120, 44);
    ctx.fillStyle = C.blue; ctx.font = FONT_S;
    ctx.fillText('总耗时 ≈ ' + total + ' s', 120 + w + 12, 92);
    ctx.fillStyle = C.line; ctx.fillRect(120, 150, W1 - 260, 2);
    ctx.fillStyle = C.muted;
    ctx.fillText('Qwen-Image-20B 原生 1024×1024 约 47 s', 120, 178);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W1} height={H1} />
      <div className="ctrl">
        <label>采样步数 / NFE <span className="val">{nfe}</span></label>
        <input type="range" min={4} max={100} value={nfe} onChange={(e) => setNfe(Number(e.target.value))} />
      </div>
      <div className={`feedback ${nfe * perStep > 60 ? 'bad' : nfe * perStep < 20 ? 'good' : ''}`}>
        {nfe * perStep > 60 ? '步数越多，总时间线性上升——这就是扩散慢的直接来源。'
          : nfe * perStep < 20 ? '步数少了，可单步仍很贵；只压步数会伤画质。'
          : '总时间 = 步数 × 每步成本，两个乘数都要想办法。'}
      </div>
    </div>
  );
};

/* ---------- 2. 分辨率与 token 数（P6 拖动） ---------- */
const W2 = 1080, H2 = 300;
export const ResolutionTokens: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [side, setSide] = useState(0.5);
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef(false);
  const px = map(side, 0, 1, 0, 1);
  const size = Math.round(lerp(256, 1024, px));
  // 数的是潜空间格子：论文附录给出 Qwen-Image 1024×1024 的高清潜变量形状为 16×128×128，
  // 即 1024 边长对应 128×128 个格子。边长减半 → 格子数降到 1/4，正对论文 3.1 节实测的 4× 省时。
  const tokens = Math.round(Math.pow(size / 8, 2));
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W2, H2); } catch { return; }
    const paint = () => {
      bg(ctx, W2, H2);
      const n = Math.round(lerp(4, 16, px));
      const gx = 60, gy = 40, gw = 380, gh = 220, cell = gw / n;
      ctx.strokeStyle = C.dark; ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) {
        ctx.beginPath(); ctx.moveTo(gx + i * cell, gy); ctx.lineTo(gx + i * cell, gy + gh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, gy + i * (gh / n)); ctx.lineTo(gx + gw, gy + i * (gh / n)); ctx.stroke();
      }
      ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.strokeRect(gx, gy, gw, gh);
      // 曲线
      const ox = 560, oy = 250, ow = 460, oh = 200;
      ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ow, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - oh); ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const t = i / 40, X = ox + t * ow, Y = oy - Math.pow(t, 2) * oh;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(ox + px * ow, oy - px * px * oh, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.ink; ctx.font = FONT;
      ctx.fillText('边长 ' + size + ' px', 60, 30);
      ctx.fillStyle = C.muted; ctx.font = FONT_S;
      ctx.fillText('潜空间格子 ≈ ' + tokens.toLocaleString(), 560, 282);
    };
    paint();
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    const id = window.setInterval(paint, 120);
    return () => window.clearInterval(id);
  }, [px, size, tokens]);
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    setSide(clamp((e.clientX - r.left) / r.width, 0, 1));
  };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W2} height={H2}
        style={{ cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={() => (drag.current = true)}
        onPointerUp={() => (drag.current = false)}
        onPointerLeave={() => (drag.current = false)}
        onPointerMove={onMove} />
      <div className="ctrl">
        <label>拖动画面左右移动刻度 <span className="val">{size}px</span></label>
        <input type="range" min={0} max={100} value={Math.round(side * 100)}
          onChange={(e) => setSide(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${px > 0.75 ? 'bad' : px < 0.35 ? 'good' : ''}`}>
        {px > 0.75 ? '边长翻倍，格子数接近四倍——高分辨率贵就贵在这里。'
          : px < 0.35 ? '低分辨率格子少、算得快，但细节还没出来。'
          : '格子数随边长平方增长，这正是“先低清后高清”能省算力的原因。'}
      </div>
    </div>
  );
};

/* ---------- 3. 三阶段推进（真实论文图：Figure 3 的低清 / 超分 / 精修） ---------- */
// 图片全部取自论文 Figure 3（Qwen-Image，1024×1024），不做任何加工。
// 面板映射取自 PDF 版面几何，不是肉眼估的：行标签 SR 在 y≈119.7（上）、High Resolution
// Refine 在 y≈196.8（下）；列 x≈223.4 / 301.2 / 378.9 / 456.7 依次是
// Interpolate / SwinIR / OSEDiff / Real-ESRGAN。
// 低清面板原生 512×512，论文排版时把它放大到与其它列同尺寸展示，这里照做并标出原生尺寸。
// 用 DOM <img> 而不是 canvas：真照片不能被横向压扁（canvas 目前会被容器压到 79% 宽）。
const SR_METHODS = [
  { key: 'interp', t: '插值', sr: '/images/sr/interp-sr.jpg', hr: '/images/sr/interp-hr.jpg' },
  { key: 'swinir', t: 'SwinIR', sr: '/images/sr/swinir-sr.jpg', hr: '/images/sr/swinir-hr.jpg' },
  { key: 'osediff', t: 'OSEDiff', sr: '/images/sr/osediff-sr.jpg', hr: '/images/sr/osediff-hr.jpg' },
  { key: 'realesrgan', t: 'Real-ESRGAN', sr: '/images/sr/real-esrgan-sr.jpg', hr: '/images/sr/real-esrgan-hr.jpg' },
];
const SR_STAGE_TEXT = [
  '第 1 步 · 低清：只用少量步数在低分辨率上生成，主体结构与构图已经定下来（门脸、招牌位置、暖色调），但笔画和字还是糊的。',
  '第 2 步 · 超分：在像素空间放大到 1024×1024，补上大量高频细节。补出来的高频不一定对——把方案换成 OSEDiff，再看招牌上的小字，会出现字形错误。',
  '第 3 步 · 精修：注入低强度噪声后做高分辨率单步精修，把上一步补错的高频改回来。和第 2 步对比招牌与立牌上的小字，就能看见它纠正了什么。',
];
export const StagedSampling: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const [m, setM] = useState(3);
  const method = SR_METHODS[m];
  const panels = [
    { label: '低清', res: '原生 512 × 512', src: '/images/sr/lr-512.png' },
    { label: '超分', res: '1024 × 1024', src: method.sr },
    { label: '精修', res: '1024 × 1024', src: method.hr },
  ];
  return (
    <div id={`stage-${chapterId}-${moduleId}`}>
      <div className="stage-row">
        {panels.map((p, i) => (
          <figure key={p.label} className={`stage-cell${i === step ? ' is-active' : ''}`}>
            <figcaption>
              <b>{p.label}</b>
              <span>{p.res}</span>
            </figcaption>
            <img src={p.src} alt={`论文 Figure 3 · ${method.t} · ${p.label}`} />
          </figure>
        ))}
      </div>
      <div className="ctrl">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</button>
        <span className="val"> {step + 1} / 3 </span>
        <button onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={step === 2}>下一步</button>
        <span className="ctrl-sep" />
        {SR_METHODS.map((x, i) => (
          <button key={x.key} className={`chip ${i === m ? 'active' : ''}`} onClick={() => setM(i)}>{x.t}</button>
        ))}
      </div>
      <div className={`feedback ${step === 2 ? 'good' : ''}`}>{SR_STAGE_TEXT[step]}</div>
    </div>
  );
};

/* ---------- 4. 步长与轨迹误差（P1 滑块） ---------- */
const W4 = 1080, H4 = 280;
// 真轨迹是一段圆弧：圆心 (540, 1060)、半径 1000，张角对称 ±25°。
// 它的速度场就是这个圆上的切向旋转场 v(p) = (−(y − cy), x − cx)，|v| = R。
// 下面的折线是真正用 K 步欧拉法从同一端点积分出来的，不是画上去的：
// 圆心在画布下方、半径偏大，折线会真实地向外偏出圆弧，步数越少偏得越多。
const TR_CX = 540, TR_CY = 1060, TR_R = 1000;
const TR_A = (25 * Math.PI) / 180;
const trPoint = (phi: number): [number, number] => [
  TR_CX + TR_R * Math.sin(phi),
  TR_CY - TR_R * Math.cos(phi),
];

export const EulerTrace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [k, setK] = useState(4);
  const ref = useCanvas(W4, H4, (ctx) => {
    bg(ctx, W4, H4);
    // 真实轨迹
    ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const [X, Y] = trPoint(-TR_A + (2 * TR_A * i) / 120);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    // 欧拉折线：K 步实积分
    const h = (2 * TR_A) / k;
    const start = trPoint(-TR_A);
    let px = start[0];
    let py = start[1];
    ctx.strokeStyle = k < 6 ? C.red : C.blue; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py);
    for (let i = 0; i < k; i++) {
      const nx = px + h * -(py - TR_CY);
      const ny = py + h * (px - TR_CX);
      px = nx; py = ny;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = FONT;
    ctx.fillText('离散步数 K = ' + k, 80, 36);
    ctx.fillStyle = C.muted; ctx.font = FONT_S;
    ctx.fillText('绿：真实轨迹　蓝／红：K 步欧拉折线（实算）', 520, 36);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W4} height={H4} />
      <div className="ctrl">
        <label>采样步数 K <span className="val">{k}</span></label>
        <input type="range" min={4} max={16} value={k} onChange={(e) => setK(Number(e.target.value))} />
      </div>
      <div className={`feedback ${k < 6 ? 'bad' : k >= 12 ? 'good' : ''}`}>
        {k < 6
          ? '步数太少：每往前迈一步，折线都向外偏出圆弧一点，误差一路累加——少步数省下的时间，就是用这种偏差换的。'
          : k >= 12
            ? '步数加大，折线几乎贴着圆弧。但它只是逼近：弯曲轨迹上欧拉误差按 1/K 缩小、不会归零——这正是后面高清单步要靠“轨迹末端足够直”的原因。'
            : '步数增加，折线越来越贴近真实轨迹，偏差一路减小。'}
      </div>
    </div>
  );
};

/* ---------- 5. 噪声强度档位（P4 模式片） ---------- */
const W5 = 1080, H5 = 260;
export const NoiseChips: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [lv, setLv] = useState(1);
  const opts = [
    { t: '不加噪', s: 0, note: '超分补错的细节全部留下，且不重采样。', cls: 'bad' },
    { t: '低噪声 0.1', s: 1, note: '只抖花可疑的高频，低频结构保住——论文默认档。', cls: 'good' },
    { t: '中噪声 0.3', s: 2, note: '更多细节被抹掉，重采样代价变大。', cls: '' },
    { t: '高噪声 0.6', s: 3, note: '结构也可能被破坏，得不偿失。', cls: 'bad' },
  ];
  const ref = useCanvas(W5, H5, (ctx) => {
    bg(ctx, W5, H5);
    const amp = [1, 0.45, 0.2, 0.08][lv];
    ctx.strokeStyle = C.dark; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= 900; x++) {
      const y = 130 - Math.sin(x / 14) * 60 * amp * (0.6 + 0.4 * Math.sin(x / 90));
      x ? ctx.lineTo(60 + x, y) : ctx.moveTo(60 + x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(60, 130); ctx.lineTo(960, 130); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = FONT;
    ctx.fillText('高频波形（细节）随噪声强度被"抖平"', 60, 34);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W5} height={H5} />
      <div className="ctrl">
        {opts.map((o, i) => (
          <button key={o.t} className={`chip ${i === lv ? 'active' : ''}`} onClick={() => setLv(i)}>{o.t}</button>
        ))}
      </div>
      <div className={`feedback ${opts[lv].cls}`}>{opts[lv].note}</div>
    </div>
  );
};

/* ---------- 6. 旧法 vs MrFlow：真实耗时赛跑（P3 同步前后对比） ---------- */
const W6 = 1080, H6 = 300;
// 数据取自论文附录 E / Table 16：Qwen-Image 1024×1024、单张 A100、端到端实测。
// 正文 §3 的「up to 47 s」是 50 步 × 0.94 s 的粗估；附录 E 的实测端到端总时长是 49 s。
// 本控件统一采用附录 E 的实测口径，避免两个数混用。
const NATIVE_S = 49.2;        // 原生 50×2 NFE，实测端到端
const MRFLOW_S = 4.8;         // MrFlow 12+1，实测端到端
const RACE_REAL_SECONDS = 7;  // 把这 49.2 秒拉成 7 秒真实时间放完
const RACE_SPEED = NATIVE_S / RACE_REAL_SECONDS;
const MR_STAGES = [
  { t: '低清采样', s: 3.27, c: C.blue,
    note: '整个 MrFlow 里最贵的一段，但它已经比原生的一次高分辨率采样便宜十几倍。低清 12 步与文本编码都记在这里。' },
  { t: '像素空间超分', s: 0.18, c: C.orange,
    note: 'Real-ESRGAN 放大本身只要 0.18 秒。论文选它不是因为快，而是因为它给出的高频锐利、可修。' },
  { t: 'VAE 编解码', s: 0.26, c: C.dark,
    note: '解码 → 超分 → 编码 → 再解码，两次跨潜空间与像素空间的往返，加在一起只占全流程约 5%。' },
  { t: '高清单步', s: 1.0, c: C.purple,
    note: '真正的高分辨率计算只剩这一步。原生在这一段要花 49 秒，MrFlow 用一步做完——10 倍加速最直接的来源。' },
];

function drawRace(ctx: CanvasRenderingContext2D, el: number, sel: number) {
  bg(ctx, W6, H6);
  const AX = 210, AW = 830;
  const sp = AW / NATIVE_S;              // 赛跑区：像素 / 秒
  const mrW = MRFLOW_S * sp;
  const y1 = 58, y2 = 120, BH = 34;

  ctx.font = FONT_S; ctx.fillStyle = C.muted;
  ctx.fillText('同一起跑线 · 论文附录 E 实测', 30, 34);
  ctx.font = FONT; ctx.fillStyle = C.ink;
  ctx.fillText(el.toFixed(1) + ' s', AX + AW - 62, 34);

  // 旧法
  ctx.font = FONT; ctx.fillStyle = C.ink;
  ctx.fillText('旧法', 30, y1 + 24);
  ctx.fillStyle = C.line; ctx.fillRect(AX, y1, AW, BH);
  ctx.fillStyle = C.red; ctx.fillRect(AX, y1, Math.min(el, NATIVE_S) * sp, BH);

  // MrFlow
  ctx.font = FONT; ctx.fillStyle = C.ink;
  ctx.fillText('MrFlow', 30, y2 + 24);
  ctx.fillStyle = C.line; ctx.fillRect(AX, y2, AW, BH);
  let x = AX;
  MR_STAGES.forEach((s, i) => {
    const f = Math.max(0, Math.min(Math.min(el, MRFLOW_S) - (x - AX) / sp, s.s));
    if (f > 0) {
      ctx.fillStyle = s.c;
      ctx.globalAlpha = el >= MRFLOW_S && i !== sel ? 0.45 : 1;
      ctx.fillRect(x, y2, f * sp, BH);
      ctx.globalAlpha = 1;
    }
    x += s.s * sp;
  });
  if (el >= MRFLOW_S) {
    ctx.font = FONT_S; ctx.fillStyle = C.green;
    ctx.fillText('4.8 s 跑完，停在终点', AX + mrW + 12, y2 + 24);
  }
  if (el >= NATIVE_S) {
    ctx.font = FONT_S; ctx.fillStyle = C.red;
    ctx.fillText('跑完 49 s', AX + AW - 88, y1 - 8);
  }

  // 分阶段区（同宽度放大到 4.8 s 满刻度）
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(30, 190); ctx.lineTo(1050, 190); ctx.stroke();
  ctx.font = FONT_S; ctx.fillStyle = C.muted;
  ctx.fillText('MrFlow 12+1 分阶段耗时（0 – 4.8 s，同宽度放大）', 30, 214);
  const y3 = 226, h3 = 46;
  const bsp = AW / MRFLOW_S;
  let bx = AX;
  MR_STAGES.forEach((s, i) => {
    const w = s.s * bsp;
    ctx.fillStyle = s.c;
    ctx.globalAlpha = i === sel ? 1 : 0.55;
    ctx.fillRect(bx, y3, w, h3);
    ctx.globalAlpha = 1;
    if (i === sel) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.strokeRect(bx, y3, w, h3); }
    if (w > 150) {
      ctx.fillStyle = '#ffffff'; ctx.font = FONT_S;
      ctx.fillText(s.s.toFixed(2) + ' s', bx + 12, y3 + 29);
    }
    bx += w;
  });
}

export const CompareNav: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const elapsedRef = useRef(0);
  const rafRef = useRef(0);
  const selRef = useRef(0);
  const mrDoneRef = useRef(false);
  const [phase, setPhase] = useState(0); // 0 未开始, 1 进行中, 2 已跑完
  const [sel, setSel] = useState(0);
  const [mrDone, setMrDone] = useState(false);
  selRef.current = sel;

  const paint = () => {
    const ctx = ctxRef.current;
    if (ctx) drawRace(ctx, elapsedRef.current, selRef.current);
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!ctxRef.current) {
      try { ctxRef.current = setupCanvas(canvas, W6, H6); } catch { return; }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    }
    paint();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => { paint(); }, [sel]);

  const start = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    mrDoneRef.current = false;
    setMrDone(false);
    setPhase(1);
    let prev = performance.now();
    const tick = (ts: number) => {
      elapsedRef.current = Math.min(
        elapsedRef.current + Math.min((ts - prev) / 1000, 0.05) * RACE_SPEED,
        NATIVE_S
      );
      prev = ts;
      if (!mrDoneRef.current && elapsedRef.current >= MRFLOW_S) {
        mrDoneRef.current = true;
        setMrDone(true);
      }
      paint();
      if (elapsedRef.current >= NATIVE_S) { rafRef.current = 0; setPhase(2); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W6} height={H6} />
      <div className="ctrl">
        <button onClick={start}>{phase === 0 ? '开始比较' : '重新比较'}</button>
        {phase > 0
          ? MR_STAGES.map((s, i) => (
              <button key={s.t} className={`chip ${i === sel ? 'active' : ''}`} onClick={() => setSel(i)}>
                {s.t}
              </button>
            ))
          : null}
      </div>
      <div className={`feedback ${phase === 2 ? 'good' : ''}`}>
        {phase === 0
          ? '点“开始比较”：两条路线从 0 秒同时起跑，时间按论文附录 E 的实测时长推进。'
          : phase === 1
            ? mrDone
              ? '右边（MrFlow）已经跑完停在 4.8 秒的终点，左边还在爬——这就是“同样画质、时间十分之一”被拉成真实秒数的样子。'
              : '两条路线同时起跑：左边全程高分辨率，右边走低清 → 超分 → 编解码 → 高清单步。'
            : `论文附录 E 实测：旧法 49.2 秒，MrFlow 12+1 共 4.8 秒，10.35×。${MR_STAGES[sel].t}：${MR_STAGES[sel].note}`}
      </div>
    </div>
  );
};

/* ---------- 7. 画质—速度权衡（P4 模式片 + 条形） ---------- */
const W7 = 1080, H7 = 280;
export const TradeoffBars: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState(0);
  // 数据取自论文 Table 1 的 Qwen-Image 列：Geneval 绝对分（原生 50×2 为 0.88），
  // 加速比按 26× 归一化以便同一坐标下比较。
  const data = [
    { t: '原生 50 步', q: 0.88, s: 1 / 26, note: '基准：画质最高，但一步都不省。', cls: '' },
    { t: 'MrFlow 20+1', q: 0.87, s: 6.98 / 26, note: 'Geneval 0.87、6.98×：画质几乎不动，先要速度就从这里开始。', cls: 'good' },
    { t: 'MrFlow 12+1', q: 0.86, s: 10.3 / 26, note: 'Geneval 0.86、10.3×：论文主推档，用 0.02 分换回 10 倍速度。', cls: 'good' },
    { t: '特征缓存 9.34×', q: 0.09, s: 9.34 / 26, note: '同一量级的加速比，Geneval 却从 0.88 崩到 0.09，DPG 掉到 17.43。', cls: 'bad' },
  ];
  const ref = useCanvas(W7, H7, (ctx) => {
    bg(ctx, W7, H7);
    ctx.fillStyle = C.ink; ctx.font = FONT;
    ctx.fillText('画质（Geneval，越高越好）', 70, 36);
    ctx.fillText('加速比', 620, 36);
    data.forEach((d, i) => {
      const y = 70 + i * 52;
      const on = i === mode;
      ctx.fillStyle = on ? (d.cls === 'bad' ? C.red : C.green) : C.light;
      ctx.fillRect(70, y, d.q * 440, 24);
      ctx.fillStyle = on ? C.blue : C.light;
      ctx.fillRect(620, y, d.s * 380, 24);
      ctx.fillStyle = C.ink; ctx.font = FONT_S;
      ctx.fillText(d.t, 70, y - 6);
    });
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W7} height={H7} />
      <div className="ctrl">
        {data.map((d, i) => (
          <button key={d.t} className={`chip ${i === mode ? 'active' : ''}`} onClick={() => setMode(i)}>{d.t}</button>
        ))}
      </div>
      <div className={`feedback ${data[mode].cls}`}>{data[mode].note}</div>
    </div>
  );
};

/* ---------- 8. 管线热点（P5 点击热点） ---------- */
const W8 = 1080, H8 = 180;
// 七步与论文 Figure 2 的管线一一对应。space 标出这一步发生在哪个空间，
// res 标出它处在低清还是高清（第 3 步的超分正是低清→高清的交接点）。
// 两次「潜空间 ↔ 像素空间」的往返分别落在第 2 步（解码）与第 4 步（编码）上。
const PIPE = [
  { t: '低清潜空间采样', short: '低清采样', space: 'latent', res: '低清',
    d: '用较少步数在低分辨率上生成主体结构，token 少、每步便宜。' },
  { t: 'VAE 解码', short: 'VAE 解码', space: 'l2p', res: '低清',
    d: '把低清潜表示还原成真正的低分辨率图像——第一次跨出潜空间。' },
  { t: '像素空间超分', short: '像素超分', space: 'pixel', res: '低清 → 高清',
    d: '用预训练 GAN 超分在像素上放大，保住结构、补上高频。低清与高清在这里交接。' },
  { t: 'VAE 编码', short: 'VAE 编码', space: 'p2l', res: '高清',
    d: '把放大后的图重新压回潜空间，顺带削掉过强的高频——第二次跨界。' },
  { t: '注入低强度噪声', short: '注入噪声', space: 'latent', res: '高清',
    d: '只抖花可疑的高频，让下一步能按高清先验重新生成。' },
  { t: '高分辨率单步采样', short: '高清单步', space: 'latent', res: '高清',
    d: '轨迹接近干净图像端、更直，一两步即可精修完成。' },
  { t: 'VAE 解码出图', short: '解码出图', space: 'l2p', res: '高清',
    d: '输出最终高分辨率图像。' },
];
const SPACE_TONE: Record<string, string> = { latent: '#b8c9a7', pixel: '#d7deea' };
const SPACE_TEXT: Record<string, string> = {
  latent: '潜空间', pixel: '像素空间', l2p: '潜 → 像', p2l: '像 → 潜',
};

export const PipelineMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [sel, setSel] = useState(0);
  const ref = useCanvas(W8, H8, (ctx) => {
    bg(ctx, W8, H8);
    const x0 = 12, CW = 132, GAP = 22, TOP = 20, CH = 78, SY = 110, SH = 26;
    const cellX = (i: number) => x0 + i * (CW + GAP);

    // 阶段之间的连接箭头
    for (let i = 0; i < PIPE.length - 1; i++) {
      const xa = cellX(i) + CW, xb = xa + GAP, y = TOP + CH / 2;
      ctx.strokeStyle = C.dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xa + 3, y); ctx.lineTo(xb - 7, y); ctx.stroke();
      ctx.fillStyle = C.dark;
      ctx.beginPath();
      ctx.moveTo(xb - 1, y); ctx.lineTo(xb - 9, y - 5); ctx.lineTo(xb - 9, y + 5);
      ctx.closePath(); ctx.fill();
    }

    PIPE.forEach((s, i) => {
      const x = cellX(i);
      const on = i === sel;
      // 单元格：选中填蓝，其余白底细框
      ctx.fillStyle = on ? C.blue : '#ffffff';
      ctx.fillRect(x, TOP, CW, CH);
      ctx.strokeStyle = on ? C.blue : C.line; ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, TOP + 1, CW - 2, CH - 2);
      // 序号
      ctx.fillStyle = on ? '#ffffff' : C.muted;
      ctx.font = FONT_S;
      ctx.fillText(String(i + 1), x + 8, TOP + 20);
      // 分辨率
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(s.res, x + 8, TOP + 72);
      // 步骤名
      ctx.font = '16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = on ? '#ffffff' : C.ink;
      ctx.fillText(s.short, x + 8, TOP + 46);

      // 空间条：跨界的那两步左右各半种颜色，中间一道竖线
      const halves: Record<string, [string, string]> = {
        latent: [SPACE_TONE.latent, SPACE_TONE.latent],
        pixel: [SPACE_TONE.pixel, SPACE_TONE.pixel],
        l2p: [SPACE_TONE.latent, SPACE_TONE.pixel],
        p2l: [SPACE_TONE.pixel, SPACE_TONE.latent],
      };
      const [a, b] = halves[s.space];
      ctx.fillStyle = a; ctx.fillRect(x, SY, CW / 2, SH);
      ctx.fillStyle = b; ctx.fillRect(x + CW / 2, SY, CW / 2, SH);
      if (s.space === 'l2p' || s.space === 'p2l') {
        ctx.strokeStyle = C.route; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + CW / 2, SY - 3); ctx.lineTo(x + CW / 2, SY + SH + 3); ctx.stroke();
      }
      ctx.fillStyle = C.ink; ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(SPACE_TEXT[s.space], x + 8, SY + 18);
    });

    ctx.fillStyle = C.muted; ctx.font = FONT_S;
    ctx.fillText('两次跨界：第 2 步解码离开潜空间，第 4 步编码回到潜空间', x0, SY + SH + 26);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W8} height={H8} />
      <div className="ctrl">
        {PIPE.map((s, i) => (
          <button key={s.t} className={`chip ${i === sel ? 'active' : ''}`} onClick={() => setSel(i)}>{i + 1}</button>
        ))}
      </div>
      <div className="feedback">
        {PIPE[sel].t}（{SPACE_TEXT[PIPE[sel].space]} · {PIPE[sel].res}）：{PIPE[sel].d}
      </div>
    </div>
  );
};

/* ---------- 10. 低清阶段的两个加速来源（P4 模式片） ---------- */
const W10 = 1080, H10 = 300;
export const LrSources: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState(0);
  // 三档只切换「成本构成」，数字口径见各档 note（均出自论文 3.1 节的 Analysis）。
  const modes = [
    {
      t: '原生高清直出', perStep: 1, steps: 50, total: 1,
      note: '基准：每步都在全量 token 上算，50 步、单步最贵。',
      cls: '',
    },
    {
      t: '只降分辨率', perStep: 0.25, steps: 50, total: 0.25,
      note: '来源一：单步成本几乎随 token 数线性增长。每边缩一半，token 降到约 1/4，综合约 4×——这一步不用改步数。',
      cls: 'good',
    },
    {
      t: '低清 + 少步', perStep: 0.25, steps: 13, total: 0.065,
      note: '来源二：低清本身需要的步数也更少。等步数预算下 10 低清 + 1 高清已优于 11 步直接高清，延迟减半以上且 CLIP 更高；论文 12+1 在 Qwen-Image 上实测 10.3×。',
      cls: 'good',
    },
  ];
  const m = modes[mode];
  const ref = useCanvas(W10, H10, (ctx) => {
    bg(ctx, W10, H10);
    const bx = 300, bw = 700;
    ctx.fillStyle = C.ink; ctx.font = FONT;
    // 每步成本
    ctx.fillText('每步成本', 40, 74);
    ctx.fillStyle = C.light; ctx.fillRect(bx, 52, bw, 30);
    ctx.fillStyle = mode === 0 ? C.red : C.blue;
    ctx.fillRect(bx, 52, bw * m.perStep, 30);
    // 步数
    ctx.fillStyle = C.ink; ctx.fillText('采样步数', 40, 144);
    ctx.fillStyle = C.light; ctx.fillRect(bx, 122, bw, 30);
    ctx.fillStyle = mode === 0 ? C.red : C.blue;
    ctx.fillRect(bx, 122, bw * Math.min(m.steps / 50, 1), 30);
    // 总时间
    ctx.fillStyle = C.ink; ctx.fillText('总时间', 40, 214);
    ctx.fillStyle = C.light; ctx.fillRect(bx, 192, bw, 30);
    ctx.fillStyle = mode === 0 ? C.red : C.green;
    ctx.fillRect(bx, 192, bw * m.total, 30);
    ctx.fillStyle = C.muted; ctx.font = FONT_S;
    ctx.fillText('绿：论文方法　红：原生', bx, 250);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W10} height={H10} />
      <div className="ctrl">
        {modes.map((o, i) => (
          <button key={o.t} className={`chip ${i === mode ? 'active' : ''}`} onClick={() => setMode(i)}>{o.t}</button>
        ))}
      </div>
      <div className={`feedback ${m.cls}`}>{m.note}</div>
    </div>
  );
};

/* ---------- 11. 超分方案选择（P4 模式片 + 论文指标对照） ---------- */
const W11 = 1080, H11 = 320;
export const SrChoices: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState(3);
  // 数字全部取自论文 Table 3（Qwen-Image，1024×1024，(12,1)×2 配置），不做任何加工。
  // 这个控件要看的正是左右两列的对比：加速比差得很开，Geneval 却几乎打平（0.85–0.87）。
  // 论文 4.4 节就是这个意思——自动指标对局部高频缺陷不敏感，选型依据只能在 Figure 3 的肉眼对比里。
  const opts = [
    { t: '插值', sp: 10.7, gen: 0.87, note: '插值：加速比不低，但高频被系统性衰减，放大后始终发糊（论文 Figure 3 第一行）。' },
    { t: 'SwinIR', sp: 4.67, gen: 0.86, note: 'SwinIR：同样残留模糊，而且自身太慢，端到端加速比只剩 4.67×。' },
    { t: 'OSEDiff', sp: 9.45, gen: 0.85, note: 'OSEDiff：自动指标只低一点点，肉眼上放大后会出现字形错误。' },
    { t: 'Real-ESRGAN', sp: 10.3, gen: 0.86, note: 'Real-ESRGAN：在清晰度、语义准确度与效率之间最平衡，论文最终选它。' },
  ];
  const o = opts[mode];
  const ref = useCanvas(W11, H11, (ctx) => {
    bg(ctx, W11, H11);
    ctx.fillStyle = C.ink; ctx.font = FONT;
    ctx.fillText('加速比（论文 Table 3）', 40, 40);
    ctx.fillText('Geneval（同一张表）', 700, 40);
    ctx.fillStyle = C.muted; ctx.font = FONT_S;
    ctx.fillText('左列差得很开，右列几乎打平', 40, 64);
    const maxSp = 12;
    opts.forEach((p, i) => {
      const y = 92 + i * 50;
      const on = i === mode;
      ctx.fillStyle = on ? C.ink : C.muted; ctx.font = FONT_S;
      ctx.fillText(p.t, 40, y + 19);
      // 加速比
      ctx.fillStyle = C.line; ctx.fillRect(190, y, 420, 26);
      ctx.fillStyle = p.t === 'Real-ESRGAN' ? C.green : C.blue;
      ctx.globalAlpha = on ? 1 : 0.55;
      ctx.fillRect(190, y, (p.sp / maxSp) * 420, 26);
      // Geneval
      ctx.fillStyle = C.line; ctx.fillRect(700, y, 280, 26);
      ctx.fillStyle = on ? C.orange : C.light;
      ctx.fillRect(700, y, p.gen * 280, 26);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.ink; ctx.font = FONT_S;
      ctx.fillText(p.sp.toFixed(2) + '×', 618, y + 19);
      ctx.fillText(p.gen.toFixed(2), 988, y + 19);
    });
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W11} height={H11} />
      <div className="ctrl">
        {opts.map((p, i) => (
          <button key={p.t} className={`chip ${i === mode ? 'active' : ''}`} onClick={() => setMode(i)}>{p.t}</button>
        ))}
      </div>
      <div className={`feedback ${mode === 3 ? 'good' : ''}`}>
        {o.note + (mode === 3
          ? ' 右列四个方案的 Geneval 是 0.87／0.86／0.85／0.86——自动指标几乎打平，区别只在肉眼可见的局部高频缺陷上。'
          : '')}
      </div>
    </div>
  );
};
const W9 = 1080, H9 = 300;
export const SpeedupRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (t === 0) return;
    const id = window.setInterval(() => setT((v) => Math.min(v + 0.06, 1)), 60);
    return () => window.clearInterval(id);
  }, [t]);
  // 以下数字统一取自论文 Table 1/Table 2 的 Qwen-Image 列（1024×1024，A100，端到端口径），
  // 不混用 FLUX.1-dev 的数值，避免不同协议相加。
  const rows = [
    { t: 'RALU', v: 5.85, c: C.orange },
    { t: 'SPEED', v: 6.29, c: C.orange },
    { t: 'MrFlow 20+1', v: 6.98, c: C.green },
    { t: 'MrFlow 12+1', v: 10.3, c: C.green },
    { t: 'MrFlow† （配 Pi-Flow）', v: 25.1, c: C.purple },
  ];
  const ref = useCanvas(W9, H9, (ctx) => {
    bg(ctx, W9, H9);
    const max = 26;
    rows.forEach((r, i) => {
      const y = 46 + i * 48;
      ctx.fillStyle = r.c;
      ctx.fillRect(220, y, Math.min(r.v / max, 1) * 780 * Math.max(t, 0.001), 28);
      ctx.fillStyle = C.ink; ctx.font = FONT_S;
      ctx.fillText(r.t, 30, y + 20);
      ctx.fillText(r.v.toFixed(1) + '×', 240 + Math.min(r.v / max, 1) * 780 * Math.max(t, 0.001) + 10, y + 20);
    });
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W9} height={H9} />
      <div className="ctrl">
        <button onClick={() => { setT(0); window.setTimeout(() => setT(0.001), 30); }}>开始比较</button>
      </div>
      <div className={`feedback ${t >= 1 ? 'good' : ''}`}>
        {t === 0 ? '点"开始比较"，看各方法在同一张考卷上的加速比。'
          : t < 1 ? '条形按论文报告的加速比生长……'
          : '同为 Qwen-Image 口径：免训练的 MrFlow 12+1 达 10.3×；再叠加已蒸馏好的 Pi-Flow 权重（MrFlow†）到 25.1×，OneIG-Bench 损失不超过 1%。'}
      </div>
    </div>
  );
};
