import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';

type WidgetProps = { chapterId: string; moduleId: string };
type DrawFn = (ctx: CanvasRenderingContext2D, time: number) => void;

const C = {
  bg: '#f5f8f0',
  env: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  white: '#ffffff',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 8,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  r = 8,
  stroke?: string,
) {
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  align: CanvasTextAlign = 'left',
  weight = 600,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function stage(ctx: CanvasRenderingContext2D, w: number, h: number, title?: string) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.fillRect(18, 18, w - 36, h - 36);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(18.5, 18.5, w - 37, h - 37);
  if (title) label(ctx, title, 34, 40, C.text, 14, 'left', 700);
}

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.orange, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  fillRound(ctx, -28, -13, 56, 30, color, 4, C.text);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(-21, -7, 42, 5);
  [-17, 0, 17].forEach((stud) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(stud, -15, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.restore();
}

type ModelBrickKind = 'chronos' | 'timesfm' | 'tirex' | 'patchtst';

const modelBricks: { name: string; kind: ModelBrickKind; color: string }[] = [
  { name: 'Chronos-2', kind: 'chronos', color: C.blue },
  { name: 'TimesFM 2.5', kind: 'timesfm', color: C.orange },
  { name: 'TiRex', kind: 'tirex', color: C.green },
  { name: 'PatchTST-FM', kind: 'patchtst', color: C.purple },
];

function drawBrickStud(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 6.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawModelBrick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: ModelBrickKind,
  color: string,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (kind === 'chronos') {
    fillRound(ctx, -42, -14, 84, 31, color, 4, C.text);
    [-30, -10, 10, 30].forEach((stud) => drawBrickStud(ctx, stud, -16, color));
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillRect(-34, -7, 68, 5);
    label(ctx, 'C2', 0, 8, C.white, 10, 'center', 700);
  } else if (kind === 'timesfm') {
    fillRound(ctx, -38, -5, 76, 22, color, 4, C.text);
    fillRound(ctx, -20, -25, 40, 22, color, 4, C.text);
    [-11, 11].forEach((stud) => drawBrickStud(ctx, stud, -27, color));
    label(ctx, 'TF', 0, 7, C.white, 10, 'center', 700);
  } else if (kind === 'tirex') {
    fillRound(ctx, -28, -6, 56, 23, color, 4, C.text);
    fillRound(ctx, -21, -34, 42, 30, color, 4, C.text);
    [-11, 11].forEach((stud) => drawBrickStud(ctx, stud, -36, color));
    label(ctx, 'TR', 0, 5, C.white, 10, 'center', 700);
  } else {
    fillRound(ctx, -42, -14, 84, 31, color, 4, C.text);
    [-30, -10, 10, 30].forEach((stud) => drawBrickStud(ctx, stud, -16, color));
    ctx.strokeStyle = 'rgba(255,255,255,.62)';
    ctx.lineWidth = 2;
    [-21, 0, 21].forEach((divider) => {
      ctx.beginPath();
      ctx.moveTo(divider, -11);
      ctx.lineTo(divider, 14);
      ctx.stroke();
    });
    ['P', 'T', 'S', 'T'].forEach((letter, index) => label(ctx, letter, -31.5 + index * 21, 4, C.white, 8, 'center', 700));
  }

  ctx.restore();
}

function drawBaseplate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.green) {
  fillRound(ctx, x, y, w, h, color, 5, C.text);
  ctx.fillStyle = 'rgba(255,255,255,.26)';
  for (let sx = x + 14; sx < x + w - 7; sx += 24) {
    for (let sy = y + 10; sy < y + h - 5; sy += 19) {
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - Math.PI / 6), y2 - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 9 * Math.cos(angle + Math.PI / 6), y2 - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  active = false,
  color = C.blue,
) {
  fillRound(ctx, x, y, w, h, active ? color : C.white, 7, active ? color : C.axis);
  label(ctx, text, x + w / 2, y + h / 2, active ? C.white : C.text, 12, 'center', 700);
}

function CanvasStage({ width, height, draw, labelText, variant = 'module' }: {
  width: number;
  height: number;
  draw: DrawFn;
  labelText: string;
  variant?: 'module' | 'mini' | 'hero';
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const render = (time: number) => {
      draw(ctx, reduced ? 900 : time);
      canvas.classList.add('is-ready');
      if (!reduced) raf.current = requestAnimationFrame(render);
    };
    const start = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [draw, height, width]);

  return <canvas ref={ref} width={width} height={height} className={`darts-canvas darts-canvas--${variant}`} role="img" aria-label={labelText} />;
}

function ChipRow({ options, value, onChange }: { options: string[]; value: number; onChange: (index: number) => void }) {
  return (
    <div className="ctrl darts-chip-row">
      {options.map((option, index) => (
        <button key={option} className={`chip ${value === index ? 'selected' : ''}`} aria-pressed={value === index} onClick={() => onChange(index)}>
          {option}
        </button>
      ))}
    </div>
  );
}

function Feedback({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'bad' }) {
  return <div className={`feedback ${tone === 'neutral' ? '' : tone}`}>{children}</div>;
}

function HeroBlocks({ unified }: { unified: boolean }) {
  return (
    <CanvasStage
      width={560}
      height={250}
      variant="hero"
      labelText={unified ? '四种模型积木扣在同一块 FoundationModel 底板上' : '四种模型积木分别使用各自的专用底板'}
      draw={(ctx, time) => {
        stage(ctx, 560, 250, unified ? '一块标准 Darts 底板' : '四种模型，各有专用底板');
        const p = (time % 4200) / 4200;
        if (unified) {
          drawBaseplate(ctx, 50, 151, 462, 38, C.green);
          label(ctx, 'FoundationModel · 标准底板', 280, 173, C.white, 13, 'center', 700);
          modelBricks.forEach((model, index) => {
            const x = 92 + index * 124;
            const drop = easeInOutQuad(clamp(p * 1.8 - index * 0.12, 0, 1));
            label(ctx, model.name, x, 67, model.color, 11, 'center', 700);
            drawModelBrick(ctx, x, lerp(111, 133, drop), model.kind, model.color, 0.88);
          });
          label(ctx, 'fit  ·  predict  ·  backtest', 280, 218, C.blue, 12, 'center', 700);
        } else {
          modelBricks.forEach((model, index) => {
            const x = 92 + index * 124;
            const drop = easeInOutQuad(clamp(p * 1.8 - index * 0.12, 0, 1));
            label(ctx, model.name, x, 67, model.color, 11, 'center', 700);
            drawModelBrick(ctx, x, lerp(105, 133, drop), model.kind, model.color, 0.88);
            drawBaseplate(ctx, x - 45, 151, 90, 28, model.color);
          });
          label(ctx, '每种模型各搭一块专用底板', 280, 218, C.red, 12, 'center', 700);
        }
      }}
    />
  );
}

export const HeroOld: React.FC<WidgetProps> = () => <HeroBlocks unified={false} />;
export const HeroNew: React.FC<WidgetProps> = () => <HeroBlocks unified />;

function AnalogyScene({ scene }: { scene: number }) {
  return (
    <CanvasStage
      width={244}
      height={130}
      variant="mini"
      labelText={scene === 3
        ? '预测冰淇淋销量时，区分预测当时可用和不可用的协变量'
        : scene === 6
          ? '天气预报用温度范围表达未来的不确定性'
          : scene === 10
            ? '同一份试卷用于检查模型接入 Darts 后损失多少分'
          : `统一积木底板主题，第 ${scene} 个搭建场景`}
      draw={(ctx, time) => {
        ctx.clearRect(0, 0, 244, 130);
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, 244, 130);
        const p = (time % 3000) / 3000;
        if (scene === 1) {
          modelBricks.forEach((model, index) => {
            const x = 32 + index * 60;
            const drop = easeInOutQuad(clamp(p * 1.8 - index * 0.12, 0, 1));
            label(ctx, ['Chronos', 'TimesFM', 'TiRex', 'PatchTST'][index], x, 14, model.color, 7, 'center', 700);
            drawModelBrick(ctx, x, lerp(48, 69, drop), model.kind, model.color, 0.48);
            drawBaseplate(ctx, x - 25, 78, 50, 20, model.color);
          });
          label(ctx, '每个模型分别适配', 122, 116, C.red, 9, 'center', 700);
        } else if (scene === 2) {
          drawBaseplate(ctx, 86, 65, 138, 36, C.green);
          label(ctx, '标准底板', 155, 83, C.white, 11, 'center', 700);
          const y = lerp(30, 59, easeInOutQuad(p));
          drawBlock(ctx, 120, y, C.orange, 0.82);
          label(ctx, 'TimeSeries', 120, y, C.white, 7, 'center', 700);
        } else if (scene === 3) {
          label(ctx, '预测下周冰淇淋销量', 122, 13, C.text, 9, 'center', 700);
          ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(112, 27); ctx.lineTo(112, 117); ctx.stroke();
          label(ctx, '今天', 112, 27, C.muted, 8, 'center', 700);
          fillRound(ctx, 10, 40, 94, 23, 'rgba(39,68,110,.10)', 4, C.blue);
          label(ctx, '过去实测气温', 57, 51, C.blue, 8, 'center', 700);
          fillRound(ctx, 120, 68, 114, 23, 'rgba(34,141,92,.10)', 4, C.green);
          label(ctx, '周末 / 节日：已知', 177, 79, C.green, 8, 'center', 700);
          fillRound(ctx, 120, 96, 114, 23, 'rgba(196,63,82,.08)', 4, C.red);
          label(ctx, '实际气温：未知', 177, 107, C.red, 8, 'center', 700);
          const pulse = 2 + Math.sin(p * Math.PI * 2) * 1.5;
          ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(112, 51, pulse, 0, Math.PI * 2); ctx.fill();
        } else if (scene === 4) {
          const y = lerp(24, 55, easeInOutQuad(p));
          fillRound(ctx, 79, y, 86, 40, C.blue, 5, C.text);
          [0, 1, 2, 3].forEach((i) => { ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(93 + i * 19, y - 3, 5, 0, Math.PI * 2); ctx.fill(); label(ctx, `${i + 1}`, 93 + i * 19, y + 21, C.white, 8, 'center', 700); });
          drawBaseplate(ctx, 76, 93, 92, 24, C.green);
          label(ctx, '批量扣合', 122, 108, C.white, 9, 'center', 700);
        } else if (scene === 5) {
          label(ctx, '当时可见', 57, 13, C.blue, 8, 'center', 700);
          label(ctx, '预测 n 步', 199, 13, C.orange, 8, 'center', 700);
          [88, 135, 182].forEach((origin, index) => {
            const y = 40 + index * 34;
            label(ctx, `t${index + 1}`, 16, y, C.muted, 8, 'center', 700);
            ctx.strokeStyle = C.blue; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(origin, y); ctx.stroke();
            ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(origin, y); ctx.lineTo(Math.min(origin + 42, 230), y); ctx.stroke();
            ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(origin, y, 5, 0, Math.PI * 2); ctx.fill();
          });
        } else if (scene === 6) {
          label(ctx, '明日气温预报', 122, 14, C.text, 9, 'center', 700);
          label(ctx, '不是只报 26°C', 122, 32, C.muted, 8, 'center', 600);
          ctx.strokeStyle = C.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(24, 78); ctx.lineTo(220, 78); ctx.stroke();
          fillRound(ctx, 64, 66, 120, 24, 'rgba(34,141,92,.16)', 12);
          const points = [64, 124, 184];
          const values = ['22°C', '26°C', '30°C'];
          const names = ['较低', '典型', '较高'];
          points.forEach((x, index) => {
            const lift = index === 1 ? Math.sin(p * Math.PI * 2) * 2 : 0;
            ctx.fillStyle = index === 1 ? C.orange : C.green;
            ctx.beginPath(); ctx.arc(x, 78 + lift, index === 1 ? 7 : 5, 0, Math.PI * 2); ctx.fill();
            label(ctx, values[index], x, 101, index === 1 ? C.orange : C.green, 8, 'center', 700);
            label(ctx, names[index], x, 116, C.muted, 7, 'center', 600);
          });
        } else if (scene === 7) {
          const selected = 2;
          ['冻结', '全量', '部分'].forEach((v, i) => {
            fillRound(ctx, 20 + i * 72, 42, 58, 42, i === selected ? C.green : C.white, 6, i === selected ? C.green : C.axis);
            label(ctx, v, 49 + i * 72, 63, i === selected ? C.white : C.muted, 9, 'center', 700);
          });
          ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(49 + selected * 72, lerp(24, 34, easeInOutQuad(p)), 8, 0, Math.PI * 2); ctx.fill();
          label(ctx, '积木层锁', 122, 108, C.text, 10, 'center', 700);
        } else if (scene === 8) {
          drawBaseplate(ctx, 82, 75, 80, 34, C.green);
          label(ctx, '标准底板', 122, 93, C.white, 9, 'center', 700);
          const y = lerp(30, 69, easeInOutQuad(p));
          drawBlock(ctx, 122, y, C.blue, 0.78);
          label(ctx, 'TSFM', 122, y, C.white, 8, 'center', 700);
        } else if (scene === 9) {
          fillRound(ctx, 10, 38, 100, 52, C.white, 5, C.axis);
          ['x1', 'x2', 'x3'].forEach((name, index) => {
            fillRound(ctx, 18 + index * 30, 53, 24, 24, index === 0 ? 'rgba(196,63,82,.10)' : 'rgba(39,68,110,.10)', 4, index === 0 ? C.red : C.blue);
            label(ctx, index === 0 ? '?' : name, 30 + index * 30, 65, index === 0 ? C.red : C.blue, 8, 'center', 700);
          });
          drawArrow(ctx, 112, 64, 132, 64, C.green, 2);
          fillRound(ctx, 134, 45, 42, 38, C.blue, 5, C.blue); label(ctx, 'f', 155, 64, C.white, 12, 'center', 700);
          drawArrow(ctx, 178, 64, 194, 64, C.orange, 2);
          fillRound(ctx, 196, 45, 40, 38, C.orange, 5, C.orange); label(ctx, '250', 216, 64, C.white, 9, 'center', 700);
          label(ctx, '遮蔽 → 重算 → 平均', 122, 108, C.text, 9, 'center', 700);
        } else {
          label(ctx, '同一份基准试卷', 122, 13, C.text, 9, 'center', 700);
          const reveal = easeInOutQuad(p);
          [['原实现', C.blue, 18], ['Darts', C.green, 132]].forEach(([name, color, x]) => {
            fillRound(ctx, Number(x), 28, 94, 72, C.white, 5, String(color));
            label(ctx, String(name), Number(x) + 47, 43, String(color), 9, 'center', 700);
            ctx.strokeStyle = 'rgba(112,131,160,.24)'; ctx.lineWidth = 1;
            [55, 65, 75].forEach((y) => {
              ctx.beginPath(); ctx.moveTo(Number(x) + 13, y); ctx.lineTo(Number(x) + 54, y); ctx.stroke();
            });
            ctx.fillStyle = String(color);
            ctx.beginPath(); ctx.arc(Number(x) + 74, 70, 12 * reveal, 0, Math.PI * 2); ctx.fill();
            label(ctx, '≈', Number(x) + 74, 70, C.white, 10, 'center', 700);
          });
          label(ctx, '检查接入后的分数变化', 122, 116, C.orange, 8, 'center', 700);
        }
      }}
    />
  );
}

