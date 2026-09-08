import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1 Module 2：Teacher 与 Student 的来龙去脉（P2 分步讲故事）
const W = 560;
const H = 220;

const STEPS = [
  {
    title: '1. 没有“老师”会怎样？',
    desc: '自监督没有标注，模型只能自己给自己出题。如果直接拿自己的输出当答案，它会“自我欺骗”——所有输出塌缩成同一个常数，什么都没学到。',
    color: '#c43f52',
  },
  {
    title: '2. 于是引入“老师”Teacher',
    desc: '让一个更稳定的 Teacher 来出题。Teacher 不是另训练的网络，而是 Student 自己的“历史平均”（EMA 滑动平均）——比 Student 平滑、不会突然乱跳，所以能提供可靠的目标。',
    color: '#27446e',
  },
  {
    title: '3. 学生 Student 跟着学',
    desc: 'Student 接收梯度、不断更新，去对齐 Teacher 给的目标。注意梯度只流向 Student（stop-gradient）——Teacher 不出现在梯度里，只负责出题。',
    color: '#228d5c',
  },
  {
    title: '4. 师徒共同进化',
    desc: 'Student 越学越好，Teacher（它的历史平均）也跟着变好，出的题目越来越准——如此循环，目标质量一路上升。这就是自蒸馏的“来龙去脉”。',
    color: '#228d5c',
  },
];

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '点击「下一步」，按顺序弄清 Teacher 和 Student 是谁、为什么需要它们。',
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

      // Teacher 与 Student 两个框
      const teacher = { x: 90, y: 70, w: 160, h: 90 };
      const student = { x: 320, y: 70, w: 160, h: 90 };
      const box = (b: { x: number; y: number; w: number; h: number }, label: string, color: string, active: boolean) => {
        ctx.fillStyle = active ? color : '#ffffff';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = active ? color : '#9fb0c8';
        ctx.lineWidth = active ? 3 : 1.6;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(label, b.x + 20, b.y + 40);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(active ? '' : '稳定·出题', b.x + 20, b.y + 64);
        ctx.fillText(active ? '' : '更新·答题', b.x + 20, b.y + 80);
      };

      // 第 1 步：没有老师 → 学生塌缩（红色）
      if (s === 0) {
        box(teacher, 'Teacher', '#c43f52', false);
        box(student, 'Student', '#c43f52', true);
        // 学生内部塌缩示意（所有 patch 同色）
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = '#c43f52';
          ctx.globalAlpha = 0.25;
          ctx.fillRect(student.x + 14 + i * 28, student.y + 40, 20, 18);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('✗ 所有输出塌缩成一个常数', student.x - 60, student.y + 100);
      }
      // 第 2 步：引入 Teacher（蓝色）
      else if (s === 1) {
        box(teacher, 'Teacher', '#27446e', true);
        box(student, 'Student', '#27446e', false);
        // EMA 箭头 Student -> Teacher
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(student.x + 10, student.y + 82);
        ctx.lineTo(teacher.x + teacher.w - 10, teacher.y + 82);
        ctx.stroke();
        ctx.fillStyle = '#27446e';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('EMA 历史平均', teacher.x + teacher.w + 6, teacher.y + 78);
        ctx.fillText('←', student.x - 6, student.y + 86);
      }
      // 第 3 步：Student 学习（绿色）
      else if (s === 2) {
        box(teacher, 'Teacher', '#27446e', false);
        box(student, 'Student', '#228d5c', true);
        // 目标箭头 Teacher -> Student
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(teacher.x + teacher.w, teacher.y + 40);
        ctx.lineTo(student.x, student.y + 40);
        ctx.stroke();
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('提供目标', (teacher.x + teacher.w + student.x) / 2 - 22, teacher.y + 34);
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('✓ 对齐学习', student.x + 30, student.y + 108);
      }
      // 第 4 步：共同进化（绿色循环）
      else {
        box(teacher, 'Teacher', '#228d5c', true);
        box(student, 'Student', '#228d5c', true);
        // 双向：目标 + EMA
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(teacher.x + teacher.w, teacher.y + 40);
        ctx.lineTo(student.x, student.y + 40);
        ctx.stroke();
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(student.x + 10, student.y + 82);
        ctx.lineTo(teacher.x + teacher.w - 10, teacher.y + 82);
        ctx.stroke();
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('↺ 相互促进，目标越出越准', 200, 55);
      }

      // 步骤标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
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
    setFeedback({ text: STEPS[s].desc, cls: s >= 2 ? 'good' : s === 0 ? 'bad' : '' });
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

export default M12;
