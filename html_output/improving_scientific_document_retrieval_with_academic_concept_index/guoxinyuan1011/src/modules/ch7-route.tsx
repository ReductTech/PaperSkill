import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.2（argmax 路由 · §5.2）
// 命题：M=5 个片段里只挑与 q_test 最像的那一片当概念代表。
//      取平均会把最像的那片稀释掉，甚至比不用片段的基线还低
//      （Contriever-MS · CSFCube：0.3313 → 0.3268 → 0.3412，表 5）。
// 画面：左 = q_test 与 5 片的相似度（argmax 高亮最像的一片 / 平均模式出现混合条）；右 = N@10 对照。
// 自包含：只 import react 与 ../lib/canvasKit。

const W = 1080;
const H = 300;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

type Mode = 'base' | 'avg' | 'argmax';

const SNIPS = [
  { sym: 's¹', name: '矩阵分解', sim: 0.38 },
  { sym: 's²', name: '冷启动', sim: 0.71 },
  { sym: 's³', name: '过滤泡', sim: 0.44 },
  { sym: 's⁴', name: '神经协同过滤', sim: 0.52 },
  { sym: 's⁵', name: '序列推荐', sim: 0.35 },
];
const SIM_MAX = 0.8;
const AVG_SIM = SNIPS.reduce((a, s) => a + s.sim, 0) / SNIPS.length; // 0.48
const BEST = SNIPS.reduce((a, b) => (b.sim > a.sim ? b : a)); // s² / 0.71

const BASE_N10 = 0.3313;
const VALUES: Record<Mode, number> = { base: 0.3313, avg: 0.3268, argmax: 0.3412 };

const BN_X = 126;
const BN_W = 280;
const ROW0 = 72;
const ROW_DY = 28;
const BAR_H = 20;

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