export const Analogy1: React.FC<WidgetProps> = () => <AnalogyScene scene={1} />;
export const Analogy2: React.FC<WidgetProps> = () => <AnalogyScene scene={2} />;
export const Analogy3: React.FC<WidgetProps> = () => <AnalogyScene scene={3} />;
export const Analogy4: React.FC<WidgetProps> = () => <AnalogyScene scene={4} />;
export const Analogy5: React.FC<WidgetProps> = () => <AnalogyScene scene={5} />;
export const Analogy6: React.FC<WidgetProps> = () => <AnalogyScene scene={6} />;
export const Analogy7: React.FC<WidgetProps> = () => <AnalogyScene scene={7} />;
export const Analogy8: React.FC<WidgetProps> = () => <AnalogyScene scene={8} />;
export const Analogy9: React.FC<WidgetProps> = () => <AnalogyScene scene={9} />;
export const Analogy10: React.FC<WidgetProps> = () => <AnalogyScene scene={10} />;

export const Ch1m1: React.FC<WidgetProps> = () => {
  const [count, setCount] = useState(4);
  const adapters = count * 3;
  return <>
    <CanvasStage width={720} height={300} labelText="模型与工具的专用适配矩阵" draw={(ctx) => {
      stage(ctx, 720, 300, '每个模型都要分别适配输入、输出和评估工具');
      const tools = ['输入与转换', '概率输出', '评估与回测'];
      const columns = [278, 418, 558];
      tools.forEach((name, i) => {
        drawNode(ctx, columns[i], 57, 120, 34, name, false);
        ctx.strokeStyle = 'rgba(112,131,160,.20)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(columns[i] + 60, 91);
        ctx.lineTo(columns[i] + 60, 235);
        ctx.stroke();
      });
      for (let i = 0; i < count; i++) {
        const y = 108 + i * 40;
        drawModelBrick(ctx, 70, y, modelBricks[i].kind, modelBricks[i].color, 0.48);
        label(ctx, modelBricks[i].name, 108, y, modelBricks[i].color, 10, 'left', 700);
        ctx.strokeStyle = 'rgba(112,131,160,.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(220, y);
        ctx.lineTo(678, y);
        ctx.stroke();
        columns.forEach((x) => {
          fillRound(ctx, x + 20, y - 11, 80, 22, 'rgba(196,63,82,.10)', 5, C.red);
          label(ctx, '专用适配', x + 60, y, C.red, 10, 'center', 700);
        });
      }
      fillRound(ctx, 257, 250, 206, 28, C.red, 6);
      label(ctx, `${adapters} 条专用适配关系`, 360, 264, C.white, 12, 'center', 700);
    }} />
    <div className="ctrl"><label>模型数量 <span className="val">{count}</span></label><input type="range" min="1" max="4" value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
    <Feedback tone={count === 4 ? 'bad' : 'neutral'}>{count === 1 ? '一个模型需要分别接入三类工具。' : `${count} 个模型已经产生 ${adapters} 条专用适配关系，联合评估越来越重。`}</Feedback>
  </>;
};

