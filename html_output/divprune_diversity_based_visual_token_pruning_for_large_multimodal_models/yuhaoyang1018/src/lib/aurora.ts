// ============================================================================
//  全屏背景层（冷白“晨光实验室”主题，只安装一次）：
//  缓慢漂移的极光色团（珊瑚 / 蓝紫 / 薄荷 / 丁香）+ 一片漂浮的“星座”点。
//  每隔几秒，用与 Algorithm 1 相同的 Max-Min 贪心在这些点里挑出几个最分散的，
//  用珊瑚色圆环轻轻点亮——呼应 DivPrune 的主题，但足够淡，不干扰阅读。
//  画布固定在页面最底层，pointer-events: none；减少动态效果时只画一帧静态画面。
// ============================================================================

import { FORCE_REDUCE } from './hooks';

let installed = false;

export function installAurora() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const canvas = document.createElement('canvas');
  canvas.className = 'aurora-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 订阅系统偏好：运行中切换“减少动态效果”无需刷新即可停止 / 恢复背景运动
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let still = FORCE_REDUCE || !!mq?.matches;
  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  };
  resize();

  const mouse = { x: 0.7, y: 0.25, tx: 0.7, ty: 0.25 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / Math.max(1, W);
    mouse.ty = e.clientY / Math.max(1, H);
  });

  const rnd = (s: number) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  // 极光色团：中心沿李萨如曲线缓慢漂移
  const BLOBS = [
    { x: 0.82, y: 0.12, ax: 0.1, ay: 0.08, sp: 0.05, r: 0.55, col: [255, 120, 92], a: 0.2 },
    { x: 0.12, y: 0.35, ax: 0.08, ay: 0.12, sp: 0.04, r: 0.6, col: [104, 124, 255], a: 0.17 },
    { x: 0.55, y: 0.95, ax: 0.14, ay: 0.06, sp: 0.035, r: 0.55, col: [64, 210, 180], a: 0.12 },
    { x: 0.35, y: 0.05, ax: 0.12, ay: 0.05, sp: 0.045, r: 0.45, col: [178, 132, 255], a: 0.1 },
  ];
  // 星座点：在 [0,1]² 里缓慢漂移（环绕）
  const NP = 44;
  const PTS = Array.from({ length: NP }, (_, i) => ({
    x: rnd(i),
    y: rnd(i + 0.5),
    vx: (rnd(i + 0.2) - 0.5) * 0.006,
    vy: (rnd(i + 0.7) - 0.5) * 0.006,
  }));
  const pos = (p: { x: number; y: number; vx: number; vy: number }, t: number) => ({
    x: (((p.x + p.vx * t) % 1) + 1) % 1,
    y: (((p.y + p.vy * t) % 1) + 1) % 1,
  });

  // Max-Min 贪心：先取最孤立的点，再反复取离已选集合最远的点
  const pickDiverse = (xy: { x: number; y: number }[], k: number) => {
    const d = (a: number, b: number) => Math.hypot((xy[a].x - xy[b].x) * W, (xy[a].y - xy[b].y) * H);
    let first = 0;
    let best = -1;
    for (let i = 0; i < xy.length; i++) {
      let mn = Infinity;
      for (let j = 0; j < xy.length; j++) if (i !== j) mn = Math.min(mn, d(i, j));
      if (mn > best) {
        best = mn;
        first = i;
      }
    }
    const sel = [first];
    const minD = xy.map((_, i) => d(i, first));
    while (sel.length < k) {
      let arg = -1;
      let mx = -1;
      for (let i = 0; i < xy.length; i++) {
        if (sel.includes(i)) continue;
        if (minD[i] > mx) {
          mx = minD[i];
          arg = i;
        }
      }
      sel.push(arg);
      for (let i = 0; i < xy.length; i++) minD[i] = Math.min(minD[i], d(i, arg));
    }
    return sel;
  };

  const CYCLE = 6; // 秒：每轮重新挑选一次
  let chosen: number[] = [];
  let chosenAt = -99;

  const draw = (t: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const S = Math.max(W, H);

    for (const b of BLOBS) {
      const cx = (b.x + Math.sin(t * b.sp * 2 * Math.PI) * b.ax) * W;
      const cy = (b.y + Math.cos(t * b.sp * 1.3 * 2 * Math.PI) * b.ay) * H;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * S);
      const [r, gg, bb] = b.col;
      g.addColorStop(0, `rgba(${r},${gg},${bb},${b.a})`);
      g.addColorStop(0.55, `rgba(${r},${gg},${bb},${b.a * 0.35})`);
      g.addColorStop(1, `rgba(${r},${gg},${bb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // 跟随指针的淡淡暖光
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const mg = ctx.createRadialGradient(mouse.x * W, mouse.y * H, 0, mouse.x * W, mouse.y * H, S * 0.22);
    mg.addColorStop(0, 'rgba(255,150,120,0.08)');
    mg.addColorStop(1, 'rgba(255,150,120,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, W, H);

    const xy = PTS.map((p) => pos(p, t));
    if (t - chosenAt > CYCLE || !chosen.length) {
      chosen = pickDiverse(xy, 7);
      chosenAt = t;
    }
    // 每个点连到最近邻（很淡）
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(59,91,255,0.07)';
    ctx.beginPath();
    for (let i = 0; i < NP; i++) {
      let bj = -1;
      let bv = Infinity;
      for (let j = 0; j < NP; j++) {
        if (i === j) continue;
        const v = Math.hypot((xy[i].x - xy[j].x) * W, (xy[i].y - xy[j].y) * H);
        if (v < bv) {
          bv = v;
          bj = j;
        }
      }
      if (bj >= 0 && bv < S * 0.22) {
        ctx.moveTo(xy[i].x * W, xy[i].y * H);
        ctx.lineTo(xy[bj].x * W, xy[bj].y * H);
      }
    }
    ctx.stroke();
    for (let i = 0; i < NP; i++) {
      ctx.fillStyle = 'rgba(20,28,52,0.16)';
      ctx.beginPath();
      ctx.arc(xy[i].x * W, xy[i].y * H, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // 被挑中的最分散点：依次点亮（与 Algorithm 1 的选择顺序一致），一轮结束前淡出
    const age = still ? 3 : t - chosenAt;
    chosen.forEach((i, k) => {
      const appear = Math.min(1, Math.max(0, (age - k * 0.35) / 0.6));
      const fade = Math.min(1, Math.max(0, (CYCLE - age) / 0.8));
      const a = appear * fade;
      if (a <= 0) return;
      const x = xy[i].x * W;
      const y = xy[i].y * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
      g.addColorStop(0, `rgba(255,90,60,${0.22 * a})`);
      g.addColorStop(1, 'rgba(255,90,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 26, y - 26, 52, 52);
      ctx.strokeStyle = `rgba(255,90,60,${0.45 * a})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 5 + 3 * (1 - appear), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,90,60,${0.55 * a})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  window.addEventListener('resize', () => {
    resize();
    if (still) draw(3);
  });
  mq?.addEventListener?.('change', () => {
    still = FORCE_REDUCE || mq.matches;
    if (still) draw(3);
  });
  if (still) draw(3);
  let last = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (still || document.hidden || now - last < 33) return; // 约 30 fps 足够背景使用
    last = now;
    draw((now - t0) / 1000);
  };
  requestAnimationFrame(frame);
}
