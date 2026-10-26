import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 / 模块 1.1：四条现成路线，各自牺牲一边。
// 唯一主操作：点 chip 选方法。两条准确率条在 400ms 内缓动到新长度，
// 右侧网络行按方法换色（灰=冻结，红=被改坏，蓝=有旧数据时照常更新）。
const W = 1080;
const H = 280;

type Method = 'fe' | 'ft' | 'ftfc' | 'joint';

const OLD: Record<Method, number> = { fe: 57.0, ft: 50.9, ftfc: 54.9, joint: 55.3 };
const NEW: Record<Method, number> = { fe: 52.5, ft: 57.0, ftfc: 53.8, joint: 56.6 };
const ORDER: Method[] = ['fe', 'ft', 'ftfc', 'joint'];
const NAME: Record<Method, string> = {
  fe: '特征提取',
  ft: '微调',
  ftfc: '微调 FC',
  joint: '联合训练',
};

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  axis: '#d7deea',
  ink: '#21324a',
  track: 'rgba(255,255,255,0.78)',
  wire: '#c9cdd6',
  lock: '#e8eaf0',
};

// 网络行 9 个色块：conv1–conv5、fc6、fc7、fc8（旧类头）、新头（虚线框）
const FILLS: Record<Method, string[]> = {
  fe: [C.lock, C.lock, C.lock, C.lock, C.lock, C.lock, C.lock, C.lock, C.green],
  ft: [C.red, C.red, C.red, C.red, C.red, C.red, C.red, C.red, C.green],
  ftfc: [C.lock, C.lock, C.lock, C.lock, C.lock, C.red, C.red, C.red, C.green],
  joint: [C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.blue, C.green],
};

const FEEDBACK: Record<Method, { text: string; cls: string }> = {
  fe: {
    text: '共享层冻着不动，旧任务几乎不掉（57.0），可新任务只有 52.5 —— 旧特征不够用。',
    cls: 'bad',
  },
  ft: {
    text: '新任务到了 57.0，旧任务却掉到 50.9 —— 共享层被改坏了。',
    cls: 'bad',
  },
  ftfc: {
    text: '只调顶层：旧任务保住 54.9，新任务却只到 53.8 —— 学不深。',
    cls: 'bad',
  },
  joint: {
    text: '两边都好看（55.3 / 56.6），但它用了旧任务的图片和标签 —— 我们这场里没有这份数据。',
    cls: '',
  },
};

const AX0 = 180;
const AX1 = 650;
const VMIN = 40;
const VMAX = 60;
const TICKS = [50, 55, 60];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function xOf(v: number) {
  return AX0 + ((clamp(v, VMIN, VMAX) - VMIN) / (VMAX - VMIN)) * (AX1 - AX0);
}

function scene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // 茶桌：底板下方的一条桌面，全篇共用
  ctx.fillStyle = C.table;
  ctx.fillRect(0, 250, W, 30);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(W, 250);
  ctx.stroke();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 278);
  ctx.lineTo(W, 278);
  ctx.stroke();
}

function grid(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  TICKS.forEach((v) => {
    const x = xOf(v);
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, 196);
    ctx.stroke();
  });
  ctx.restore();
}

function bar(ctx: CanvasRenderingContext2D, y: number, value: number, color: string) {
  roundRect(ctx, AX0, y, AX1 - AX0, 24, 12);
  ctx.fillStyle = C.track;
  ctx.fill();
  const w = Math.max(10, xOf(value) - AX0);
  roundRect(ctx, AX0, y, w, 24, 12);
  ctx.fillStyle = color;
  ctx.fill();
  // 结果值只写裸数字
  ctx.fillStyle = C.ink;
  ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value.toFixed(1), AX0 + w + 10, y + 18);
}