const modelNames = modelBricks.map((model) => model.name);

export const Ch1m2: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState(0);
  return <>
    <CanvasStage width={720} height={280} labelText="四个模型后端共享同一调用链" draw={(ctx) => {
      stage(ctx, 720, 280, '统一底板：模型积木可替换，外层调用保持不变');
      label(ctx, modelNames[model], 120, 72, modelBricks[model].color, 12, 'center', 700);
      drawModelBrick(ctx, 120, 128, modelBricks[model].kind, modelBricks[model].color, 1.15);
      drawArrow(ctx, 198, 122, 275, 122, C.green, 4);
      drawNode(ctx, 278, 88, 172, 68, 'FoundationModel', true, C.green);
      drawArrow(ctx, 452, 122, 520, 122, C.green, 4);
      ['fit(series)', 'predict(n, series)', 'backtest'].forEach((v, i) => drawNode(ctx, 526, 52 + i * 62, 142, 36, v, false, C.blue));
      label(ctx, '模型能力仍可能不同', 120, 194, C.muted, 12, 'center');
      label(ctx, '共同生命周期', 364, 194, C.green, 12, 'center', 700);
    }} />
    <ChipRow options={modelNames} value={model} onChange={setModel} />
    <Feedback tone="good">已切换到 {modelNames[model]}；TimeSeries、fit、predict 与评估入口没有换位置。</Feedback>
  </>;
};

export const Ch2m1: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const steps = ['TimeSeries', 'fit', '模型就绪', 'predict'];
  const messages = [
    '统一输入是带时间、分量与样本轴的 TimeSeries。',
    '零样本也必须调用 fit；默认冻结权重并完成创建与检查。',
    '模型已进入 Darts 生命周期，但尚未向未来输出。',
    'predict(n, series=series) 基于输入序列生成未来 n 步，并返回 TimeSeries。',
  ];
  return <>
    <CanvasStage width={720} height={270} labelText="TimeSeries 到 predict 的四步统一生命周期" draw={(ctx) => {
      stage(ctx, 720, 270, '点击步骤，点亮同一条调用链');
      steps.forEach((name, i) => {
        const x = 48 + i * 165;
        if (i < steps.length - 1) drawArrow(ctx, x + 118, 130, x + 157, 130, i < step ? C.green : C.axis, 4);
        drawNode(ctx, x, 102, 118, 56, name, i <= step, i === step ? C.orange : C.green);
      });
      fillRound(ctx, 204, 190, 312, 42, step === 1 ? C.blue : C.white, 7, step === 1 ? C.blue : C.axis);
      label(ctx, step === 1 ? 'zero-shot: 权重冻结，fit 仍执行' : '统一流程状态同步更新', 360, 211, step === 1 ? C.white : C.muted, 13, 'center', 700);
    }} />
    <ChipRow options={steps} value={step} onChange={setStep} />
    <Feedback tone={step === 3 ? 'good' : 'neutral'}>{messages[step]}</Feedback>
  </>;
};

