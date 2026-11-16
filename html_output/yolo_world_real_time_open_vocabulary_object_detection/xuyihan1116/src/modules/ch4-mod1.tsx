import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawLabel,
  drawLegend,
  drawMeter,
  useCanvas,
} from '../lib/classKit';

// 相似度头：六个示意目标先和词做归一化点积（base），再乘可学缩放 α、加可学偏移 β，
// 最后 clamp 到 [0,1] 当分数看。拖两个滑块，看这一排条挤在一起还是被拉开。

const W = 1080;
const H = 280;

// 示意 base：归一化点积本身（只比方向，所以数值不大）
const BASE = [0.033, 0.019, 0.016, 0.014, 0.011, 0.006];
const TRACK_X = 120;
const TRACK_W = 380;
const ROW_TOP = 40;
const ROW_H = 22;
const ROW_GAP = 33;

const MIN_ALPHA = 0.5;
const MAX_ALPHA = 30;
const LN_MIN = Math.log(MIN_ALPHA);
const LN_SPAN = Math.log(MAX_ALPHA) - LN_MIN;

type S = { alpha: number; beta: number };
type Verdict = { text: string; cls: string; word: string; color: string };

function alphaFromSlider(v: number): number {
  return MIN_ALPHA * Math.exp((LN_SPAN * clamp(v, 0, 1000)) / 1000);
}

function sliderFromAlpha(alpha: number): number {
  return Math.round((1000 * (Math.log(alpha) - LN_MIN)) / LN_SPAN);
}

function scores(s: S): number[] {
  return BASE.map((b) => clamp(s.alpha * b + s.beta, 0, 1));
}

function verdictOf(s: S): Verdict {
  if (s.alpha < 3) {
    return {
      text: '缩放太小：所有条挤在一起，分不出谁像。',
      cls: 'bad',
      word: '挤在一起',
      color: COLORS.bad,
    };
  }
  if (s.alpha > 20) {
    return {
      text: '缩放很大：差距被拉得很开，但小分差容易被放大成误判。',
      cls: '',
      word: '拉开过头',
      color: COLORS.name,
    };
  }
  if (Math.abs(s.beta) > 0.005) {
    return {
      text: '偏移不为 0：整体抬高或压低，会影响阈值判断。',
      cls: '',
      word: '整体偏移',
      color: COLORS.name,
    };
  }
  return {
    text: '缩放合适、偏移居中：对得上的明显高出一截。',
    cls: 'good',
    word: '分得清楚',
    color: COLORS.fast,
  };
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [alpha, setAlpha] = useState(10);
  const [beta, setBeta] = useState(0);
  const [fb, setFb] = useState<Verdict>(verdictOf({ alpha: 10, beta: 0 }));
  const stateRef = useRef<S>({ alpha: 10, beta: 0 });

  const { ref } = useCanvas<S>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const v = scores(s);
      const sorted = v.slice().sort((a, b) => b - a);
      const margin = clamp(sorted[0] - sorted[1], 0, 1);
      const topIndex = v.indexOf(sorted[0]);
      const vd = verdictOf(s);

      // 六条相似度条
      for (let i = 0; i < v.length; i += 1) {
        const y = ROW_TOP + i * ROW_GAP;
        const isTop = i === topIndex;

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = COLORS.desk;
        ctx.fillRect(TRACK_X, y, TRACK_W, ROW_H);
        ctx.restore();

        const bw = TRACK_W * v[i];
        if (bw > 1) {
          ctx.save();
          ctx.fillStyle = isTop ? COLORS.fast : COLORS.name;
          ctx.fillRect(TRACK_X, y, bw, ROW_H);
          ctx.restore();
        }

        ctx.save();
        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(TRACK_X, y, TRACK_W, ROW_H);
        ctx.restore();

        drawLabel(ctx, String(i + 1), TRACK_X - 14, y + 16, {
          size: 12,
          color: isTop ? COLORS.chalk : COLORS.chalkDim,
          align: 'right',
        });
        drawLabel(ctx, v[i].toFixed(2), TRACK_X + TRACK_W + 10, y + 16, {
          size: 12,
          color: isTop ? COLORS.fast : COLORS.chalkDim,
        });
      }

      // 最高一条与第二名之间的差值，直接标在缺口上
      const x1 = TRACK_X + TRACK_W * sorted[0];
      const x2 = TRACK_X + TRACK_W * sorted[1];
      if (x1 - x2 > 18) {
        ctx.save();
        ctx.strokeStyle = COLORS.book;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x2, ROW_TOP + ROW_H / 2);
        ctx.lineTo(x1, ROW_TOP + ROW_H / 2);
        ctx.moveTo(x2, ROW_TOP + 5);
        ctx.lineTo(x2, ROW_TOP + ROW_H - 5);
        ctx.moveTo(x1, ROW_TOP + 5);
        ctx.lineTo(x1, ROW_TOP + ROW_H - 5);
        ctx.stroke();
        ctx.restore();
      }

      // 右：判定裕度
      drawLabel(ctx, '判定裕度', 700, 96, { size: 15, color: COLORS.chalk, bold: true });
      drawMeter(ctx, 700, 110, 280, 22, clamp(margin / 0.35, 0, 1), {
        muted: s.alpha < 3 || s.alpha > 20,
      });
      drawLabel(ctx, margin.toFixed(2), 1032, 126, {
        size: 13,
        color: COLORS.chalkDim,
        align: 'right',
      });
      drawLabel(ctx, vd.word, 700, 178, { size: 16, color: vd.color });

      drawLegend(ctx, 40, 262, [
        { color: COLORS.fast, text: '最高' },
        { color: COLORS.name, text: '其余' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const commit = (next: S) => {
    stateRef.current = next;
    setAlpha(next.alpha);
    setBeta(next.beta);
    setFb(verdictOf(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          缩放 α <span className="val">{alpha.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderFromAlpha(alpha)}
          aria-label="缩放 α（对数刻度 0.5–30）"
          onChange={(e) => commit({ alpha: alphaFromSlider(Number(e.target.value)), beta })}
        />
        <label>
          偏移 β <span className="val">{(beta >= 0 ? '+' : '') + beta.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={-50}
          max={50}
          step={1}
          value={Math.round(beta * 100)}
          aria-label="偏移 β（−0.5–0.5）"
          onChange={(e) => commit({ alpha, beta: Number(e.target.value) / 100 })}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch4Mod1;
