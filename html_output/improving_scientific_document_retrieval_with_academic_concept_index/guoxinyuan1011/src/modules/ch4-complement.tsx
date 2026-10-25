import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 3.1（互补交叉分析 · 方案甲）
// 命题：主题识别与短语识别粒度不同，却互相有帮助 —— 同一共享编码器接两个 Softmax 头，损失相加（公式 3-3）。
// 画面：文档 d → 概念抽取器（MMoE · 3 专家 + 门控）→ 分叉出主题头 / 短语头，两头之间一条紫色互帮弧。
// 自包含：只 import react 与 ../lib/canvasKit，具名导出 Ch4Complement。

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
  blueFill: '#e6f1fb',
  green: '#228d5c',
  greenFill: '#e6f4ec',
  aux: '#7c3aed',
  card: '#f1efe8',
  cardLine: '#a8a49b',
};

type Mode = 'topic' | 'phrase' | 'both';
type Out = { name: string; p: number };

const TOPIC_OUT: Out[] = [
  { name: '推荐系统', p: 0.82 },
  { name: '信息检索', p: 0.11 },
  { name: '机器学习', p: 0.07 },
];
const PHRASE_OUT: Out[] = [
  { name: '冷启动问题', p: 0.74 },
  { name: '播放列表续接', p: 0.18 },
  { name: '协同过滤', p: 0.08 },
];
// 双头互补时（机制示意，非论文消融数据）：主题的证据让短语头更聚焦
const PHRASE_OUT_BOOST: Out[] = [
  { name: '冷启动问题', p: 0.91 },
  { name: '播放列表续接', p: 0.06 },
  { name: '协同过滤', p: 0.03 },
];
const EXPERTS = ['E1', 'E2', 'E3'];

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
  width = 1.6
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

