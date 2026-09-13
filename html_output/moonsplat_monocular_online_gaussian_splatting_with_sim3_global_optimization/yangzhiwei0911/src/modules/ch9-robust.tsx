import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 拖动失效因子：滑块改变动态物体占比，芯片切换失效条件；
// 主图形（缝线 + 重影）与右侧置信度曲线同步响应。
const W = 1080;
const H = 280;

type Factor = 'dynamic' | 'far' | 'long';
interface Feedback {
  text: string;
  cls: '' | 'good' | 'bad';
}

const confidenceFor = (f: Factor, d: number): number => {
  if (f === 'dynamic') return 1 - 0.9 * d;
  if (f === 'far') return 1 - 0.75 * d;
  return 1 - 0.25 * d;
};

const ghostOf = (c: number): number => clamp((1 - c) * 1.1, 0, 1);

const feedbackFor = (c: number): Feedback => {
  const g = ghostOf(c);
  if (g < 0.3) return { text: '当前条件仍在模型的工作范围内，多视图渲染保持一致。', cls: 'good' };
  if (g < 0.6) return { text: '开始出现轻微失配，位姿估计的可靠性在下降。', cls: '' };
  return {
    text: '失配已经很明显：论文明确指出动态物体占比超过一定阈值会同时损害位姿估计与静态高斯的一致渲染。',
    cls: 'bad',
  };
};

const CHIP_TEXT: Record<Factor, string> = {
  dynamic: '当前条件仍在模型的工作范围内，多视图渲染保持一致。',
  far: '越远点图置信度越低，这是 MASt3R 先验本身的限制，室外场景受影响更明显。',
  long: '因子图边数随节点数线性增长；因为必须同时做 Sim(3) 全局优化，本方法不能把历史高斯卸载到磁盘。',
};

export const Ch9Robust: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    dyn: 0,
    sDyn: 0,
    factor: 'dynamic' as Factor,
    prevFactor: 'dynamic' as Factor,
    mix: 1,
  });
  const [dyn, setDyn] = useState(0);
  const [factor, setFactor] = useState<Factor>('dynamic');
  const [feedback, setFeedback] = useState<Feedback>(() => feedbackFor(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const clearScene = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    };

    const drawSetting = () => {
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(40, 140, 600, 74);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(40, 214, 600, 6);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(40, 140, 600, 80);
    };

    const drawSeam = (y: number) => {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(620, y);
      ctx.stroke();
      for (let x = 70; x <= 610; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
      }
    };

    const drawPanel = (f: Factor, cur: number, d: number, color: string) => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(660, 70, 380, 180);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(660, 70, 380, 180);

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(680, 167);
      ctx.lineTo(1020, 167);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        const c = confidenceFor(f, u);
        const px = 680 + u * 340;
        const py = 230 - c * 140;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(680 + d * 340, 230 - cur * 140, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(690, 244);
      ctx.lineTo(714, 244);
      ctx.stroke();
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(770, 244);
      ctx.lineTo(794, 244);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('置信度', 720, 249);
      ctx.fillText('阈值', 800, 249);
    };

    const render = () => {
      const s = stateRef.current;
      s.sDyn = lerp(s.sDyn, s.dyn, 0.16);
      s.mix = clamp(s.mix + 0.055, 0, 1);
      const conf = lerp(
        confidenceFor(s.prevFactor, s.sDyn),
        confidenceFor(s.factor, s.sDyn),
        easeInOutQuad(s.mix)
      );
      const ghost = clamp((1 - conf) * 1.1, 0, 1);
      const err = 0.02 + 0.55 * (1 - conf);
      const seamColor =
        ghost < 0.5
          ? lerpColor('#228d5c', '#f07e47', ghost / 0.5)
          : lerpColor('#f07e47', '#c43f52', (ghost - 0.5) / 0.5);

      clearScene();
      drawSetting();

      ctx.strokeStyle = seamColor;
      ctx.lineWidth = 2.5;
      drawSeam(177);

      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.moveTo(60, 177 + ghost * 26);
      ctx.lineTo(620, 177 + ghost * 26);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('重影', 60, 126);
      ctx.fillText(err.toFixed(2), 60, 248);

      drawPanel(s.factor, conf, s.sDyn, seamColor);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(conf.toFixed(2), 1012, 106);
      ctx.textAlign = 'left';
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

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.dyn = v;
    setDyn(v);
    setFeedback(feedbackFor(confidenceFor(stateRef.current.factor, v)));
  };

  const onChip = (f: Factor) => {
    const s = stateRef.current;
    s.prevFactor = s.factor;
    s.factor = f;
    s.mix = 0;
    setFactor(f);
    if (f === 'dynamic') {
      setFeedback(feedbackFor(confidenceFor(f, s.dyn)));
    } else {
      setFeedback({ text: CHIP_TEXT[f], cls: '' });
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <label>
          动态物体占比 <span className="val">{Math.round(dyn * 100)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(dyn * 100)} onChange={onSlide} />
      </div>
      <div className="chips">
        <button className={factor === 'dynamic' ? 'chip is-active' : 'chip'} onClick={() => onChip('dynamic')}>
          动态物体
        </button>
        <button className={factor === 'far' ? 'chip is-active' : 'chip'} onClick={() => onChip('far')}>
          远距离
        </button>
        <button className={factor === 'long' ? 'chip is-active' : 'chip'} onClick={() => onChip('long')}>
          超长序列
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Robust;