export const Ch7Route: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('base');
  const [mode, setMode] = useState<Mode>('base');
  const [feedback, setFeedback] = useState({
    text: '不加任何扩展的原检索器：整篇文档一个向量，N@10 = 0.3313。',
    cls: '',
  });

  const select = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    if (m === 'base')
      setFeedback({
        text: '不加任何扩展的原检索器：整篇文档一个向量，N@10 = 0.3313。',
        cls: '',
      });
    else if (m === 'avg')
      setFeedback({
        text: '5 片取平均后 0.3268 —— 比基线还低。把 s²（0.71）和 s⁵（0.35）混在一起，最像的那片被稀释了。',
        cls: 'bad',
      });
    else
      setFeedback({
        text: 'argmax 只取最像的一片 s²：0.3412，超过基线。判别力最强的概念信号被完整保住。',
        cls: 'good',
      });
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
    const render = () => {
      const m = modeRef.current;
      const v = VALUES[m];

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 顶部
      text(ctx, '5 片里只挑最像的一片', 56, 28, '#4b4a45', 16.5, 'left', true);
      text(ctx, 'M = 5', 1030, 28, '#8a8780', 14, 'right');

      // ── 左：5 片相似度
      text(ctx, 'q_test 与 5 片的相似度（示意）', 56, 54, '#6b6a63', 13);
      SNIPS.forEach((s, i) => {
        const y = ROW0 + i * ROW_DY;
        const isBest = s === BEST;
        const on = m === 'argmax' && isBest;
        const alpha = m === 'base' ? 1 : on ? 1 : 0.4;
        const w = (s.sim / SIM_MAX) * BN_W;

        ctx.globalAlpha = alpha;
        text(ctx, s.sym, 96, y + 15, on ? '#d9611f' : '#68778f', 14, 'right', on);
        roundRect(ctx, BN_X, y, Math.max(w, 4), BAR_H, 5);
        ctx.fillStyle = on ? '#f07e47' : '#b5d4f4';
        ctx.fill();
        if (on) {
          ctx.strokeStyle = '#d9611f';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        text(
          ctx,
          s.sim.toFixed(2),
          BN_X + Math.max(w, 4) + 10,
          y + 15,
          on ? '#c43f52' : '#8a8780',
          14,
          'left',
          on
        );
        ctx.globalAlpha = 1;
      });

      // ── 平均模式的混合条
      if (m === 'avg') {
        const ay = ROW0 + 5 * ROW_DY + 4;
        roundRect(ctx, BN_X, ay, (AVG_SIM / SIM_MAX) * BN_W, BAR_H, 5);
        ctx.fillStyle = '#e8b7be';
        ctx.fill();
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        text(ctx, '5 片平均', 96, ay + 15, '#c43f52', 14, 'right', true);
        text(ctx, AVG_SIM.toFixed(2), BN_X + (AVG_SIM / SIM_MAX) * BN_W + 10, ay + 15, '#c43f52', 14, 'left', true);
      } else if (m === 'argmax') {
        text(ctx, '↑ argmax 只取这一片', BN_X + 14, ROW0 + ROW_DY + 15, '#ffffff', 13, 'left', true);
      }

      // ── 图例
      const legends: { c: string; t: string }[] =
        m === 'avg'
          ? [
              { c: '#b5d4f4', t: '5 片相似度' },
              { c: '#e8b7be', t: '混合后的平均' },
            ]
          : [
              { c: '#b5d4f4', t: '5 片相似度' },
              { c: '#f07e47', t: 'argmax 选中的一片' },
            ];
      let lx = 56;
      ctx.font = `14px ${SANS}`;
      for (const it of legends) {
        ctx.fillStyle = it.c;
        roundRect(ctx, lx, 248, 12, 12, 3);
        ctx.fill();
        text(ctx, it.t, lx + 18, 259, '#5c5a52', 14);
        lx += 30 + ctx.measureText(it.t).width + 20;
      }

      // ── 右：N@10 对照
      const bx = 600;
      const bw = 240;
      const yTop = 82;
      const yBot = 236;
      const vMin = 0.32;
      const vMax = 0.42;
      const yOf = (val: number) => map(val, vMin, vMax, yBot, yTop);

      text(ctx, 'N@10 · Contriever-MS · CSFCube', bx, 54, '#6b6a63', 13);
      ctx.strokeStyle = '#c7d0da';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, yBot);
      ctx.lineTo(bx + bw, yBot);
      ctx.stroke();

      const yv = yOf(v);
      ctx.fillStyle = m === 'argmax' ? '#378add' : m === 'avg' ? '#c43f52' : '#b5d4f4';
      ctx.fillRect(bx, yv, bw, yBot - yv);

      const yb = yOf(BASE_N10);
      ctx.strokeStyle = '#68778f';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, yb);
      ctx.lineTo(bx + bw, yb);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '基线 0.3313', bx - 10, yb + 5, '#5c5a52', 12.5, 'right', true);

      // ── 读数
      const diff = v - BASE_N10;
      text(ctx, `N@10 = ${v.toFixed(4)}`, 880, 110, '#21324a', 22, 'left', true);
      text(
        ctx,
        m === 'base' ? '对照基线' : `相对基线 ${diff >= 0 ? '+' : ''}${diff.toFixed(4)}`,
        880,
        142,
        m === 'argmax' ? '#228d5c' : m === 'avg' ? '#c43f52' : '#8a8780',
        17,
        'left',
        true
      );
      text(ctx, m === 'argmax' ? '只取 s²（0.71）' : m === 'avg' ? '5 片平均 0.48' : '不使用片段', 880, 178, '#5c5a52', 14);

      // ── 脚注
      text(
        ctx,
        '表 5：基线 0.3313 → 5 片平均 0.3268（反而更低）→ argmax 0.3412。相似度数值为示意，N@10 为论文实测。',
        56,
        286,
        '#8a8780',
        13
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chips: { id: Mode; t: string }[] = [
    { id: 'base', t: '基线（不用片段）' },
    { id: 'avg', t: '平均所有片段' },
    { id: 'argmax', t: '只取最像的一片' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {chips.map((c) => (
          <button key={c.id} className={mode === c.id ? 'active' : ''} onClick={() => select(c.id)}>
            {c.t}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
