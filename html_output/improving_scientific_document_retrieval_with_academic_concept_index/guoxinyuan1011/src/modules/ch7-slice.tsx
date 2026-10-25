import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1（概念切片 · §5.1）
// 命题：长文档被压成一个向量后，多个概念面糊在一起、检索器只能给一个相似度；
//       CCExpand 免训练地用 CCQGen 给出的概念感知查询做条件，把文档投影成 M=5 个片段。
// 画面：左 = 文档 d（压扁态一根灰棒 / 切片态五段分色带）；中 = 5 个概念查询；右 = 5 个概念聚焦片段。
// 主导操作：① 压扁 / 切片 开关（主）；② 点概念查询高亮对应片段（细）。
// 自包含：只 import react 与 ../lib/canvasKit。

const W = 1080;
const H = 380;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const FACETS = [
  { name: '矩阵分解', sym: 's¹', color: '#185fa5', fill: '#dbe8f6' },
  { name: '冷启动', sym: 's²', color: '#228d5c', fill: '#dcefe3' },
  { name: '过滤泡', sym: 's³', color: '#f07e47', fill: '#fde8dc' },
  { name: '神经协同过滤', sym: 's⁴', color: '#7c3aed', fill: '#eae2fb' },
  { name: '序列推荐', sym: 's⁵', color: '#0f8b8d', fill: '#d9efef' },
];
const QS = ['q₁', 'q₂', 'q₃', 'q₄', 'q₅'];