export const Ch3m1: React.FC<WidgetProps> = () => {
  const [start, setStart] = useState(55);
  const [kind, setKind] = useState(0);
  const leak = start > 78;
  const options = ['过去协变量', '未来协变量', '判断标准', '模型支持'];
  const explanations = [
    '过去协变量是随时间变化的辅助序列，但预测时只掌握到 forecast start，例如已经测得的气温或流量。',
    '未来协变量在作出预测时已覆盖整个预测区间，例如星期、节假日或已经排定的促销计划。',
    '分类取决于预测当时能看到多远，而不取决于变量名称。同一个变量的未来值若尚未知，就不能作为未来协变量。',
    'FoundationModel 统一协变量的传入方式，但能否实际使用仍取决于模型后端；论文明确以 Chronos-2 举例。',
  ];
  return <>
    <ChipRow options={options} value={kind} onChange={setKind} />
    <Feedback>{explanations[kind]}</Feedback>
    <CanvasStage width={720} height={300} labelText="协变量预测起点与合法时间边界" draw={(ctx) => {
      stage(ctx, 720, 300, `时间边界检查器 · ${options[kind]}`);
      const left = 60, right = 660, y = 154, x = lerp(left + 90, right - 80, start / 100);
      ctx.fillStyle = `rgba(39,68,110,${kind === 0 ? '.23' : '.11'})`; ctx.fillRect(left, 84, x - left, 122);
      ctx.fillStyle = `rgba(34,141,92,${kind === 1 ? '.23' : '.11'})`; ctx.fillRect(x, 84, Math.max(0, right - x - 130), 122);
      ctx.fillStyle = `rgba(196,63,82,${kind === 2 ? '.23' : '.11'})`; ctx.fillRect(right - 130, 84, 130, 122);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.fillRect(x - 3, 68, 6, 154);
      label(ctx, 'forecast start', x, 55, C.orange, 12, 'center', 700);
      label(ctx, '已观测历史', (left + x) / 2, 112, C.blue, 12, 'center', 700);
      label(ctx, '未来已知', (x + right - 130) / 2, 112, C.green, 12, 'center', 700);
      label(ctx, '未知未来', right - 65, 112, C.red, 12, 'center', 700);
      fillRound(ctx, x - 28, y - 24, 56, 32, leak ? C.red : C.orange, 5);
      label(ctx, '时间标签', x, y - 8, C.white, 9, 'center', 700);
      ['past covariates', 'future covariates', '不可用'].forEach((v, i) => label(ctx, v, [left + 78, right - 200, right - 65][i], 238, [C.blue, C.green, C.red][i], 11, 'center', 700));
    }} />
    <div className="ctrl"><label>预测起点 <span className="val">{start}%</span></label><input type="range" min="12" max="92" value={start} onChange={(e) => setStart(Number(e.target.value))} /></div>
    <Feedback tone={leak ? 'bad' : 'good'}>{leak ? '游标进入未知未来：这会把预测时不可见的信息当成输入。' : '边界合法：过去信息截止到起点，未来协变量只覆盖预先已知部分。'}</Feedback>
  </>;
};

export const Ch4m1: React.FC<WidgetProps> = () => {
  const [count, setCount] = useState(7);
  const batchSize = 3;
  const batches = Math.ceil(count / batchSize);
  return <>
    <CanvasStage width={720} height={300} labelText="多条时间序列分批并恢复原顺序" draw={(ctx) => {
      stage(ctx, 720, 300, '输入顺序 → mini-batches → 输出顺序');
      for (let i = 0; i < count; i++) {
        const x = 48 + (i % 6) * 58, y = 72 + Math.floor(i / 6) * 44;
        drawNode(ctx, x, y, 46, 30, `S${i + 1}`, false);
      }
      drawArrow(ctx, 386, 104, 450, 104, C.green, 4);
      for (let b = 0; b < batches; b++) {
        fillRound(ctx, 466, 58 + b * 48, 92, 34, b % 2 ? 'rgba(39,68,110,.12)' : 'rgba(34,141,92,.14)', 6, b % 2 ? C.blue : C.green);
        label(ctx, `批 ${b + 1}`, 512, 75 + b * 48, b % 2 ? C.blue : C.green, 11, 'center', 700);
      }
      drawArrow(ctx, 566, 104, 622, 104, C.green, 4);
      fillRound(ctx, 624, 74, 56, 70, C.green, 7);
      label(ctx, 'S1', 652, 92, C.white, 10, 'center'); label(ctx, '…', 652, 110, C.white, 12, 'center'); label(ctx, `S${count}`, 652, 129, C.white, 10, 'center');
      label(ctx, `${count} 条序列被分成 ${batches} 批`, 360, 246, C.text, 14, 'center', 700);
    }} />
    <div className="ctrl"><label>序列数量 <span className="val">{count}</span></label><input type="range" min="1" max="12" value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
    <Feedback tone="good">内部并行分成 {batches} 个 mini-batch；输出仍按 S1 到 S{count} 的输入顺序返回。</Feedback>
  </>;
};

