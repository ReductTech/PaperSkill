import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 Module 4.1 — 缺失模拟器：九个 PyGrinder 函数名，同一缺失率下洞的形态各不相同。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const SUPPORT = '#92400e';
const BLUE = '#27446e';
const RED = '#c43f52';
const BORDER = '#d7deea';

type Pattern =
  | 'mcar'
  | 'mar_logistic'
  | 'mnar_x'
  | 'mnar_t'
  | 'mnar_nonuniform'
  | 'rdo'
  | 'seq_missing'
  | 'block_missing'
  | 'calc_missing_rate';

const PATTERNS: { id: Pattern; label: string; kind: 'scatter' | 'band' | 'block' | 'calc' }[] = [
  { id: 'mcar', label: 'mcar', kind: 'scatter' },
  { id: 'mar_logistic', label: 'mar_logistic', kind: 'scatter' },
  { id: 'mnar_x', label: 'mnar_x', kind: 'scatter' },
  { id: 'mnar_t', label: 'mnar_t', kind: 'scatter' },
  { id: 'mnar_nonuniform', label: 'mnar_nonuniform', kind: 'scatter' },
  { id: 'rdo', label: 'rdo', kind: 'scatter' },
  { id: 'seq_missing', label: 'seq_missing', kind: 'band' },
  { id: 'block_missing', label: 'block_missing', kind: 'block' },
  { id: 'calc_missing_rate', label: 'calc_missing_rate', kind: 'calc' },
];

type Hole = { x: number; y: number; w: number; h: number };

