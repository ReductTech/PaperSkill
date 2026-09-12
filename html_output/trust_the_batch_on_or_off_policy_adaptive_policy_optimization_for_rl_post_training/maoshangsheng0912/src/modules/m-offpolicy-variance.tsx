import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 5 章模块：离策略数据无偏但方差会炸（P6 拖拽探索 + P1 联动）。
// 主体：一批估计值散点。动词：被拖动的「离策略程度」把手推开。
// 目标：看清「均值始终钉在真值上（无偏），但分散度爆炸（高方差）」。
// 交互：直接拖动画布上的橙色把手（也可用滑块 / 键盘微调）。
// 语义色：蓝 = 单次估计；绿 = 真值；红 = 极端估计；橙 = 用户拖动的程度。
const W = 1080;
const H = 280;

// 固定伪随机序列，保证同一 drag 值下渲染完全一致
const NOISE = [
  -0.62, 0.41, -0.18, 0.88, -0.95, 0.12, 0.55, -0.33, 0.71, -0.08,
  0.29, -0.77, 0.94, -0.44, 0.06, 0.63, -0.21, 0.37, -0.85, 0.50,
  -0.13, 0.79, -0.56, 0.24, 0.02, -0.68, 0.46, -0.29, 0.85, -0.51,
  -0.05, 0.60, -0.91, 0.33, -0.40, 0.72, -0.16, 0.48, -0.73, 0.19,
  0.90, -0.36, 0.10, -0.59, 0.66, -0.24, 0.44, -0.88, 0.27, -0.02,
  1.42, -1.18, 1.65, -1.51, 1.88, -1.31, 1.22, -1.72, 1.55, -1.40,
  2.10, -1.95, 1.78, -2.24, 2.35, -1.60, 1.28, -2.05, 1.92, -1.83,
  3.15, -2.68, 3.62, -2.91, 2.74, -3.24, 3.05, -2.42, 3.88, -2.15,
  4.72, -3.55, 4.15, -4.08, 3.44, -3.85, 4.95, -3.12, 4.38, -4.55,
];

const N = 90; // 参与渲染的样本数

// 把手可拖动的范围（画布 x 坐标）
const TRACK_X1 = 120;
const TRACK_X2 = 760;
const TRACK_Y = 246;
const HANDLE_R = 11;

// 拖动值 -> 离策略程度（0..1）
const levelOf = (x: number) => Math.max(0, Math.min(1, (x - TRACK_X1) / (TRACK_X2 - TRACK_X1)));

