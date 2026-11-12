// ============================================================================
//  全屏电影感背景层（只在模块加载时安装一次）：
//  摇曳的体积光束 + 有景深的漂浮微尘 + 跟随鼠标的柔光 + 暗角。
//  画布固定在页面最底层，pointer-events: none，不影响任何交互。
// ============================================================================

let installed = false;

export function installCinema() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const canvas = document.createElement('canvas');
  canvas.className = 'cinema-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const still = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  window.addEventListener('resize', resize);

  const mouse = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / Math.max(1, W);
    mouse.ty = e.clientY / Math.max(1, H);
  });

  const rnd = (s: number) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const DUST = Array.from({ length: 150 }, (_, i) => ({
    x: rnd(i),
    y: rnd(i + 0.5),
    z: 0.25 + rnd(i + 0.25) * 0.75, // 景深：越大越近、越亮、越快
    tw: rnd(i + 0.75) * Math.PI * 2,
    warm: rnd(i + 0.33) > 0.7,
  }));
  const BEAMS = [
    { x: 0.18, sway: 0.09, speed: 0.13, w: 0.2, col: [255, 236, 200], a: 0.075 },
    { x: 0.52, sway: 0.06, speed: 0.09, w: 0.26, col: [150, 195, 255], a: 0.06 },
    { x: 0.84, sway: 0.1, speed: 0.11, w: 0.18, col: [255, 205, 150], a: 0.065 },
  ];

  let last = performance.now();
  const t0 = last;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    if (now - last < 30) return; // ~30 fps 足够背景使用
    last = now;
    const t = still ? 3 : (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 体积光束
    ctx.globalCompositeOperation = 'lighter';
    for (const b of BEAMS) {
      const top = b.x * W;
      const bottomX = top + Math.sin(t * b.speed * 2 * Math.PI * 0.35 + b.x * 9) * b.sway * W * 2.2;
      const half = b.w * W * 0.5;
      const g = ctx.createLinearGradient(top, 0, bottomX, H);
      const [r, gg, bb] = b.col;
      const flick = 0.85 + 0.15 * Math.sin(t * 1.7 + b.x * 20);
      g.addColorStop(0, `rgba(${r},${gg},${bb},${b.a * 1.6 * flick})`);
      g.addColorStop(0.6, `rgba(${r},${gg},${bb},${b.a * 0.5 * flick})`);
      g.addColorStop(1, `rgba(${r},${gg},${bb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(top - 10, -10);
      ctx.lineTo(top + 10, -10);
      ctx.lineTo(bottomX + half, H + 10);
      ctx.lineTo(bottomX - half, H + 10);
      ctx.closePath();
      ctx.fill();
    }

    // 跟随鼠标的柔光
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    const mx = mouse.x * W;
    const my = mouse.y * H;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(W, H) * 0.28);
    mg.addColorStop(0, 'rgba(255,225,170,0.10)');
    mg.addColorStop(0.5, 'rgba(120,160,255,0.035)');
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, W, H);

    // 漂浮微尘（近处的会轻微视差跟随鼠标）
    for (const d of DUST) {
      const px = ((d.x + t * 0.004 * d.z + (mouse.x - 0.5) * 0.02 * d.z) % 1 + 1) % 1;
      const py = ((d.y - t * 0.012 * d.z + (mouse.y - 0.5) * 0.02 * d.z) % 1 + 1) % 1;
      const x = px * W;
      const y = py * H;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + d.z) + d.tw);
      const a = (0.08 + 0.3 * d.z) * tw;
      const r = 0.6 + d.z * 1.8;
      ctx.fillStyle = d.warm ? `rgba(255,214,150,${a})` : `rgba(190,215,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (d.z > 0.85) {
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
        gl.addColorStop(0, d.warm ? `rgba(255,200,120,${a * 0.4})` : `rgba(150,190,255,${a * 0.4})`);
        gl.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
      }
    }

    // 暗角
    ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}
