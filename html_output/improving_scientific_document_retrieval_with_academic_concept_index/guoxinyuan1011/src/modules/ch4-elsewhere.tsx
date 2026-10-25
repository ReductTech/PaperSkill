import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.3（之后的情况 · 方案甲）
// 命题：索引产出后往哪儿去 —— ȳ 交给下游两条链，各取所需。
// 画面：候选集 + ŷ 权重 → 概念丰富 → 学术概念索引卡 → 分叉到 CCQGen / CCExpand。
// 主导操作：切换「补入前 / 补入后」，索引卡里被补进来的概念（紫色）当场出现。
// 自包含：只 import react 与 ../lib/canvasKit，具名导出 Ch4Elsewhere。

const W = 1080;
const H = 280;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const C = {
  field: '#f5f8f0',
  ink: '#21324a',
  muted: '#68778f',
  faint: '#9aa3ae',
  line: '#d7deea',
  blue: '#185fa5',
  blueFill: '#e6f1fb',
  blueLine: '#c3d7ee',
  aux: '#7c3aed',
  auxFill: '#f3ecff',
  auxLine: '#d9c8f7',
  card: '#f1efe8',
  cardLine: '#a8a49b',
  green: '#228d5c',
  greenFill: '#e6f4ec',
};

type Mode = 'before' | 'after';

const BASE_CHIPS = ['推荐系统', '协同过滤', '矩阵分解', '长尾分布', '向量检索', '查询扩展'];
const ADDED_CHIPS = ['冷启动', '过滤泡'];
const CHIP_X = [512, 628];
const CHIP_W = 108;
const CHIP_H = 20;

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

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1.8
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 8;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.42), y2 - s * Math.sin(a - 0.42));
  ctx.lineTo(x2 - s * Math.cos(a + 0.42), y2 - s * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
}

export const Ch4Elsewhere: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('before');
  const [mode, setMode] = useState<Mode>('before');
  const [feedback, setFeedback] = useState({
    text: '索引只收 LLM 明写出来的概念。',
    cls: '',
  });

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
      const after = modeRef.current === 'after';
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.field;
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';
      ctx.lineCap = 'butt';

      // ── 输入：候选集 + ŷ 权重
      roundRect(ctx, 36, 92, 156, 96, 9);
      ctx.fillStyle = C.card;
      ctx.fill();
      ctx.strokeStyle = C.cardLine;
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, '候选集', 114, 120, '#4b4a45', 14, 'center', true);
      text(ctx, '主题 + 短语', 114, 140, '#7a776e', 12, 'center');
      text(ctx, 'ŷ 重要性权重', 114, 164, C.blue, 12, 'center');

      arrow(ctx, 196, 140, 232, 140, '#b9c2cc');

      // ── 概念丰富
      roundRect(ctx, 236, 72, 214, 136, 10);
      ctx.fillStyle = C.auxFill;
      ctx.fill();
      ctx.strokeStyle = C.auxLine;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      text(ctx, '概念丰富', 343, 104, C.aux, 15, 'center', true);
      text(ctx, 'ȳ 不只收 LLM 选中的', 343, 132, C.ink, 12, 'center');
      text(ctx, '还补入模型判为强相关的', 343, 150, C.ink, 12, 'center');
      text(ctx, '（没被明写出来的那批）', 343, 170, C.faint, 11.5, 'center');

      arrow(ctx, 450, 140, 492, 140, '#b9c2cc');

      // ── 学术概念索引卡
      roundRect(ctx, 496, 44, 268, 192, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      text(ctx, '学术概念索引', 512, 68, C.ink, 14, 'left', true);
      text(ctx, 'ȳᵗ_d 15 主题 · ȳᵖ_d 20 短语', 512, 88, C.muted, 11.5);

      const chips = after ? [...BASE_CHIPS, ...ADDED_CHIPS] : BASE_CHIPS;
      chips.forEach((c, i) => {
        const added = i >= BASE_CHIPS.length;
        const x = CHIP_X[i % 2];
        const y = 104 + Math.floor(i / 2) * 26;
        roundRect(ctx, x, y, CHIP_W, CHIP_H, 6);
        ctx.fillStyle = added ? C.auxFill : C.blueFill;
        ctx.fill();
        ctx.strokeStyle = added ? C.auxLine : C.blueLine;
        ctx.lineWidth = added ? 1.4 : 1;
        ctx.stroke();
        text(ctx, c, x + CHIP_W / 2, y + 14, added ? C.aux : C.blue, 11.5, 'center', added);
      });

      // ── 分叉到两条下游链
      arrow(ctx, 764, 140, 802, 96, '#b9c2cc');
      arrow(ctx, 764, 140, 802, 186, '#b9c2cc');

      roundRect(ctx, 806, 56, 234, 80, 10);
      ctx.fillStyle = C.blueFill;
      ctx.fill();
      ctx.strokeStyle = C.blueLine;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      text(ctx, 'CCQGen', 824, 86, C.blue, 14, 'left', true);
      text(ctx, '用 ȳᵖ_d 找缺口 π', 824, 108, C.ink, 12);

      roundRect(ctx, 806, 144, 234, 80, 10);
      ctx.fillStyle = C.greenFill;
      ctx.fill();
      ctx.strokeStyle = '#b8ddc9';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      text(ctx, 'CCExpand', 824, 174, C.green, 14, 'left', true);
      text(ctx, '概念聚焦的片段匹配', 824, 196, C.ink, 12);

      // ── 脚注
      text(
        ctx,
        '两条下游链共用这份索引：CCQGen 拿它找「该覆盖却没覆盖」的概念缺口，CCExpand 拿它做概念聚焦的片段挑选。',
        36,
        268,
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

  const pick = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    setFeedback(
      m === 'before'
        ? { text: '补入前：索引只收 LLM 明写出来的那 6 个概念。', cls: '' }
        : {
            text: '补入后：紫色那两个（冷启动 / 过滤泡）文档没明写，却被模型判为强相关 —— 这就是概念丰富。',
            cls: 'good',
          }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'before' ? 'on' : ''} onClick={() => pick('before')}>
          补入前
        </button>
        <button type="button" className={mode === 'after' ? 'on' : ''} onClick={() => pick('after')}>
          补入后
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
