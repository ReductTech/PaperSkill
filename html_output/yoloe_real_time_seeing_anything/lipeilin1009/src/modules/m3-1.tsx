import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBird, drawCard, drawSceneLabel } from './birdKit';

// m3-1 (cls-vs-contrast) — 新旧对照：固定分类器 vs 嵌入对比，两个 520x280 同步画布。

const W = 520;
const H = 280;
const DURATION = 2.4;
const PLATES = ['麻雀', '鸽子', '乌鸦'];

export const M3_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const oldRef = useRef<HTMLCanvasElement>(null);
  const newRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ start: number; doneNotified: boolean }>({ start: -1, doneNotified: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击“开始对比”：同一只新鸟，两种认法。', cls: '' });

  useEffect(() => {
    const oldCanvas = oldRef.current;
    const newCanvas = newRef.current;
    if (!oldCanvas || !newCanvas) return;
    let oldCtx: CanvasRenderingContext2D;
    let newCtx: CanvasRenderingContext2D;
    try {
      oldCtx = setupCanvas(oldCanvas, W, H);
      newCtx = setupCanvas(newCanvas, W, H);
    } catch {
      return;
    }

    // 左：旧分类器——新鸟飞来，扫描三个名牌全不匹配，红“?”
    const renderOld = (p: number, t: number) => {
      clearScene(oldCtx, W, H);
      drawSceneLabel(oldCtx, '固定 80 类', 24, 32, PALETTE.muted);
      // 名牌列表
      PLATES.forEach((name, i) => {
        const y = 70 + i * 52;
        oldCtx.save();
        oldCtx.fillStyle = '#f3f5f9';
        oldCtx.strokeStyle = PALETTE.border;
        oldCtx.lineWidth = 1.5;
        oldCtx.beginPath();
        oldCtx.roundRect(30, y - 18, 90, 36, 6);
        oldCtx.fill();
        oldCtx.stroke();
        oldCtx.fillStyle = PALETTE.muted;
        oldCtx.font = '14px sans-serif';
        oldCtx.fillText(name, 52, y + 5);
        oldCtx.restore();
      });
      // 新鸟飞入
      const fly = easeOutCubic(clamp(p / 0.35, 0, 1));
      const bx = 560 - fly * 220;
      const by = 120;
      drawBird(oldCtx, bx, by, t, { body: PALETTE.purple });
      // 扫描线依次掠过名牌
      if (p > 0.4 && p < 0.9) {
        const si = Math.min(2, Math.floor((p - 0.4) / 0.17));
        const y = 70 + si * 52;
        oldCtx.save();
        oldCtx.strokeStyle = PALETTE.orange;
        oldCtx.lineWidth = 2.5;
        oldCtx.strokeRect(26, y - 22, 98, 44);
        // 不匹配叉
        oldCtx.strokeStyle = PALETTE.red;
        oldCtx.beginPath();
        oldCtx.moveTo(136, y - 8);
        oldCtx.lineTo(150, y + 6);
        oldCtx.moveTo(150, y - 8);
        oldCtx.lineTo(136, y + 6);
        oldCtx.stroke();
        oldCtx.restore();
      }
      // 末态红“?”
      if (p >= 0.9) {
        oldCtx.save();
        oldCtx.fillStyle = PALETTE.red;
        oldCtx.font = 'bold 26px sans-serif';
        oldCtx.fillText('?', bx - 5, by - 24);
        oldCtx.restore();
      }
    };

    // 右：嵌入对比——临时加“白鹭”卡片，相似度升到 0.83，绿名牌
    const renderNew = (p: number, t: number) => {
      clearScene(newCtx, W, H);
      drawSceneLabel(newCtx, '嵌入对比', 24, 32, PALETTE.blue);
      const fly = easeOutCubic(clamp(p / 0.35, 0, 1));
      const bx = 560 - fly * 220;
      const by = 120;
      drawBird(newCtx, bx, by, t, { body: PALETTE.purple });
      // 三张旧卡片（灰，低分）+ 新卡片
      CARDS_MINI.forEach((c, i) => {
        const y = 70 + i * 52;
        const isNew = i === 3;
        const appear = !isNew || p > 0.35;
        if (!appear) return;
        const rise = isNew ? easeOutCubic(clamp((p - 0.45) / 0.4, 0, 1)) : 0;
        const score = isNew ? 0.83 * rise : 0.12 + 0.1 * i;
        newCtx.save();
        newCtx.globalAlpha = isNew ? clamp((p - 0.35) / 0.15, 0, 1) : 1;
        drawCard(newCtx, 60, y - 14, { lines: 1, w: 40, h: 20, glow: isNew && p > 0.85 ? PALETTE.green : undefined });
        newCtx.fillStyle = isNew ? PALETTE.green : PALETTE.muted;
        newCtx.font = '11px sans-serif';
        newCtx.fillText(c, 46, y + 24);
        // 相似度条
        newCtx.fillStyle = '#eef2f7';
        newCtx.fillRect(120, y - 8, 150, 12);
        newCtx.fillStyle = isNew ? PALETTE.green : '#b9c2d0';
        newCtx.fillRect(120, y - 8, 150 * clamp(score, 0, 1), 12);
        newCtx.fillStyle = PALETTE.ink;
        newCtx.font = '12px sans-serif';
        newCtx.fillText(score.toFixed(2), 278, y + 3);
        newCtx.restore();
      });
      // 连线与绿名牌
      if (p > 0.85) {
        newCtx.save();
        newCtx.strokeStyle = PALETTE.green;
        newCtx.lineWidth = 2.5;
        newCtx.setLineDash([6, 5]);
        newCtx.beginPath();
        newCtx.moveTo(84, 222);
        newCtx.quadraticCurveTo(220, 190, bx - 14, by + 6);
        newCtx.stroke();
        newCtx.setLineDash([]);
        newCtx.fillStyle = PALETTE.green;
        newCtx.font = 'bold 15px sans-serif';
        newCtx.fillText('白鹭', bx - 14, by - 22);
        newCtx.restore();
      }
    };

    const CARDS_MINI = ['麻雀', '鸽子', '乌鸦', '白鹭'];

    const tick = () => {
      const t = performance.now() / 1000;
      const st = stateRef.current;
      const p = st.start < 0 ? 0 : clamp((t - st.start) / DURATION, 0, 1);
      renderOld(p, t);
      renderNew(p, t);
      if (st.start >= 0 && p >= 1 && !st.doneNotified) {
        st.doneNotified = true;
        setFeedback({
          text: '左边翻遍 80 页也找不到；右边临时加一张卡片就认出来了。',
          cls: 'good',
        });
      }
      [oldCanvas, newCanvas].forEach((c) => {
        if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const d1 = observeCanvas(oldCanvas, start, stop);
    const d2 = observeCanvas(newCanvas, () => {}, () => {});
    return () => {
      stop();
      d1();
      d2();
    };
  }, []);

  const onPlay = () => {
    stateRef.current.start = performance.now() / 1000;
    stateRef.current.doneNotified = false;
    setFeedback({ text: '同一只新鸟，两种认法……', cls: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}-old`}
          ref={oldRef}
          width={W}
          height={H}
          style={{ borderColor: PALETTE.orange }}
        />
        <canvas
          id={`cv-${chapterId}-${moduleId}-new`}
          ref={newRef}
          width={W}
          height={H}
          style={{ borderColor: PALETTE.blue }}
        />
      </div>
      <div className="ctrl">
        <button type="button" onClick={onPlay}>
          开始对比
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M3_1;
