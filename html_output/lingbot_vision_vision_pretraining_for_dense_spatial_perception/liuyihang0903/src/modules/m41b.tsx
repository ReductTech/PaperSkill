import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 1：目标生成五步 —— 从噪声场到干净目标（P2 分步）
const W = 560;
const H = 220;

const STEPS = [
  { title: '① 教师预测噪声场', desc: '每个位置输出带噪声的边界信息（离边界多远、边界朝哪、两端在哪）。', color: '#7c3aed' },
  { title: '② 分类化（连续→离散格子）', desc: '把连续值变成 K 个格子的概率分布——「选格子」比「猜连续数」稳定得多。', color: '#27446e' },
  { title: '③ 角点吸附 + 投票', desc: '线段提议的端点被拉到最近角点，同一角点对累计投票。', color: '#d97706' },
  { title: '④ a-contrario 统计检验', desc: 'NFA ≤ 1 才通过——剔掉「乱画也能凑出来」的候选。', color: '#c43f52' },
  { title: '⑤ 重渲染干净目标', desc: '只把验证过的线段重渲染成干净场，作为学生目标。', color: '#228d5c' },
];

export const M41B: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: STEPS[0].desc + ' 点击「下一步」走完整条生成链路。',
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
    const render = (s: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gx = 30;
      const gy = 30;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx, gy, 500, 150);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(gx, gy, 500, 150);

      // 底图房子轮廓（虚线）
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(gx + 120, gy + 40, 240, 80);
      ctx.setLineDash([]);

      const corners: Array<[number, number]> = [
        [gx + 120, gy + 40],
        [gx + 360, gy + 40],
        [gx + 120, gy + 120],
        [gx + 360, gy + 120],
      ];
      if (s >= 0) {
        // 噪声场（紫色杂乱小箭头）
        for (let i = 0; i < 46; i++) {
          const ax = gx + 120 + ((i * 97) % 240);
          const ay = gy + 40 + ((i * 61) % 80);
          const ang = Math.sin(i * 9.7) * Math.PI;
          ctx.strokeStyle = '#7c3aed';
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + Math.cos(ang) * 13, ay + Math.sin(ang) * 13);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      if (s >= 1) {
        // 分类化：几个格子概率条
        for (let i = 0; i < 4; i++) {
          const bx = gx + 150 + i * 40;
          const by = gy + 30;
          const prob = 0.15 + Math.abs(Math.sin(i * 3.1)) * 0.4;
          ctx.fillStyle = '#27446e';
          ctx.globalAlpha = 0.7;
          ctx.fillRect(bx, by + 60 - prob * 50, 22, prob * 50);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#9fb0c8';
          ctx.strokeRect(bx, by, 22, 60);
        }
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('K 格概率', gx + 145, gy + 100);
      }
      if (s >= 2) {
        // 角点 + 吸附后的线段
        for (const [cx, cy] of corners) {
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(gx + 120, gy + 40, 240, 80);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('投票：C1–C2 = 31', gx + 380, gy + 60);
      }
      if (s >= 3) {
        // a-contrario：剔除多余候选
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(gx + 120, gy + 40);
        ctx.lineTo(gx + 360, gy + 120);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#c43f52';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('✗ 被拒', gx + 240, gy + 88);
      }
      if (s >= 4) {
        // 干净目标（绿色实线）
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(gx + 120, gy + 40);
        ctx.lineTo(gx + 360, gy + 40);
        ctx.lineTo(gx + 360, gy + 120);
        ctx.lineTo(gx + 120, gy + 120);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = '#228d5c';
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 18;
        ctx.strokeRect(gx + 120, gy + 40, 240, 80);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('✓ 学生目标（干净场）', gx + 380, gy + 90);
      }

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(STEPS[s].title, 30, 24);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(`步骤 ${s + 1} / ${STEPS.length}`, 30, H - 8);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(0);
  stateRef.current = step;

  const go = (s: number) => {
    stateRef.current = s;
    setStep(s);
    setFeedback({ text: STEPS[s].desc, cls: s === STEPS.length - 1 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="btn" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="val">
          {step + 1} / {STEPS.length}
        </span>
        <button
          className="btn"
          onClick={() => go(step >= STEPS.length - 1 ? 0 : step + 1)}
          disabled={step >= STEPS.length - 1}
        >
          {step >= STEPS.length - 1 ? '重新开始' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41B;