function makeHoles(pattern: Pattern, rate: number): Hole[] {
  const holes: Hole[] = [];
  const bedX = 80;
  const bedY = 96;
  const bedW = 560;
  const bedH = 62;
  const area = bedW * bedH;
  const target = area * rate;
  const spec = PATTERNS.find((p) => p.id === pattern);
  const kind = spec ? spec.kind : 'scatter';
  if (kind === 'scatter') {
    const size = 26;
    const count = Math.round(target / size);
    for (let i = 0; i < count; i++) {
      const u = ((i * 7919) % 1000) / 1000;
      const v = ((i * 104729) % 997) / 997;
      let x = bedX + u * bedW;
      // MNAR-t: missingness concentrates at the tail of the series, not around the mean
      if (pattern === 'mnar_t') x = bedX + Math.pow(u, 2.4) * bedW;
      if (pattern === 'mar_logistic' || pattern === 'mnar_x') x = bedX + Math.pow(u, 0.55) * bedW;
      const y = bedY + v * bedH;
      holes.push({ x, y, w: 7, h: 7 });
    }
    // rdo drops whole short runs
    if (pattern === 'rdo') {
      holes.length = 0;
      for (let i = 0; i < Math.round(target / 40); i++) {
        const u = ((i * 6151) % 1000) / 1000;
        holes.push({ x: bedX + u * bedW, y: bedY + 20, w: 26, h: 16 });
      }
    }
  } else if (kind === 'band') {
    const count = Math.max(1, Math.round(target / (bedH * 22)));
    for (let i = 0; i < count; i++) {
      const u = ((i * 4643) % 1000) / 1000;
      holes.push({ x: bedX + u * (bedW - 40), y: bedY, w: 34, h: bedH });
    }
  } else if (kind === 'block') {
    const count = Math.max(1, Math.round(target / (24 * 26)));
    for (let i = 0; i < count; i++) {
      const u = ((i * 3581) % 1000) / 1000;
      const v = ((i * 7717) % 1000) / 1000;
      holes.push({ x: bedX + u * (bedW - 50), y: bedY + v * (bedH - 30), w: 26, h: 24 });
    }
  }
  return holes;
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pattern: 'mcar' as Pattern, rate: 0.3 });
  const rafRef = useRef<number | null>(null);
  const [pattern, setPattern] = useState<Pattern>('mcar');
  const [rate, setRate] = useState(0.3);
  const [feedback, setFeedback] = useState({
    text: '完全随机缺失（MCAR）：每个位置被独立丢弃，与数值和时间都无关。',
    cls: '',
  });

  const describe = (p: Pattern) => {
    switch (p) {
      case 'mcar':
        return { text: '完全随机缺失（MCAR）：每个位置被独立丢弃，与数值和时间都无关。', cls: '' };
      case 'mar_logistic':
        return {
          text: '随机缺失（MAR）：是否缺失取决于已观测到的值，洞会偏向某些区域聚集。',
          cls: '',
        };
      case 'mnar_x':
      case 'mnar_t':
      case 'mnar_nonuniform':
        return {
          text: '非随机缺失（MNAR）：缺失取决于没被观测到的值本身——恰恰是异常值最容易丢，这种洞最难处理。',
          cls: 'bad',
        };
      case 'seq_missing':
        return { text: '连续段缺失：一整段时间没有数据，缺口在时间上连成一条。', cls: '' };
      case 'block_missing':
        return { text: '块状缺失：多个变量在同一段时间一起丢，缺口成块出现。', cls: '' };
      default:
        return {
          text: '这个函数不注入缺失，它只计算当前缺失率；请选择其它八种注入模式之一来改变形态。',
          cls: '',
        };
    }
  };

  const pick = (p: Pattern) => {
    stateRef.current.pattern = p;
    setPattern(p);
    setFeedback(describe(p));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { pattern: Pattern; rate: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 240, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.lineTo(W, 240);
      ctx.stroke();

      // dripper rim + bed
      ctx.strokeStyle = SUPPORT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, 62);
      ctx.lineTo(660, 62);
      ctx.lineTo(632, 166);
      ctx.lineTo(88, 166);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#6f4a2f';
      ctx.beginPath();
      ctx.moveTo(92, 160);
      ctx.lineTo(628, 160);
      ctx.lineTo(614, 140);
      ctx.lineTo(540, 124);
      ctx.lineTo(360, 118);
      ctx.lineTo(180, 128);
      ctx.lineTo(104, 144);
      ctx.closePath();
      ctx.fill();

      const holes = s.pattern === 'calc_missing_rate' ? [] : makeHoles(s.pattern, s.rate);
      ctx.fillStyle = RED;
      for (const h of holes) {
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 24, h.w / 2, h.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // spout tracing a circle on the bed
      const t = (performance.now() % 3000) / 3000;
      const ang = t * Math.PI * 2;
      const sx = 330 + Math.cos(ang) * 120;
      const sy = 128 + Math.sin(ang) * 14;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 60, sy - 60, sx + 110, sy - 84);
      ctx.stroke();
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.ellipse(sx + 140, sy - 88, 26, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // right: three-shape strip, the current one highlighted
      const stripX = 740;
      const shapes: { kind: 'scatter' | 'band' | 'block'; label: string }[] = [
        { kind: 'scatter', label: '散点' },
        { kind: 'band', label: '连续段' },
        { kind: 'block', label: '块状' },
      ];
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(stripX, 62, 280, 156);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(stripX, 62, 280, 156);
      const currentKind = (PATTERNS.find((p) => p.id === s.pattern) || PATTERNS[0]).kind;
      shapes.forEach((sh, i) => {
        const bx = stripX + 16 + i * 88;
        const by = 84;
        ctx.fillStyle = '#6f4a2f';
        ctx.fillRect(bx, by, 72, 62);
        ctx.fillStyle = RED;
        if (sh.kind === 'scatter') {
          for (let k = 0; k < 12; k++) {
            ctx.beginPath();
            ctx.arc(bx + 8 + ((k * 23) % 60), by + 8 + ((k * 41) % 48), 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (sh.kind === 'band') {
          ctx.fillRect(bx + 18, by, 14, 62);
        } else {
          ctx.fillRect(bx + 10, by + 14, 34, 32);
        }
        ctx.fillStyle = currentKind === sh.kind ? BLUE : '#68778f';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(sh.label, bx + 12, by + 84);
        if (currentKind === sh.kind) {
          ctx.strokeStyle = BLUE;
          ctx.lineWidth = 2;
          ctx.strokeRect(bx - 4, by - 4, 80, 70);
        }
      });

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('缺失率', 80, 40);
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      const shown = s.pattern === 'calc_missing_rate' ? 0 : Math.round(s.rate * 100);
      ctx.fillText(`${shown}%`, 160, 40);

      // legend (3 entries)
      const legend: { color: string; text: string }[] = [
        { color: RED, text: '缺口' },
        { color: BLUE, text: '当前' },
        { color: '#6f4a2f', text: '粉层' },
      ];
      ctx.font = '13px "Segoe UI", sans-serif';
      legend.forEach((item, i) => {
        const lx = 740 + i * 100;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, 250, 14, 10);
        ctx.fillStyle = '#68778f';
        ctx.fillText(item.text, lx + 20, 260);
      });
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${pattern === p.id ? 'selected' : ''}`}
            onClick={() => pick(p.id)}
            title={p.id === 'calc_missing_rate' ? '只计算缺失率，不注入缺失' : p.id}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label htmlFor={`rate4-${chapterId}-${moduleId}`}>
          缺失率 <span className="val">{Math.round(rate * 100)}%</span>
        </label>
        <input
          id={`rate4-${chapterId}-${moduleId}`}
          type="range"
          min={10}
          max={50}
          step={1}
          value={Math.round(rate * 100)}
          disabled={pattern === 'calc_missing_rate'}
          onChange={(e) => {
            const v = clamp(Number(e.target.value) / 100, 0.1, 0.5);
            stateRef.current.rate = v;
            setRate(v);
          }}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
