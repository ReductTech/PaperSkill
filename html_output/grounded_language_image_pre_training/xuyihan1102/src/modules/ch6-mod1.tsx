import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawList,
  drawMeter,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/roomKit';

// Module 6.1 — one slider for the amount of grounding data (0 – 0.8M rows). The list panel
// visibly grows and the LVIS rare-class APr meter follows 13.5 -> 17.7.

const W = 1080;
const H = 280;

const DATA_MAX = 0.8;
const APR_BASE = 13.5;
const APR_GAIN = 4.2;

const apron = (data: number) => APR_BASE + APR_GAIN * Math.min(data / DATA_MAX, 1);

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [data, setData] = useState(0);
  const stateRef = useRef({ data: 0 });
  const [feedback, setFeedback] = useState({
    text: '不加 grounding：罕见类几乎认不出来。',
    cls: '',
  });

  const apr = apron(data);
  const frac = Math.min(data / DATA_MAX, 1);
  const lines = 8 + Math.round(24 * frac);

  const { ref } = useCanvas<{ data: number }>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const f = Math.min(s.data / DATA_MAX, 1);
      const rows = 8 + Math.round(24 * f);
      const value = apron(s.data);
      const tall = 130 + 90 * f;

      // the list, growing line by line
      drawList(ctx, 40, 34, 500, tall, { lines: rows });

      // LVIS rare-class AP meter: 13.5 -> 17.7, baseline marked at 13.5
      drawMeter(ctx, 640, 96, 340, 26, value / 30, { label: 'LVIS APr', axisMax: 30 });
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(640 + 340 * (APR_BASE / 30), 92);
      ctx.lineTo(640 + 340 * (APR_BASE / 30), 126);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.muted;
      ctx.stroke();
      ctx.restore();

      const band = s.data < 0.2 ? COLORS.warn : s.data < 0.7 ? COLORS.box : COLORS.thread;
      drawLabel(ctx, value.toFixed(1), 640, 80, { color: band, size: 18, bold: true });

      // vocabulary size, a qualitative scale (数万 -> 十万级 phrases)
      drawMeter(ctx, 640, 176, 340, 20, f, { label: '词表规模' });

      drawLegend(ctx, 640, 250, [
        { color: COLORS.warn, text: '起点 13.5' },
        { color: COLORS.box, text: '在涨' },
        { color: COLORS.thread, text: 'GoldG' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current = { data: v };
    setData(v);
    if (v < 0.2) {
      setFeedback({
        text: `没有 grounding 数据：LVIS 罕见类 APr 只有 ${apron(v).toFixed(1)}。`,
        cls: 'bad',
      });
    } else if (v < 0.7) {
      setFeedback({
        text: `加到 ${v.toFixed(2)}M：APr 在涨，罕见类开始被认出来。`,
        cls: '',
      });
    } else {
      setFeedback({
        text: `加到 ${v.toFixed(2)}M（论文的 GoldG 规模）：APr ${apron(v).toFixed(1)}，+${(
          apron(v) - APR_BASE
        ).toFixed(1)}。`,
        cls: 'good',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          grounding 数据 <span className="val">{data.toFixed(2)}M</span>
        </label>
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={Math.round(data * 100)}
          onChange={onChange}
          aria-label="grounding 数据量（百万条）"
        />
        <span className="val">APr {apr.toFixed(1)}</span>
        <span className="val">{lines} 行</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div className="hotspot-info">
        <b>同一组消融的完整数字</b>（零样本 COCO 2017val）：换掉分类器的 GLIP-T (A) 42.9，
        加深度融合的 GLIP-T (B) 44.9，再加 80 万条人工 grounding 数据的 GLIP-T (C) 46.7。
        LVIS MiniVal 的罕见类 APr 同步从 14.2 → 13.5 → 17.7（A/B/C）。
      </div>
    </div>
  );
};

export default Ch6Mod1;