export function MOffPolicyVariance() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [level, setLevel] = useState(0.06);
  const levelRef = useRef(level);
  const tRef = useRef(0);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);

  levelRef.current = level;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const render = () => {
      tRef.current += 1;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const lv = levelRef.current;
      // 离策略程度 -> 散点展开幅度 & ρ 分布宽度
      const spread = 0.10 + lv * lv * 1.55;

      const padL = 70;
      const padR = 300;
      const midY = 128;
      const plotW = W - padL - padR;

      // 真值参考线（绿）—— 永远不动，这就是「无偏」的视觉表达
      const trueX = padL + plotW * 0.5;
      ctx.beginPath();
      ctx.moveTo(trueX, 26);
      ctx.lineTo(trueX, 232);
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#228d5c';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('真值', trueX, 20);

      // 横轴
      ctx.beginPath();
      ctx.moveTo(padL, midY);
      ctx.lineTo(padL + plotW, midY);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 散点：每个样本的位置由噪声 × spread 决定，并带一点纵向抖动
      let sum = 0;
      let sumSq = 0;
      const xs: number[] = [];
      for (let i = 0; i < N; i++) {
        const n = NOISE[i % NOISE.length];
        const jitterX = (((i * 37) % 100) / 100 - 0.5) * 8;
        const x = trueX + n * spread * plotW * 0.2 + jitterX;
        const y = midY + (((i * 53) % 100) / 100 - 0.5) * 92;
        xs.push(x);
        sum += x;
        sumSq += x * x;
      }

      // 分散度（用于读数）：标准差相对真值的比例
      const meanX = sum / N;
      const sdX = Math.sqrt(Math.max(0, sumSq / N - meanX * meanX));
      const sdPct = (sdX / plotW) * 100;

      // 先画散点（极端点用红）
      for (let i = 0; i < N; i++) {
        const n = NOISE[i % NOISE.length];
        const jitterX = (((i * 37) % 100) / 100 - 0.5) * 8;
        const x = trueX + n * spread * plotW * 0.2 + jitterX;
        const y = midY + (((i * 53) % 100) / 100 - 0.5) * 92;
        const extreme = Math.abs(n) > 2.2;
        ctx.beginPath();
        ctx.arc(x, y, extreme ? 4.6 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = extreme ? '#c43f52' : '#27446e';
        ctx.globalAlpha = extreme ? 0.95 : 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 样本均值线（蓝）：跟着散点走，但始终紧贴真值 —— 无偏
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(meanX, 54);
      ctx.lineTo(meanX, 214);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#27446e';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('样本均值', meanX, 48);

      // —— 拖动轨道 ——
      ctx.beginPath();
      ctx.moveTo(TRACK_X1, TRACK_Y);
      ctx.lineTo(TRACK_X2, TRACK_Y);
      ctx.strokeStyle = '#e6ecdf';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 已拖过的部分用橙色
      const hx = TRACK_X1 + lv * (TRACK_X2 - TRACK_X1);
      ctx.beginPath();
      ctx.moveTo(TRACK_X1, TRACK_Y);
      ctx.lineTo(hx, TRACK_Y);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 6;
      ctx.stroke();

      // 把手（拖动焦点）
      const pulse = draggingRef.current || hoveringRef.current ? (Math.sin(t * 0.14) + 1) / 2 : 0;
      if (pulse > 0) {
        ctx.beginPath();
        ctx.arc(hx, TRACK_Y, HANDLE_R + 5 + pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240,126,71,0.18)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(hx, TRACK_Y, HANDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = '#f07e47';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 把手上的抓取提示（拖动时会变「抓手中」的样式）
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(hx - 3.5, TRACK_Y - 4);
      ctx.lineTo(hx - 3.5, TRACK_Y + 4);
      ctx.moveTo(hx + 3.5, TRACK_Y - 4);
      ctx.lineTo(hx + 3.5, TRACK_Y + 4);
      ctx.stroke();

      // 轨道两端标签
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('同一策略', TRACK_X1 - 60, TRACK_Y + 4);
      ctx.textAlign = 'right';
      ctx.fillText('离策略很远', TRACK_X2 + 60, TRACK_Y + 4);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f07e47';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillText(
        draggingRef.current ? '← 拖动我 →' : '拖动这里 →',
        (TRACK_X1 + TRACK_X2) / 2,
        TRACK_Y + 30
      );

      // —— 右侧读数 ——
      const rx = W - padR + 30;
      ctx.textAlign = 'left';

      // 偏差（|均值 − 真值|）
      const biasPct = (Math.abs(meanX - trueX) / plotW) * 100;
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('估计偏差', rx, 60);
      ctx.fillStyle = '#228d5c';
      ctx.font = '700 22px ui-monospace, monospace';
      ctx.fillText(`${biasPct.toFixed(1)}%`, rx, 88);
      ctx.fillStyle = '#228d5c';
      ctx.font = '500 10px system-ui, sans-serif';
      ctx.fillText('始终很小 —— 无偏', rx, 104);

      // 方差（分散度）
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('估计分散度', rx, 146);
      ctx.fillStyle = sdPct > 18 ? '#c43f52' : sdPct > 9 ? '#f07e47' : '#228d5c';
      ctx.font = '700 22px ui-monospace, monospace';
      ctx.fillText(`×${(sdPct / 4.6).toFixed(1)}`, rx, 174);

      // 分散度条
      const barW = 190;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx, 190, barW, 12, 6) : ctx.rect(rx, 190, barW, 12);
      ctx.fillStyle = '#e6ecdf';
      ctx.fill();
      ctx.beginPath();
      const fillW = Math.max(4, barW * Math.min(1, sdPct / 26));
      ctx.roundRect ? ctx.roundRect(rx, 190, fillW, 12, 6) : ctx.rect(rx, 190, fillW, 12);
      ctx.fillStyle = sdPct > 18 ? '#c43f52' : sdPct > 9 ? '#f07e47' : '#228d5c';
      ctx.fill();

      ctx.fillStyle = '#68778f';
      ctx.font = '500 10px system-ui, sans-serif';
      ctx.fillText(sdPct > 18 ? '方差已经压不住了' : sdPct > 9 ? '方差开始失控' : '无偏且稳定', rx, 222);

      // 顶部提示
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('拖动把手 · 把这一批数据推离同策略', padL, 18);
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // —— 指针交互：画布内拖动把手 ——
    const toCanvas = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = W / rect.width;
      const sy = H / rect.height;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    };

    const hitHandle = (x: number, y: number) => {
      const hx = TRACK_X1 + levelRef.current * (TRACK_X2 - TRACK_X1);
      // 命中区放大一些，便于抓取（含轨道整段）
      const nearHandle = Math.hypot(x - hx, y - TRACK_Y) <= HANDLE_R + 14;
      const nearTrack = Math.abs(y - TRACK_Y) <= 16 && x >= TRACK_X1 - 30 && x <= TRACK_X2 + 30;
      return nearHandle || nearTrack;
    };

    const onDown = (e: PointerEvent) => {
      const p = toCanvas(e);
      if (!hitHandle(p.x, p.y)) return;
      draggingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      setLevel(levelOf(p.x));
    };
    const onMove = (e: PointerEvent) => {
      const p = toCanvas(e);
      if (draggingRef.current) {
        setLevel(levelOf(p.x));
        return;
      }
      const hit = hitHandle(p.x, p.y);
      hoveringRef.current = hit;
      canvas.style.cursor = hit ? 'grab' : 'default';
    };
    const onUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      hoveringRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* pointer 已释放 */
      }
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', () => {
      hoveringRef.current = false;
      if (!draggingRef.current) canvas.style.cursor = 'default';
    });

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      unobserve();
      stop();
    };
  }, []);

  // 反馈文案随拖动程度实时变化
  const feedback =
    level < 0.12
      ? {
          cls: 'good',
          t: '此时 ρ ≈ 1，重要性采样几乎不起作用：估计值<b>既无偏又稳定</b>。注意绿线（真值）和蓝线（样本均值）几乎重合。',
        }
      : level < 0.45
      ? {
          cls: '',
          t: '继续往右拖。看两个读数的变化节奏：<b>偏差基本不动，分散度开始往上走</b>。这不是巧合——重要性采样在数学上是无偏的，被放大的只有方差。',
        }
      : {
          cls: 'bad',
          t: `拖到这个程度，ρ 的尾巴很长：偏差仍然只有几个百分点（无偏），但分散度已经涨到 <b>×${((0.10 + level * level * 1.55) / 0.10).toFixed(1)}</b>。这意味着——均值是对的，可你只采一次，拿到的那个值完全可能偏出很远。<b>真正要治的是方差，不是偏差。</b>`,
        };

  const setFromSlider = (v: number) => setLevel(Math.max(0, Math.min(1, v / 100)));

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-offpolicy-var" width={W} height={H} />

      <div className="ctrl">
        <label>
          离策略程度 <span className="val">{level.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(level * 100)}
          onChange={(e) => setFromSlider(Number(e.target.value))}
        />
      </div>

      <div className="chip-row">
        <button className="chip" onClick={() => setLevel(0.06)}>
          回到同策略
        </button>
        <button className="chip" onClick={() => setLevel(0.55)}>
          中等离策略
        </button>
        <button className="chip" onClick={() => setLevel(1)}>
          极端离策略
        </button>
      </div>

      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.t }} />
    </div>
  );
}