export const Ch5m1: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0);
  const [origin, setOrigin] = useState(1);
  const [evaluation, setEvaluation] = useState(0);
  const retrain = mode === 0;
  const originLabels = ['历史起点 t1', '历史起点 t2', '历史起点 t3'];
  return <>
    <CanvasStage width={720} height={310} labelText="历史预测如何在过去的时间起点模拟未来" draw={(ctx) => {
      stage(ctx, 720, 310, 'historical_forecasts：站在过去，遮住答案，再向前预测');
      const pointXs = [76, 136, 196, 256, 316, 376, 436, 496, 556, 616, 656];
      const pointYs = [184, 153, 166, 125, 144, 105, 121, 88, 108, 76, 91];
      const originPoint = [3, 5, 7][origin];
      const originX = pointXs[originPoint];
      const horizonEnd = Math.min(originPoint + 3, pointXs.length - 1);

      ctx.fillStyle = 'rgba(39,68,110,.10)'; ctx.fillRect(60, 72, originX - 60, 154);
      ctx.fillStyle = 'rgba(217,119,6,.10)'; ctx.fillRect(originX, 72, pointXs[horizonEnd] - originX, 154);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath();
      pointXs.slice(0, originPoint + 1).forEach((x, i) => i === 0 ? ctx.moveTo(x, pointYs[i]) : ctx.lineTo(x, pointYs[i]));
      ctx.stroke();
      ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.beginPath();
      pointXs.slice(originPoint).forEach((x, i) => i === 0 ? ctx.moveTo(x, pointYs[originPoint]) : ctx.lineTo(x, pointYs[originPoint + i]));
      ctx.stroke(); ctx.restore();

      const forecastYs = [pointYs[originPoint], pointYs[originPoint] - 14, pointYs[originPoint] - 4, pointYs[originPoint] - 22];
      ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i <= horizonEnd - originPoint; i++) {
        const x = pointXs[originPoint + i];
        i === 0 ? ctx.moveTo(x, forecastYs[i]) : ctx.lineTo(x, forecastYs[i]);
      }
      ctx.stroke();
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(originX, 62); ctx.lineTo(originX, 235); ctx.stroke();
      fillRound(ctx, originX - 43, 50, 86, 28, C.orange, 5);
      label(ctx, `起点 t${origin + 1}`, originX, 64, C.white, 11, 'center', 700);
      label(ctx, '当时可见的历史', (60 + originX) / 2, 244, C.blue, 11, 'center', 700);
      label(ctx, '预测 n 步', (originX + pointXs[horizonEnd]) / 2, 244, C.orange, 11, 'center', 700);
      label(ctx, '灰色虚线是真实值：预测时遮住，事后才用于评分', 360, 278, C.muted, 11, 'center', 600);
    }} />
    <ChipRow options={originLabels} value={origin} onChange={setOrigin} />
    <Feedback>站在 t{origin + 1} 时，只能使用 t{origin + 1} 及左侧的数据；右侧真实值虽然已存在于历史数据集，但本次模拟会先遮住，再与预测结果比较。</Feedback>
    <CanvasStage width={720} height={330} labelText="retrain True 与 False 的流程对比" draw={(ctx) => {
      stage(ctx, 720, 330, 'retrain 只决定：到达每个历史起点后，是否再次 fit');
      const panels = [
        { x: 34, color: C.red, selected: retrain, title: 'retrain=True' },
        { x: 370, color: C.green, selected: !retrain, title: 'retrain=False' },
      ];
      panels.forEach((panel) => {
        fillRound(ctx, panel.x, 62, 316, 238, panel.selected ? `${panel.color}12` : C.white, 7, panel.color);
        if (panel.selected) {
          ctx.strokeStyle = panel.color; ctx.lineWidth = 3; roundedRect(ctx, panel.x, 62, 316, 238, 7); ctx.stroke();
        }
        label(ctx, panel.title, panel.x + 158, 84, panel.color, 13, 'center', 700);
      });

      [0, 1, 2].forEach((i) => {
        const y = 112 + i * 55;
        drawNode(ctx, 48, y, 42, 28, `t${i + 1}`, false);
        drawArrow(ctx, 91, y + 14, 107, y + 14, C.red, 2);
        drawNode(ctx, 108, y, 62, 28, `数据≤t${i + 1}`, false, C.blue);
        drawArrow(ctx, 171, y + 14, 187, y + 14, C.red, 2);
        drawNode(ctx, 188, y, 40, 28, 'fit', true, C.red);
        drawArrow(ctx, 229, y + 14, 245, y + 14, C.red, 2);
        drawNode(ctx, 246, y, 42, 28, `M@t${i + 1}`, true, C.red);
        drawArrow(ctx, 289, y + 14, 305, y + 14, C.red, 2);
        drawNode(ctx, 306, y, 30, 28, `F${i + 1}`, false, C.orange);
      });

      drawNode(ctx, 470, 108, 116, 34, '只执行一次 fit', true, C.green);
      drawArrow(ctx, 528, 143, 528, 202, C.green, 2.5);

      fillRound(ctx, 386, 180, 92, 80, C.white, 6, C.axis);
      label(ctx, '历史起点批次', 432, 195, C.blue, 9, 'center', 700);
      [0, 1, 2].forEach((i) => {
        fillRound(ctx, 394 + i * 26, 212, 22, 28, 'rgba(39,68,110,.10)', 4, C.blue);
        label(ctx, `t${i + 1}`, 405 + i * 26, 226, C.blue, 9, 'center', 700);
      });

      drawBlock(ctx, 528, 224, C.green, 0.82);
      label(ctx, 'M', 528, 225, C.white, 10, 'center', 700);

      fillRound(ctx, 578, 180, 92, 80, C.white, 6, C.axis);
      label(ctx, '预测结果批次', 624, 195, C.orange, 9, 'center', 700);
      [0, 1, 2].forEach((i) => {
        fillRound(ctx, 586 + i * 26, 212, 22, 28, 'rgba(217,119,6,.10)', 4, C.orange);
        label(ctx, `F${i + 1}`, 597 + i * 26, 226, C.orange, 9, 'center', 700);
      });

      drawArrow(ctx, 479, 224, 494, 224, C.green, 2.5);
      drawArrow(ctx, 562, 224, 577, 224, C.green, 2.5);
      label(ctx, '每个起点：重新执行 fit → 预测', 192, 282, C.red, 10, 'center', 700);
      label(ctx, '不重复 fit · 整个批次复用 M', 528, 282, C.green, 10, 'center', 700);
    }} />
    <ChipRow options={['retrain=True', 'retrain=False']} value={mode} onChange={setMode} />
    <Feedback tone={retrain ? 'neutral' : 'good'}>{retrain ? '到 t1、t2、t3 时分别用当时可见的数据重新执行 fit，再调用 predict。若模型允许训练或微调，参数可以更新；默认冻结的零样本 TSFM 权重仍不变。' : '进入历史预测前只完成一次 fit；t1、t2、t3 都复用同一个已就绪模型 M，不在起点之间重复 fit，并可批量处理。'}</Feedback>
    <CanvasStage width={720} height={300} labelText="backtest 汇总评分与 residuals 逐点误差的区别" draw={(ctx) => {
      stage(ctx, 720, 300, '同一组历史预测，产生两种不同层级的评估结果');
      drawNode(ctx, 48, 112, 148, 70, '历史预测集合 H', true, C.blue);
      label(ctx, 'F1 · F2 · F3 · …', 122, 164, C.white, 10, 'center', 600);
      drawArrow(ctx, 198, 147, 272, 147, C.orange, 3);
      drawNode(ctx, 274, 112, 154, 70, '与历史真实值对齐', true, C.orange);
      label(ctx, '预测值 ŷ  vs  真实值 y', 351, 164, C.white, 10, 'center', 600);

      drawArrow(ctx, 430, 143, 500, 96, evaluation === 0 ? C.green : C.axis, evaluation === 0 ? 4 : 2);
      fillRound(ctx, 502, 62, 168, 82, evaluation === 0 ? C.green : C.white, 7, evaluation === 0 ? C.green : C.axis);
      label(ctx, 'backtest', 586, 82, evaluation === 0 ? C.white : C.green, 13, 'center', 700);
      label(ctx, '汇总指标：MAE、MASE…', 586, 108, evaluation === 0 ? C.white : C.muted, 10, 'center', 600);
      label(ctx, '回答：整体有多准？', 586, 127, evaluation === 0 ? C.white : C.muted, 9, 'center', 600);

      drawArrow(ctx, 430, 151, 500, 214, evaluation === 1 ? C.purple : C.axis, evaluation === 1 ? 4 : 2);
      fillRound(ctx, 502, 174, 168, 86, evaluation === 1 ? C.purple : C.white, 7, evaluation === 1 ? C.purple : C.axis);
      label(ctx, 'residuals', 586, 194, evaluation === 1 ? C.white : C.purple, 13, 'center', 700);
      label(ctx, '逐点误差：eₜ = yₜ − ŷₜ', 586, 220, evaluation === 1 ? C.white : C.muted, 10, 'center', 600);
      label(ctx, '回答：何时偏高或偏低？', 586, 242, evaluation === 1 ? C.white : C.muted, 9, 'center', 600);
      label(ctx, 'historical_forecasts 提供预测；二者负责评估，不会生成新的未来预测', 330, 252, C.muted, 10, 'center', 600);
    }} />
    <ChipRow options={['backtest：汇总评分', 'residuals：逐点误差']} value={evaluation} onChange={setEvaluation} />
    <Feedback tone="good">{evaluation === 0 ? 'backtest 使用一个或多个指标比较历史预测与对应真实值，并汇总为模型表现分数。' : 'residuals 返回按时间对齐的误差序列，定义为 eₜ = yₜ − ŷₜ：正值表示预测偏低，负值表示预测偏高。'}</Feedback>
  </>;
};

