import React, { useEffect, useRef, useState } from 'react';
import { clamp, map, observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  BORDER,
  EMPHASIS,
  SUCCESS,
  TEXT_MUTED,
  clearScene,
  drawSceneLabel,
  drawTable,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 模块 4.2：两根柱固定取自论文数值（多帧 94.2 / 单帧 98.2），切换芯片只改高亮、
// 说明区与反馈，绝不改柱高。VAE 特征一侧论文没有给出该消融的数值，因此不画数值柱。

const W = 1080;
const H = 280;
const BASELINE_Y = 230;
const BAR_MAX_H = 160;
const BAR_W = 100;
const BARS = [
  { value: 94.2, x: 200, color: TEXT_MUTED },
  { value: 98.2, x: 360, color: SUCCESS },
];
const BOX = { x: 580, y: 90, w: 460, h: 160 };

type Target = 'clip' | 'frame';
type Feature = 'semantic' | 'vae';

const FEEDBACK_CLIP = '整段视频监督：LIBERO 平均 94.2%，比只预测目标帧低 4.0 个百分点。';
const FEEDBACK_FRAME = '只预测目标帧这一步对了，特征还没选。';
const FEEDBACK_PAPER =
  '论文的选择：只预测目标帧 + VAE 特征。语义层已经由 h_t 承担，不必再叠一层语义先验。';

const TARGET_TEXT: Record<Target, string> = {
  clip: '整段视频（多帧）：把未来的整段画面都拿去监督。',
  frame: '目标帧（单帧）：只预测 o<sub>t+n</sub> 这一帧。',
};
const FEATURE_TEXT: Record<Feature, string> = {
  semantic: '语义特征：语义层已经由 h_t 承担，不必再叠一层语义先验。',
  vae: 'VAE 特征：让世界专家直接预测 o<sub>t+n</sub> 的 VAE 特征。',
};

function judge(target: Target, feature: Feature) {
  if (target === 'clip') return { text: FEEDBACK_CLIP, cls: 'bad' };
  if (feature === 'semantic') return { text: FEEDBACK_FRAME, cls: '' };
  return { text: FEEDBACK_PAPER, cls: 'good' };
}

export const Wla42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ target: Target; feature: Feature }>({
    target: 'clip',
    feature: 'semantic',
  });
  const [target, setTarget] = useState<Target>('clip');
  const [feature, setFeature] = useState<Feature>('semantic');
  const [feedback, setFeedback] = useState(judge('clip', 'semantic'));

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
      const { target: t, feature: f } = stateRef.current;
      const vae = f === 'vae';
      const featColor = vae ? SUCCESS : TEXT_MUTED;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [], bandTop: 16, bandBottom: 30 });

      // 基线
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(140, BASELINE_Y);
      ctx.lineTo(520, BASELINE_Y);
      ctx.stroke();

      // 两根柱：数值固定取自论文，不随切换变化
      BARS.forEach((bar, i) => {
        const barH = clamp(map(bar.value, 0, 100, 0, BAR_MAX_H), 0, BAR_MAX_H);
        const top = BASELINE_Y - barH;
        ctx.fillStyle = bar.color;
        ctx.fillRect(bar.x, top, BAR_W, barH);
        const selected = (t === 'clip' && i === 0) || (t === 'frame' && i === 1);
        if (selected) {
          ctx.fillStyle = EMPHASIS;
          ctx.fillRect(bar.x, top - 9, BAR_W, 9);
        }
        drawSceneLabel(ctx, String(bar.value), bar.x + BAR_W / 2, top - 18, { align: 'center' });
      });
      drawSceneLabel(ctx, 'LIBERO 平均', 140, 252, { color: TEXT_MUTED });

      // 特征说明区：边框色与内部小图随特征类型切换
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
      ctx.strokeStyle = featColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
      ctx.restore();

      const sx = BOX.x + 20;
      const sy = BOX.y + 58;
      const sw = BOX.w - 40;
      const sh = 78;
      ctx.save();
      ctx.strokeStyle = featColor;
      ctx.lineWidth = 2;
      if (!vae) ctx.setLineDash([6, 5]);
      ctx.strokeRect(sx, sy, sw, sh);
      if (vae) {
        ctx.fillStyle = 'rgba(34, 141, 92, 0.28)';
        ctx.fillRect(sx + 12, sy + 12, sw - 24, sh - 24);
      }
      ctx.restore();

      drawSceneLabel(ctx, vae ? 'VAE 特征' : '语义特征', sx, BOX.y + 32, { color: featColor });
    };

    const tick = () => {
      render();
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

  const chooseTarget = (next: Target) => {
    stateRef.current.target = next;
    setTarget(next);
    setFeedback(judge(next, stateRef.current.feature));
  };

  const chooseFeature = (next: Feature) => {
    stateRef.current.feature = next;
    setFeature(next);
    setFeedback(judge(stateRef.current.target, next));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        data-target={target}
        data-feature={feature}
      />
      <div className="chip-row">
        <span className="step-label">预测目标</span>
        <button
          type="button"
          className={`chip${target === 'clip' ? ' selected' : ''}`}
          onClick={() => chooseTarget('clip')}
        >
          整段视频
        </button>
        <button
          type="button"
          className={`chip${target === 'frame' ? ' selected' : ''}`}
          onClick={() => chooseTarget('frame')}
        >
          目标帧
        </button>
      </div>
      <div className="chip-row">
        <span className="step-label">特征</span>
        <button
          type="button"
          className={`chip${feature === 'semantic' ? ' selected' : ''}`}
          onClick={() => chooseFeature('semantic')}
        >
          语义特征
        </button>
        <button
          type="button"
          className={`chip${feature === 'vae' ? ' selected' : ''}`}
          onClick={() => chooseFeature('vae')}
        >
          VAE 特征
        </button>
      </div>
      <div className="step-ctrl">
        <span className="step-desc" dangerouslySetInnerHTML={{ __html: TARGET_TEXT[target] + FEATURE_TEXT[feature] }} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla42;
