import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.2（三个变量 y → ŷ → ȳ · 方案甲）
// 命题：三个形态不是三份数据，而是同一次推理的三个视图；能拿去做算术的只有最后那张。
// 画面：三列并排（y 0/1 / ŷ 概率 / ȳ 权重），同一组概念的条形长度横向可比；按钮高亮当前列。
// 关键知识点：ȳ 的条明显更短是对的 —— 归一化后要在 15/20 项上摊，单值必然变小（尺子没变）。
// 自包含：只 import react 与 ../lib/canvasKit，具名导出 Ch4Enrich。

const W = 1080;
const H = 300;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const C = {
  field: '#f5f8f0',
  ink: '#21324a',
  muted: '#68778f',
  faint: '#9aa3ae',
  line: '#d7deea',
  blue: '#185fa5',
  blueFill: '#b5d4f4',
  aux: '#7c3aed',
  auxFill: '#c9b3f5',
  green: '#228d5c',
};

type State3 = 'y' | 'p' | 'n';

interface Row {
  name: string;
  y: number; // 0/1 指示
  p: number; // ŷ softmax 概率
  n: number; // ȳ 归一化权重（0 = 不在 top-k′ 内）
}

// 同一篇文档的 11 个候选概念。前 8 个被 LLM 选中（y=1）；
// 「冷启动」「过滤泡」y=0，却被模型判为强相关而补进索引 —— 这就是概念丰富的可见证据。
const ROWS: Row[] = [
  { name: '推荐系统', y: 1, p: 0.82, n: 0.2 },
  { name: '协同过滤', y: 1, p: 0.88, n: 0.24 },
  { name: '矩阵分解', y: 1, p: 0.74, n: 0.16 },
  { name: '长尾分布', y: 1, p: 0.63, n: 0.09 },
  { name: '向量检索', y: 1, p: 0.79, n: 0.12 },
  { name: '查询扩展', y: 1, p: 0.71, n: 0 },
  { name: '语言模型', y: 1, p: 0.66, n: 0 },
  { name: '知识蒸馏', y: 1, p: 0.69, n: 0 },
  { name: '冷启动', y: 0, p: 0.62, n: 0.11 },
  { name: '过滤泡', y: 0, p: 0.57, n: 0.08 },
  { name: '梅尔谱', y: 0, p: 0.54, n: 0 },
];

const NAME_R = 180; // 概念名右对齐基线
const COL_X = [200, 380, 560]; // 三列条起点
const BAR_MAX = 140; // 共用一个 0..1 标尺 → 三列长度可直接横比
const ROW_TOP = 70;
const ROW_H = 20;
const BAR_H = 11;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left',
  bold = false
) {
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600 ' : ''}${size}px ${SANS}`;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

// 在给定列里画一根条；value = 0 时画空心框表示「不在其中」。
function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  fill: string,
  active: boolean
) {
  if (value <= 0) {
    ctx.strokeStyle = active ? '#c8cfd8' : '#e7ebf1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, BAR_MAX - 1, BAR_H - 1);
    return;
  }
  roundRect(ctx, x, y, Math.max(value * BAR_MAX, 4), BAR_H, 4);
  ctx.fillStyle = fill;
  ctx.globalAlpha = active ? 1 : 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;
}

export const Ch4Enrich: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<State3>('y');
  const [state3, setState3] = useState<State3>('y');
  const [feedback, setFeedback] = useState({ text: '0/1 只知道选没选中。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.field;
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 表头
      const heads: Array<[string, string, State3]> = [
        ['y', '0/1 标签', 'y'],
        ['ŷ', '概率', 'p'],
        ['ȳ', '索引权重', 'n'],
      ];
      heads.forEach(([sym, hint, key], i) => {
        const on = st === key;
        const x = COL_X[i];
        text(ctx, sym, x, 40, on ? C.ink : C.faint, 16, 'left', true);
        text(ctx, hint, x + 26, 40, on ? C.muted : C.faint, 12.5);
        if (on) {
          ctx.strokeStyle = i === 2 ? C.aux : C.blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 48);
          ctx.lineTo(x + BAR_MAX, 48);
          ctx.stroke();
        }
      });

      // ── 11 行
      ROWS.forEach((row, i) => {
        const y = ROW_TOP + i * ROW_H;
        const by = y - BAR_H / 2;
        const isAdded = row.y === 0 && row.n > 0;

        text(
          ctx,
          row.name,
          NAME_R,
          y + 4,
          isAdded ? C.aux : C.muted,
          12.5,
          'right',
          isAdded
        );

        // 列 1：y（0/1）
        const yv = row.y === 1 ? 1 : 0;
        bar(ctx, COL_X[0], by, yv, C.blueFill, st === 'y');

        // 列 2：ŷ
        bar(ctx, COL_X[1], by, row.p, C.blueFill, st === 'p');

        // 列 3：ȳ（补入项用紫，凸显概念丰富）
        bar(ctx, COL_X[2], by, row.n, isAdded ? C.auxFill : C.blueFill, st === 'n');
      });

      // ── 脚注
      text(
        ctx,
        'ȳ 的两步：不在 top-k′ 的置 0 → 选中的归一化（主题 k′=15 / 短语 k′=20）。ȳ 条明显更短是对的 —— 权重要在 15 / 20 项上摊，尺子没变、值必然变小。',
        40,
        288,
        C.muted,
        12
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (s: State3) => {
    stateRef.current = s;
    setState3(s);
    setFeedback(
      s === 'y'
        ? { text: 'y 是 0/1：只知道 LLM 选没选中，没有程度。', cls: '' }
        : s === 'p'
          ? { text: 'ŷ 是概率：知道有多重要，但还没有稀疏化、也没归一化。', cls: '' }
          : {
              text: 'ȳ 先按 top-k′ 稀疏化、再把选中项归一化 —— 这才拿得去做算术。紫色两项（冷启动 / 过滤泡）是文档没明说、却被模型补进来的。',
              cls: 'good',
            }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={state3 === 'y' ? 'on' : ''} onClick={() => pick('y')}>
          y · 0/1 标签
        </button>
        <button type="button" className={state3 === 'p' ? 'on' : ''} onClick={() => pick('p')}>
          ŷ · 概率
        </button>
        <button type="button" className={state3 === 'n' ? 'on' : ''} onClick={() => pick('n')}>
          ȳ · 权重
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