export const Ch6m1: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0);
  const [horizon, setHorizon] = useState(1);
  const horizonLabels = ['t+1', 't+2', 't+3', 't+4'];
  return <>
    <ChipRow options={['随机采样轨迹（Monte Carlo）', '直接输出分布参数']} value={mode} onChange={setMode} />
    <Feedback>{mode === 0 ? 'Monte Carlo Sampling：模型先输出未来序列的概率分布，likelihood 再从该分布中随机采样 N 次，生成 N 条可能的未来预测轨迹，用这些样本近似未来的不确定性。抽样不会重新训练模型。' : 'Direct Parameter Prediction：模型直接输出未来每个时间步的概率分布参数，例如均值、方差或分位数，再根据这些参数计算预测区间或概率结果。'}</Feedback>
    <CanvasStage width={720} height={260} labelText="概率预测从输入到两种输出方式的共同流程" draw={(ctx) => {
      stage(ctx, 720, 260, '两种方式共用前半段，只在最后一步分叉');
      fillRound(ctx, 42, 94, 128, 64, C.white, 7, C.blue);
      label(ctx, '历史序列', 106, 113, C.blue, 11, 'center', 700);
      label(ctx, '+ 合法协变量', 106, 139, C.muted, 10, 'center', 600);
      drawArrow(ctx, 172, 126, 206, 126, C.blue, 3);

      fillRound(ctx, 208, 94, 132, 64, C.blue, 7, C.blue);
      label(ctx, 'TSFM 前向计算', 274, 114, C.white, 11, 'center', 700);
      label(ctx, '使用已学到的规律', 274, 139, C.white, 9, 'center', 600);
      drawArrow(ctx, 342, 126, 376, 126, C.green, 3);

      fillRound(ctx, 378, 84, 154, 84, C.green, 7, C.green);
      label(ctx, '匹配预训练方式的', 455, 108, C.white, 9, 'center', 600);
      label(ctx, 'likelihood', 455, 132, C.white, 12, 'center', 700);
      label(ctx, '解释模型输出', 455, 153, C.white, 9, 'center', 600);

      drawArrow(ctx, 534, 122, 566, 82, mode === 0 ? C.orange : C.axis, mode === 0 ? 4 : 2);
      fillRound(ctx, 568, 54, 120, 62, mode === 0 ? C.orange : C.white, 7, mode === 0 ? C.orange : C.axis);
      label(ctx, '随机抽 N 次', 628, 75, mode === 0 ? C.white : C.orange, 11, 'center', 700);
      label(ctx, '得到 N 条轨迹', 628, 98, mode === 0 ? C.white : C.muted, 9, 'center', 600);

      drawArrow(ctx, 534, 130, 566, 190, mode === 1 ? C.purple : C.axis, mode === 1 ? 4 : 2);
      fillRound(ctx, 568, 158, 120, 66, mode === 1 ? C.purple : C.white, 7, mode === 1 ? C.purple : C.axis);
      label(ctx, '直接输出参数', 628, 179, mode === 1 ? C.white : C.purple, 11, 'center', 700);
      label(ctx, '均值 · 方差 · 分位数', 628, 204, mode === 1 ? C.white : C.muted, 9, 'center', 600);
      label(ctx, '模型只做一次前向计算；右侧只是两种读取输出的方式', 332, 216, C.muted, 10, 'center', 600);
    }} />
    <CanvasStage width={720} height={360} labelText="选择未来时点并比较样本与直接分布参数" draw={(ctx) => {
      stage(ctx, 720, 360, mode === 0 ? 'Monte Carlo Sampling：随机采样 N 次，生成 N 条未来轨迹' : 'Direct Parameter Prediction：直接输出每个未来时间步的分布参数');
      const historyX = [58, 98, 138, 178, 218];
      const historyY = [226, 198, 212, 170, 184];
      const futureX = [218, 283, 348, 413, 478];
      const medianY = [184, 164, 178, 145, 158];
      const spread = [0, 14, 23, 32, 42];
      const selectedIndex = horizon + 1;
      const selectedX = futureX[selectedIndex];

      ctx.fillStyle = 'rgba(39,68,110,.07)'; ctx.fillRect(46, 72, 172, 208);
      ctx.fillStyle = 'rgba(34,141,92,.07)'; ctx.fillRect(218, 72, 278, 208);
      label(ctx, '已观测历史', 132, 88, C.blue, 10, 'center', 700);
      label(ctx, '许多可能的未来', 357, 88, C.green, 10, 'center', 700);

      ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath();
      historyX.forEach((x, i) => i === 0 ? ctx.moveTo(x, historyY[i]) : ctx.lineTo(x, historyY[i]));
      ctx.stroke();

      ctx.fillStyle = mode === 0 ? 'rgba(39,68,110,.12)' : 'rgba(34,141,92,.18)'; ctx.beginPath();
      futureX.forEach((x, i) => i === 0 ? ctx.moveTo(x, medianY[i] - spread[i]) : ctx.lineTo(x, medianY[i] - spread[i]));
      for (let i = futureX.length - 1; i >= 0; i--) ctx.lineTo(futureX[i], medianY[i] + spread[i]);
      ctx.closePath(); ctx.fill();

      if (mode === 0) {
        for (let sample = 0; sample < 11; sample++) {
          ctx.strokeStyle = `rgba(39,68,110,${0.16 + (sample % 3) * 0.04})`; ctx.lineWidth = 1.2; ctx.beginPath();
          futureX.forEach((x, i) => {
            const offset = Math.sin(sample * 1.7 + i * 1.2) * spread[i] * (0.34 + (sample % 4) * 0.13);
            i === 0 ? ctx.moveTo(x, medianY[i]) : ctx.lineTo(x, medianY[i] + offset);
          });
          ctx.stroke();
        }
      } else {
        [0, 1, 2].forEach((quantile) => {
          ctx.strokeStyle = [C.green, C.orange, C.green][quantile];
          ctx.lineWidth = quantile === 1 ? 3 : 2;
          ctx.beginPath();
          futureX.forEach((x, i) => {
            const y = medianY[i] + [spread[i], 0, -spread[i]][quantile];
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
        });
        label(ctx, 'q90', 485, medianY[4] - spread[4], C.green, 9, 'left', 700);
        label(ctx, 'q50', 485, medianY[4], C.orange, 9, 'left', 700);
        label(ctx, 'q10', 485, medianY[4] + spread[4], C.green, 9, 'left', 700);
      }

      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.beginPath();
      futureX.forEach((x, i) => i === 0 ? ctx.moveTo(x, medianY[i]) : ctx.lineTo(x, medianY[i]));
      ctx.stroke();
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(selectedX, 70); ctx.lineTo(selectedX, 282); ctx.stroke(); ctx.restore();
      fillRound(ctx, selectedX - 27, 60, 54, 26, C.orange, 5);
      label(ctx, horizonLabels[horizon], selectedX, 73, C.white, 10, 'center', 700);

      fillRound(ctx, 526, 68, 164, 224, C.white, 7, C.axis);
      label(ctx, `${horizonLabels[horizon]} 的可能结果`, 608, 88, C.text, 12, 'center', 700);
      if (mode === 0) {
        const offsets = [-58, -42, -31, -22, -13, -7, 0, 6, 12, 21, 30, 41, 55];
        offsets.forEach((offset, index) => {
          ctx.fillStyle = index === 6 ? C.orange : C.blue;
          ctx.globalAlpha = index === 6 ? 1 : 0.62;
          ctx.beginPath(); ctx.arc(608 + ((index % 3) - 1) * 13, 179 + offset, 5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(552, 179); ctx.lineTo(664, 179); ctx.stroke();
        label(ctx, '每个点是随机抽到的一种可能', 608, 263, C.blue, 9, 'center', 700);
      } else {
        const rows = [
          { name: 'q90', y: 126, color: C.green, text: '排在 90% 位置' },
          { name: 'q50', y: 178, color: C.orange, text: '排在正中间' },
          { name: 'q10', y: 230, color: C.green, text: '排在 10% 位置' },
        ];
        rows.forEach((row) => {
          fillRound(ctx, 548, row.y - 17, 120, 34, `${row.color}18`, 5, row.color);
          label(ctx, row.name, 568, row.y, row.color, 10, 'center', 700);
          label(ctx, row.text, 650, row.y, C.muted, 9, 'right', 600);
        });
        label(ctx, 'QuantileRegression 输出分位数参数', 608, 270, C.green, 9, 'center', 700);
      }
      label(ctx, '越往未来，区间通常可以变宽；这表示不确定性，而不是预测值在移动', 360, 323, C.muted, 10, 'center', 600);
    }} />
    <ChipRow options={horizonLabels} value={horizon} onChange={setHorizon} />
    <Feedback tone="good">{mode === 0 ? `${horizonLabels[horizon]} 右侧每个点都是一次随机采样的结果。N 条完整轨迹共同近似预测分布；从这些样本可以估计分位数、预测区间和事件概率。` : `${horizonLabels[horizon]} 直接返回分布参数，不需要先生成 N 条随机轨迹。本文四个模型使用 QuantileRegression，因此图中参数是 q10、q50、q90；其他 likelihood 也可能输出均值和方差。`}</Feedback>
  </>;
};

export const Ch7m1: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState(0);
  const options = ['None / False', 'True', 'dict 模式'];
  const messages = [
    'TSFM 默认冻结：fit 完成统一初始化与检查，但不更新权重。',
    '全量解冻：fit 对全部参数执行深度微调。',
    '部分微调：用 freeze 或 unfreeze 通配符选择参数，例如 output_*。',
  ];
  return <>
    <CanvasStage width={720} height={300} labelText="微调的冻结、全量解冻和按模式选择参数" draw={(ctx) => {
      stage(ctx, 720, 300, 'enable_finetuning 选择可更新的参数集合');
      const names = ['embedding', 'block 1', 'block 2', 'attention', 'output'];
      names.forEach((name, i) => {
        const active = mode === 1 || (mode === 2 && i === 4);
        const y = 62 + i * 38;
        fillRound(ctx, 170, y, 380, 28, active ? C.green : 'rgba(104,119,143,.12)', 5, active ? C.green : C.axis);
        label(ctx, name, 190, y + 14, active ? C.white : C.muted, 11, 'left', 700);
        label(ctx, active ? '可训练' : '冻结', 530, y + 14, active ? C.white : C.muted, 11, 'right', 700);
      });
      label(ctx, mode === 2 ? '{"unfreeze": ["output_*"]}' : mode === 1 ? 'True' : 'None / False', 360, 267, mode === 0 ? C.blue : C.green, 13, 'center', 700);
    }} />
    <ChipRow options={options} value={mode} onChange={setMode} />
    <Feedback tone={mode === 0 ? 'neutral' : 'good'}>{messages[mode]} 论文实现不支持 LoRA 等 PEFT。</Feedback>
  </>;
};

export const Ch8m1: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState(0);
  return <>
    <CanvasStage width={720} height={330} labelText="四个模型通过 FoundationModel 连接到 Darts 工具链" draw={(ctx) => {
      stage(ctx, 720, 330, '选择后端，追踪相同的系统路径');
      modelNames.forEach((name, i) => drawNode(ctx, 36, 58 + i * 54, 150, 36, name, i === model, i === model ? C.orange : C.blue));
      drawArrow(ctx, 188, 148, 278, 148, C.green, 4);
      drawNode(ctx, 282, 106, 174, 84, 'FoundationModel', true, C.green);
      label(ctx, 'TorchForecastingModel', 369, 174, C.white, 10, 'center', 600);
      drawArrow(ctx, 458, 148, 520, 148, C.green, 4);
      ['TimeSeries', 'Lightning', '回测 / 保存', 'SHAP'].forEach((v, i) => drawNode(ctx, 526, 48 + i * 58, 154, 36, v, i === model % 4, C.blue));
      ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(186, 76 + model * 54); ctx.bezierCurveTo(232, 76 + model * 54, 238, 148, 278, 148); ctx.stroke();
      label(ctx, '后端不同', 111, 286, C.muted, 12, 'center');
      label(ctx, '统一生命周期', 369, 286, C.green, 12, 'center', 700);
      label(ctx, '复用生态能力', 603, 286, C.blue, 12, 'center', 700);
    }} />
    <ChipRow options={modelNames} value={model} onChange={setModel} />
    <Feedback tone="good">{modelNames[model]} 保留自己的内部结构，同时沿 FoundationModel 进入同一套 Darts 生命周期。</Feedback>
  </>;
};

const shapSteps = [
  { label: '原始预测', masked: -1, output: 250, contribution: 0 },
  { label: '遮蔽 x1', masked: 0, output: 190, contribution: 60 },
  { label: '遮蔽 x2', masked: 1, output: 220, contribution: 30 },
  { label: '遮蔽 x3', masked: 2, output: 240, contribution: 10 },
  { label: '贡献相加', masked: -1, output: 250, contribution: 100 },
];

export const Ch9m1: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const selected = shapSteps[step];
  const finalStep = step === shapSteps.length - 1;
  const featureNames = ['x1', 'x2', 'x3'];
  const featureDetails = ['近期值', '日历', '气温'];
  const messages = [
    '原始输入 [x1, x2, x3] 送入基础模型，得到 f(x1,x2,x3)=250。SHAP 接下来要解释：为什么当前预测比背景平均预测 150 高出 100？',
    '用背景参考值替代 x1，模型输出变成 190。本数值案例设定特征无交互，因此 x1 的贡献为 250−190=60。',
    '用背景参考值替代 x2，模型输出变成 220，因此 x2 的贡献约为 250−220=30。',
    '用背景参考值替代 x3，模型输出变成 240，因此 x3 的贡献约为 250−240=10。',
    '三个贡献相加得到 100，正好解释当前预测相对基线的偏移：150+60+30+10=250。',
  ];
  return <>
    <CanvasStage width={720} height={330} labelText="SHAP 通过遮蔽输入和重复调用模型解释预测 250" draw={(ctx) => {
      const title = step === 0 ? '第一步：基础模型输出 250' : finalStep ? '第三步：基线与贡献重新组成 250' : `第二步：遮蔽 ${featureNames[selected.masked]}，再次调用同一个模型`;
      stage(ctx, 720, 330, title);
      fillRound(ctx, 42, 78, 300, 116, C.white, 7, C.axis);
      label(ctx, '输入向量', 192, 94, C.text, 10, 'center', 700);
      featureNames.forEach((name, index) => {
        const masked = selected.masked === index;
        const x = 58 + index * 92;
        fillRound(ctx, x, 112, 78, 60, masked ? 'rgba(196,63,82,.10)' : 'rgba(39,68,110,.08)', 6, masked ? C.red : C.blue);
        label(ctx, masked ? '?' : name, x + 39, 130, masked ? C.red : C.blue, 13, 'center', 700);
        label(ctx, masked ? '参考值' : featureDetails[index], x + 39, 154, masked ? C.red : C.muted, 9, 'center', 600);
      });

      drawArrow(ctx, 344, 136, 386, 136, C.green, 3);
      fillRound(ctx, 388, 99, 126, 76, C.blue, 7, C.blue);
      label(ctx, '基础模型 f', 451, 121, C.white, 12, 'center', 700);
      label(ctx, step === 0 || finalStep ? '原始调用' : '再次调用', 451, 151, C.white, 10, 'center', 600);
      drawArrow(ctx, 516, 136, 552, 136, C.orange, 3);
      fillRound(ctx, 554, 99, 122, 76, C.orange, 7, C.orange);
      label(ctx, '模型输出', 615, 119, C.white, 10, 'center', 600);
      label(ctx, `${selected.output}`, 615, 149, C.white, 22, 'center', 700);

      if (finalStep) {
        const parts = [
          { x: 78, w: 190, text: '基线 150', color: C.blue },
          { x: 268, w: 110, text: 'x1 +60', color: C.red },
          { x: 378, w: 88, text: 'x2 +30', color: C.orange },
          { x: 466, w: 72, text: 'x3 +10', color: C.green },
        ];
        parts.forEach((part) => { fillRound(ctx, part.x, 220, part.w, 42, part.color, 4, C.text); label(ctx, part.text, part.x + part.w / 2, 241, C.white, 10, 'center', 700); });
        label(ctx, '= 250', 592, 241, C.text, 16, 'center', 700);
        label(ctx, '150 + 60 + 30 + 10 = 250', 360, 287, C.text, 13, 'center', 700);
      } else {
        fillRound(ctx, 178, 218, 364, 48, C.white, 7, C.orange);
        const equation = step === 0 ? 'f(x1, x2, x3) = 250' : `250 − ${selected.output} = ${selected.contribution}`;
        label(ctx, equation, 360, 242, C.text, 15, 'center', 700);
        label(ctx, step === 0 ? '背景样本的平均预测（base value）= 150' : '? 表示用背景参考值替代，不是传入 NaN', 360, 290, C.muted, 11, 'center', 600);
      }
    }} />
    <ChipRow options={shapSteps.map((item) => item.label)} value={step} onChange={setStep} />
    <Feedback tone={finalStep ? 'good' : 'neutral'}>{messages[step]}</Feedback>
    <Feedback>图示采用无交互数值案例。Permutation SHAP 的实际计算会改变特征加入顺序，使用背景值反复调用模型，并平均每个特征的边际变化；存在特征交互时，单次替代差值不一定等于最终 SHAP 值。</Feedback>
  </>;
};

const results = [
  { name: 'Chronos-2', darts: [50.4, 39.3], original: [51.1, 40.4], leaked: 0 },
  { name: 'TiRex', darts: [43.2, 31.1], original: [43.4, 31.4], leaked: 0 },
  { name: 'TimesFM 2.5', darts: [42.8, 31.0], original: [44.0, 32.3], leaked: 1 },
];

export const Ch10m1: React.FC<WidgetProps> = () => {
  const [model, setModel] = useState(0);
  const row = results[model];
  const maxGap = Math.max(Math.abs(row.darts[0] - row.original[0]), Math.abs(row.darts[1] - row.original[1]));
  return <>
    <CanvasStage width={720} height={340} labelText="Darts 与原始实现的 SQL 和 MASE skill score 对比" draw={(ctx) => {
      stage(ctx, 720, 340, `${row.name} · fev-bench-mini 表 2`);
      const metrics = ['SQL', 'MASE'];
      metrics.forEach((metric, i) => {
        const y = 92 + i * 104;
        label(ctx, metric, 56, y + 28, C.text, 13, 'left', 800);
        const scale = 8;
        ctx.fillStyle = C.blue; ctx.fillRect(132, y, row.original[i] * scale, 25);
        ctx.fillStyle = C.green; ctx.fillRect(132, y + 34, row.darts[i] * scale, 25);
        label(ctx, `原实现 ${row.original[i].toFixed(1)}%`, 140, y + 12, C.white, 11, 'left', 700);
        label(ctx, `Darts ${row.darts[i].toFixed(1)}%`, 140, y + 46, C.white, 11, 'left', 700);
      });
      label(ctx, 'skill score：0% = 与 seasonal naive 相当', 360, 292, C.muted, 12, 'center', 700);
      fillRound(ctx, 520, 38, 156, 34, maxGap <= 1.3 ? C.green : C.red, 6);
      label(ctx, `最大下降 ${maxGap.toFixed(1)} 个百分点`, 598, 55, C.white, 11, 'center', 700);
    }} />
    <ChipRow options={results.map((item) => item.name)} value={model} onChange={setModel} />
    <div className="darts-result-grid">
      <span>SQL: {row.darts[0].toFixed(1)}% vs {row.original[0].toFixed(1)}%</span>
      <span>MASE: {row.darts[1].toFixed(1)}% vs {row.original[1].toFixed(1)}%</span>
      <span>Leaked datasets: {row.leaked}</span>
    </div>
    <Feedback tone="good">接入 Darts 后，该模型的 skill score 最大下降 {maxGap.toFixed(1)} 个百分点；三种已评估模型均不超过 1.3 个百分点，性能基本保持。PatchTST-FM 未参与原始评估，因此没有被画进来。</Feedback>
  </>;
};