const LX = 56;
const LW = 240;
const MX = 326;
const MW = 196;
const RX = 572;
const RW = 458;
const ROW0 = 78;
const RDY = 52;
const RH = 44;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const s = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - s * Math.cos(ang - 0.42), y1 - s * Math.sin(ang - 0.42));
  ctx.lineTo(x1 - s * Math.cos(ang + 0.42), y1 - s * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

export const Ch7Slice: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0); // 0 = 压扁，1 = 切片（平滑过渡）
  const targetRef = useRef(0);
  const modeRef = useRef<'flat' | 'slice'>('flat');
  const selRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'flat' | 'slice'>('flat');
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - last, 90);
      last = now;
      tRef.current += (targetRef.current - tRef.current) * Math.min(1, dt / 200);
      const t = tRef.current;
      const selIdx = selRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 顶部标题与公式
      text(ctx, '把一篇多面文档，按概念切成 5 片', 56, 28, '#4b4a45', 16.5, 'left', true);
      text(ctx, 's_d = LLM(inst, d, q_d)　　M = 5', 1030, 28, '#8a8780', 14, 'right');

      // ── 列标题
      text(ctx, '文档 d（一篇推荐系统论文）', LX, 60, '#6b6a63', 13);
      text(ctx, '概念感知查询（来自 CCQGen）', MX, 60, '#6b6a63', 13);
      text(ctx, '概念聚焦片段（每片只讲一面）', RX, 60, '#6b6a63', 13);

      // ── 压扁层
      if (t < 0.999) {
        ctx.globalAlpha = 1 - t;
        roundRect(ctx, LX, ROW0, LW, 4 * RDY + RH, 10);
        ctx.fillStyle = '#e9e7e0';
        ctx.fill();
        ctx.strokeStyle = '#c9c6bd';
        ctx.lineWidth = 1;
        ctx.stroke();
        text(ctx, '1 个向量', LX + LW / 2, ROW0 + 100, '#8a8780', 17, 'center', true);
        text(ctx, '5 个概念面糊在一起', LX + LW / 2, ROW0 + 126, '#9b988f', 13, 'center');
        text(
          ctx,
          '概念面不可区分 —— 整篇只有一个相似度',
          RX + RW / 2,
          ROW0 + 4 * RDY + RH / 2 + 5,
          '#8a8780',
          14.5,
          'center'
        );
        ctx.globalAlpha = 1;
      }

      // ── 切片层
      if (t > 0.001) {
        const dim = (i: number) => (selIdx === null || selIdx === i ? 1 : 0.38);
        ctx.globalAlpha = t;
        FACETS.forEach((f, i) => {
          const y = ROW0 + i * RDY;
          ctx.globalAlpha = t * dim(i);
          const on = selIdx === i;

          // 左：文档的概念面（分色带）
          roundRect(ctx, LX, y, LW, RH, 8);
          ctx.fillStyle = f.fill;
          ctx.fill();
          ctx.strokeStyle = f.color;
          ctx.lineWidth = on ? 2.4 : 1.2;
          ctx.stroke();
          text(ctx, f.name, LX + 14, y + 28, f.color, 15, 'left', true);

          // 中：概念感知查询
          roundRect(ctx, MX, y, MW, RH, 8);
          ctx.fillStyle = '#fbfcfe';
          ctx.fill();
          ctx.strokeStyle = on ? f.color : '#cfd8e2';
          ctx.lineWidth = on ? 2 : 1;
          ctx.stroke();
          text(ctx, `${QS[i]}　${f.name}`, MX + 13, y + 28, on ? f.color : '#4b4a55', 14.5, 'left', on);

          // 中 → 右 箭头（条件决定切片）
          drawArrow(ctx, MX + MW + 6, y + RH / 2, RX - 8, y + RH / 2, on ? f.color : '#c7d0da');

          // 右：概念聚焦片段
          roundRect(ctx, RX, y, RW, RH, 8);
          ctx.fillStyle = on ? f.fill : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = f.color;
          ctx.lineWidth = on ? 2.4 : 1.2;
          ctx.stroke();
          ctx.fillStyle = f.color;
          ctx.fillRect(RX, y + 8, 5, RH - 16);
          text(ctx, `片段 ${f.sym}`, RX + 18, y + 28, f.color, 15, 'left', true);
          text(
            ctx,
            `只讲「${f.name}」这一面`,
            RX + 108,
            y + 28,
            '#5c5a52',
            14
          );
        });
        ctx.globalAlpha = 1;
      }

      // ── 分隔线 + 读数
      ctx.strokeStyle = '#dfe5ee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(56, 340);
      ctx.lineTo(1030, 340);
      ctx.stroke();

      const slice = modeRef.current === 'slice';
      text(
        ctx,
        `可区分的概念面：${slice ? 5 : 1}`,
        56,
        362,
        slice ? '#228d5c' : '#c43f52',
        15,
        'left',
        true
      );
      text(
        ctx,
        slice
          ? '（每个概念面各自成一个片段；片段离线生成，检索时不再调用 LLM）'
          : '（压扁后所有概念面共享一个向量，检索器无从区分）',
        224,
        362,
        '#8a8780',
        13.5
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const switchMode = (m: 'flat' | 'slice') => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    targetRef.current = m === 'slice' ? 1 : 0;
    setMode(m);
    if (m === 'flat') {
      selRef.current = null;
      setSel(null);
    }
  };

  const pickQuery = (i: number) => {
    if (modeRef.current !== 'slice') return;
    const next = selRef.current === i ? null : i;
    selRef.current = next;
    setSel(next);
  };

  const fb =
    mode === 'flat'
      ? '压扁：整篇文档只剩一个向量，五个概念面糊在一起 —— 检索器只能给一个相似度，谁也分不出来。'
      : sel !== null
        ? `选中 ${QS[sel]}：这一片只讲「${FACETS[sel].name}」这一面，所以它跟同概念面的查询天然更近。`
        : '切片：五个概念面各自成为一个片段，检索时就能逐面比对，被单向量稀释的概念信号被救回来。';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className={mode === 'flat' ? 'active' : ''}
          onClick={() => switchMode('flat')}
        >
          压扁成一个向量
        </button>
        <button
          type="button"
          className={mode === 'slice' ? 'active' : ''}
          onClick={() => switchMode('slice')}
        >
          切成 5 片
        </button>
      </div>
      <div className="ctrl">
        <span>点查询看对应片段：</span>
        {FACETS.map((f, i) => (
          <button
            key={f.sym}
            type="button"
            className={sel === i ? 'active' : ''}
            onClick={() => pickQuery(i)}
          >
            {QS[i]} {f.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 'slice' ? 'good' : ''}`}>{fb}</div>
    </div>
  );
};
