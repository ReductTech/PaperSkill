import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6.1 — full data-pipeline walkthrough (P2 step-through, paper §3).
// Steps: event segmentation -> coarse classification -> branch annotation ->
// caption merge & refine (normalize -> Router-R1 -> planning+generation).
const W = 1080;
const H = 280;
const MAX_STEP = 4;
const STAGE = ['事件切分', '分类画像', '分支标注', '描述合并'];

export const C6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，走完数据管道的完整流程。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      if (k === 1) {
        // §3.1 event segmentation
        ctx.fillStyle = '#b8c9a7';
        ctx.fillRect(60, 130, 960, 44);
        // fixed windows (contrast, red dashed)
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.5;
        for (let x = 60; x <= 1020; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x, 120);
          ctx.lineTo(x, 186);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // natural event boundaries (orange)
        [260, 430, 700, 880].forEach((x) => {
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, 116);
          ctx.lineTo(x, 188);
          ctx.stroke();
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('按自然事件边界切分（而非固定窗口）', 60, 100);
        ctx.fillStyle = '#c43f52';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('红色虚线 = 固定窗口，会切断完整事件', 60, 210);
        ctx.fillStyle = '#68778f';
        ctx.fillText('用帧级 SED（BEATs/PretrainedSED）检测事件；>60s 非语音事件不参与边界', 60, 236);
      } else if (k === 2) {
        // §3.1 coarse classification
        const segs = [
          { x: 60, w: 200, label: '语音' },
          { x: 260, w: 170, label: '音乐' },
          { x: 430, w: 270, label: '环境声' },
          { x: 700, w: 180, label: '语音' },
          { x: 880, w: 140, label: '环境声' },
        ];
        segs.forEach((s) => {
          ctx.fillStyle = '#27446e';
          ctx.fillRect(s.x, 130, s.w - 6, 44);
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(s.label, s.x + 10, 157);
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('映射到 9 类粗粒度，得到每段的多标签画像', 60, 100);
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('类别：语音 / 人声 / 歌唱 / 音乐 / 自然声 / 声源模糊 / 物体声 / 环境 / 动物', 60, 210);
      } else if (k === 3) {
        // §3.3-3.5 branch annotation
        const branches = [
          { y: 44, name: '语音分支', tools: 'DiariZen 说话人分割 → 说话人描述' },
          { y: 112, name: '音乐分支', tools: 'MIR + SongFormer 结构 + 歌词 ASR' },
          { y: 180, name: '通用音频分支', tools: '事件检测 + 全局锚点 + 融合生成 + LLM judge' },
        ];
        branches.forEach((b) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(60, b.y, 700, 52);
          ctx.strokeStyle = '#7c3aed';
          ctx.lineWidth = 2;
          ctx.strokeRect(60, b.y, 700, 52);
          ctx.fillStyle = '#21324a';
          ctx.font = '15px "Segoe UI", sans-serif';
          ctx.fillText(b.name, 78, b.y + 22);
          ctx.fillStyle = '#68778f';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(b.tools, 78, b.y + 42);
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('内容自适应路由到三个分支，分别标注', 60, 30);
      } else if (k === 4) {
        // §3.6 caption merge & refine
        const stages = ['归一化', 'Router-R1', '规划+生成', '统一描述'];
        let x = 60;
        stages.forEach((s, i) => {
          ctx.fillStyle = i === 3 ? '#228d5c' : '#27446e';
          ctx.fillRect(x, 120, 180, 52);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText(s, x + 16, 151);
          if (i < 3) {
            ctx.strokeStyle = '#21324a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 185, 146);
            ctx.lineTo(x + 213, 146);
            ctx.stroke();
          }
          x += 225;
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('归一化 → Router-R1 先验路由 → 规划+生成合成', 60, 90);
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('归一化到 tool_results 接口；Router-R1 用语音/音乐/事件先验决定证据顺序', 60, 210);
      } else {
        ctx.fillStyle = '#b8c9a7';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('点击“下一步”，依次查看：事件切分 → 分类画像 → 分支标注 → 描述合并。', 60, 140);
      }
    };
    const tick = () => {
      render(stateRef.current.step);
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

  const go = (d: number) => {
    const s = Math.max(0, Math.min(MAX_STEP, step + d));
    stateRef.current.step = s;
    setStep(s);
    const msgs = [
      '点击下一步，走完数据管道的完整流程。',
      '第 1 步：按自然事件边界切分，避免固定窗口切断完整事件。',
      '第 2 步：映射到 9 类粗粒度，得到每段的多标签画像。',
      '第 3 步：内容自适应路由到语音 / 音乐 / 通用音频三个分支分别标注。',
      '第 4 步：归一化 → Router-R1 先验路由 → 规划+生成，合成统一描述。',
    ];
    setFb({ text: msgs[s], cls: s === MAX_STEP ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === MAX_STEP}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">
          {step === 0 ? '未开始' : STAGE[step - 1]} · 第 {step} 步 / {MAX_STEP}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C6Mod1;