function network(ctx: CanvasRenderingContext2D, method: Method, from: Method, k: number) {
  const fromFills = FILLS[from];
  const toFills = FILLS[method];
  const fills = toFills.map((c, i) => lerpColor(fromFills[i], c, k));
  const boxes = [
    { x: 700, y: 107, w: 26, h: 26 },
    { x: 734, y: 107, w: 26, h: 26 },
    { x: 768, y: 107, w: 26, h: 26 },
    { x: 802, y: 107, w: 26, h: 26 },
    { x: 836, y: 107, w: 26, h: 26 },
    { x: 880, y: 99, w: 30, h: 42 },
    { x: 918, y: 99, w: 30, h: 42 },
    { x: 956, y: 99, w: 30, h: 42 },
    { x: 996, y: 96, w: 40, h: 48 },
  ];
  const head = boxes.length - 1;
  // 连接线
  ctx.strokeStyle = C.wire;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < head; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    ctx.beginPath();
    ctx.moveTo(a.x + a.w, a.y + a.h / 2);
    ctx.lineTo(b.x, b.y + b.h / 2);
    ctx.stroke();
  }
  boxes.forEach((b, i) => {
    if (i === head) {
      // 新头：虚线空框，表示新加出来、还没热身的那只杯子
      ctx.save();
      roundRect(ctx, b.x, b.y, b.w, b.h, 6);
      ctx.fillStyle = 'rgba(34,141,92,0.16)';
      ctx.fill();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = fills[i];
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }
    roundRect(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.fillStyle = fills[i];
    ctx.fill();
    ctx.strokeStyle = 'rgba(33,50,74,0.18)';
    ctx.lineWidth = 1;
    roundRect(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.stroke();
  });
  // 区域分隔
  ctx.save();
  ctx.strokeStyle = '#e3e7ee';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(676, 60);
  ctx.lineTo(676, 208);
  ctx.stroke();
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  s: { method: Method; from: Method; oldV: number; newV: number; k: number }
) {
  scene(ctx);
  grid(ctx);
  bar(ctx, 78, s.oldV, C.blue);
  bar(ctx, 140, s.newV, C.green);
  // canvas 内文字共两处
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = C.blue;
  ctx.fillText('旧任务', 64, 96);
  ctx.fillStyle = C.green;
  ctx.fillText('新任务', 64, 158);
  network(ctx, s.method, s.from, s.k);
}

export const M1Methods: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg = useRef({
    method: 'fe' as Method,
    from: 'fe' as Method,
    fromOld: OLD.fe,
    fromNew: NEW.fe,
    toOld: OLD.fe,
    toNew: NEW.fe,
    t0: 0,
    dur: 0,
  });
  const [method, setMethod] = useState<Method>('fe');
  const [feedback, setFeedback] = useState(FEEDBACK.fe);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const tick = (now: number) => {
      const s = cfg.current;
      const p = s.dur > 0 ? clamp((now - s.t0) / s.dur, 0, 1) : 1;
      const k = easeOutCubic(p);
      render(ctx, {
        method: s.method,
        from: s.from,
        oldV: s.fromOld + (s.toOld - s.fromOld) * k,
        newV: s.fromNew + (s.toNew - s.fromNew) * k,
        k,
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Method) => {
    const s = cfg.current;
    const now = performance.now();
    const p = s.dur > 0 ? clamp((now - s.t0) / s.dur, 0, 1) : 1;
    const k = easeOutCubic(p);
    s.from = s.method;
    s.fromOld = s.fromOld + (s.toOld - s.fromOld) * k;
    s.fromNew = s.fromNew + (s.toNew - s.fromNew) * k;
    s.toOld = OLD[m];
    s.toNew = NEW[m];
    s.t0 = now;
    s.dur = 400;
    s.method = m;
    setMethod(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <div className="chip-row">
        {ORDER.map((m) => (
          <button
            key={m}
            className={'chip' + (method === m ? ' selected' : '')}
            aria-pressed={method === m}
            title={m === 'joint' ? '需要旧任务数据' : undefined}
            onClick={() => pick(m)}
          >
            {NAME[m]}
            {m === 'joint' ? (
              <span aria-hidden="true" style={{ color: '#c43f52', fontSize: '12px' }}>
                🔒
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M1Methods;