export const Ch4Complement: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('both');
  const [mode, setMode] = useState<Mode>('both');
  const [feedback, setFeedback] = useState({
    text: '两个头共享同一套表征 —— 一个学得好，会顺带帮另一个。',
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

    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const m = modeRef.current;
      const pulse = (Math.sin((now - t0) / 620) + 1) / 2;
      const topicOn = m === 'topic' || m === 'both';
      const phraseOn = m === 'phrase' || m === 'both';
      const arcOn = m === 'both';
      const phrase = arcOn ? PHRASE_OUT_BOOST : PHRASE_OUT;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.field;
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';
      ctx.lineCap = 'butt';

      // ── 文档 d
      roundRect(ctx, 36, 100, 118, 66, 9);
      ctx.fillStyle = C.card;
      ctx.fill();
      ctx.strokeStyle = C.cardLine;
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, '文档 d', 95, 126, '#4b4a45', 15, 'center');
      text(ctx, '标题 + 摘要', 95, 148, '#7a776e', 12, 'center');

      // ── d → 抽取器
      arrow(ctx, 156, 133, 200, 148, '#b9c2cc', 1.6);

      // ── 概念抽取器（MMoE · 3 专家 + 门控）
      roundRect(ctx, 206, 42, 268, 196, 10);
      ctx.fillStyle = '#fbfcfe';
      ctx.fill();
      ctx.strokeStyle = topicOn || phraseOn ? C.blue : C.line;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      text(ctx, '概念抽取器', 340, 72, C.ink, 15, 'center', true);
      text(ctx, 'MMoE · 3 个专家', 340, 91, C.muted, 12, 'center');
      EXPERTS.forEach((e, i) => {
        const x = 226 + i * 82;
        roundRect(ctx, x, 104, 68, 38, 8);
        ctx.fillStyle = C.blueFill;
        ctx.fill();
        ctx.strokeStyle = '#9dc2e8';
        ctx.lineWidth = 1;
        ctx.stroke();
        text(ctx, e, x + 34, 128, C.blue, 13.5, 'center', true);
      });
      roundRect(ctx, 226, 154, 228, 26, 7);
      ctx.fillStyle = '#eef4fb';
      ctx.fill();
      ctx.strokeStyle = '#c3d7ee';
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, 'MMoE 门控 g', 340, 172, C.blue, 12.5, 'center');
      text(ctx, '共享编码器 · 每专家两层 MLP', 340, 210, C.faint, 11.5, 'center');

      // ── 抽取器 → 两个头
      arrow(ctx, 474, 150, 530, 76, topicOn ? '#7fb2e0' : '#d7deea', 1.8);
      arrow(ctx, 474, 150, 530, 208, phraseOn ? '#8fc9ab' : '#d7deea', 1.8);

      // ── 主题头
      roundRect(ctx, 536, 30, 400, 92, 10);
      ctx.fillStyle = topicOn ? C.blueFill : '#fbfcfe';
      ctx.fill();
      ctx.strokeStyle = topicOn ? C.blue : C.line;
      ctx.lineWidth = topicOn ? 1.8 : 1;
      ctx.stroke();
      text(ctx, '主题头 · |T| 维 Softmax', 552, 52, topicOn ? C.blue : C.faint, 13, 'left', true);
      TOPIC_OUT.forEach((o, i) => {
        const x = 552 + i * 128;
        roundRect(ctx, x, 62, 120, 24, 6);
        ctx.fillStyle = topicOn ? '#ffffff' : '#f6f8fb';
        ctx.fill();
        ctx.strokeStyle = topicOn ? '#c3d7ee' : '#e4e9f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        text(ctx, `${o.name} ${o.p.toFixed(2)}`, x + 60, 78, topicOn ? C.ink : C.faint, 12.5, 'center');
      });
      text(ctx, '粒度粗 · 给全局定调', 552, 106, topicOn ? C.muted : C.faint, 11.5);

      // ── 短语头
      roundRect(ctx, 536, 162, 400, 92, 10);
      ctx.fillStyle = phraseOn ? C.greenFill : '#fbfcfe';
      ctx.fill();
      ctx.strokeStyle = phraseOn ? C.green : C.line;
      ctx.lineWidth = phraseOn ? 1.8 : 1;
      ctx.stroke();
      text(ctx, '短语头 · |P| 维 Softmax', 552, 184, phraseOn ? C.green : C.faint, 13, 'left', true);
      phrase.forEach((o, i) => {
        const x = 552 + i * 128;
        roundRect(ctx, x, 194, 120, 24, 6);
        ctx.fillStyle = phraseOn ? '#ffffff' : '#f6f8fb';
        ctx.fill();
        ctx.strokeStyle = phraseOn ? '#b8ddc9' : '#e4e9f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        text(ctx, `${o.name} ${o.p.toFixed(2)}`, x + 60, 210, phraseOn ? C.ink : C.faint, 12.5, 'center');
      });
      text(ctx, '粒度细 · 抓具体任务名', 552, 238, phraseOn ? C.muted : C.faint, 11.5);

      // ── 两头之间的互帮弧（共享表征互相帮忙）
      ctx.strokeStyle = arcOn ? C.aux : '#ded5f2';
      ctx.lineWidth = arcOn ? 2.4 : 1.4;
      if (!arcOn) ctx.setLineDash([6, 5]);
      ctx.globalAlpha = arcOn ? 0.55 + pulse * 0.45 : 0.45;
      ctx.beginPath();
      ctx.moveTo(942, 76);
      ctx.quadraticCurveTo(1018, 142, 942, 208);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      if (arcOn) {
        ctx.beginPath();
        ctx.arc(988, 142, 15, 0, Math.PI * 2);
        ctx.fillStyle = C.aux;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 14px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.fillText('互助', 988, 147);
        ctx.textAlign = 'left';
      }

      // ── 底部实例
      text(
        ctx,
        '判出「推荐系统」主题 → 有助于确认「冷启动问题」是核心短语；反过来，短语证据也让主题判定更聚焦。',
        36,
        284,
        C.muted,
        12.5
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
      m === 'topic'
        ? { text: '只看主题头：判定这是「推荐系统」。粒度粗，但给整篇定调。', cls: '' }
        : m === 'phrase'
          ? { text: '只看短语头：抓到「冷启动问题」。粒度细，缺上下文时容易跑偏。', cls: '' }
          : {
              text: '双头互补：共享表征、两项交叉熵相加（公式 3-3）—— 主题定调、短语定细节。概率变化为机制示意。',
              cls: 'good',
            }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'topic' ? 'on' : ''} onClick={() => pick('topic')}>
          只看主题头
        </button>
        <button type="button" className={mode === 'phrase' ? 'on' : ''} onClick={() => pick('phrase')}>
          只看短语头
        </button>
        <button type="button" className={mode === 'both' ? 'on' : ''} onClick={() => pick('both')}>
          双头互补
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
