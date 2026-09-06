import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560;
const H = 280;
type Part = 'input' | 'vlm' | 'concat' | 'dit' | 'action';

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [part, setPart] = useState<Part>('vlm');
  const [fb, setFb] = useState({ text: '点击模块，追踪 Qwen3.5-4B VLM → DiT 1.15B 的数据流。', cls: '' });

  const isActive = (p: Part) => part === p;
  const dim = (p: Part) => (isActive(p) ? 1 : 0.35);

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    ctx.globalAlpha = dim('input');
    ctx.fillStyle = C.env;
    ctx.fillRect(16, 24, 100, 56);
    ctx.fillStyle = C.text;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('视觉 o_t', 32, 48);
    ctx.fillText('语言 x', 32, 64);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = dim('vlm');
    ctx.fillStyle = isActive('vlm') ? C.blue : '#5a7aa8';
    ctx.fillRect(140, 16, 130, 72);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Qwen3.5-4B', 158, 44);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('VLM 骨干', 168, 62);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = dim('concat');
    ctx.fillStyle = isActive('concat') ? C.orange : '#c9a066';
    ctx.fillRect(290, 36, 70, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拼接', 325, 52);
    ctx.fillText('隐状态', 325, 66);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;

    ctx.globalAlpha = dim('dit');
    ctx.fillStyle = isActive('dit') ? C.green : '#5a9a72';
    ctx.fillRect(380, 12, 150, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('DiT 动作专家', 400, 40);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('~1.15B · 16 blocks', 398, 58);
    ctx.fillText('AdaLN + 流匹配', 400, 74);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = dim('action');
    ctx.fillStyle = isActive('action') ? C.purple : '#9a8ac4';
    ctx.fillRect(470, 110, 74, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('动作块', 482, 134);
    ctx.fillText('Y_{0}', 490, 150);
    ctx.globalAlpha = 1;

    const highlight = (p: Part) => isActive(p);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = highlight('input') || highlight('vlm') ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(116, 52); ctx.lineTo(140, 52); ctx.stroke();
    ctx.lineWidth = highlight('vlm') || highlight('concat') ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(270, 52); ctx.lineTo(290, 56); ctx.stroke();
    ctx.lineWidth = highlight('concat') || highlight('dit') ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(360, 56); ctx.lineTo(380, 52); ctx.stroke();
    ctx.lineWidth = highlight('dit') || highlight('action') ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(455, 70); ctx.lineTo(470, 130); ctx.stroke();

    ctx.fillStyle = C.muted;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('Y_τ 噪声动作块 ──→ 联合自注意力 ──→ 欧拉积分输出', 16, 200);

    ctx.fillStyle = C.text;
    ctx.font = '12px "Segoe UI", sans-serif';
    const notes: Record<Part, string> = {
      input: '输入：图像/视频 + 语言指令 + embodiment prompt e',
      vlm: 'ViT 视觉 token 与文本交错；负责感知、grounding、推理',
      concat: 'VLM hidden states 与 noisy action chunk Y_τ 拼接为 DiT 输入',
      dit: '单流 DiT + 联合自注意力；16 blocks 占 1.15B 参数主体',
      action: '经少量欧拉步从 τ=1 积到 τ=0，输出 H 步连续控制',
    };
    ctx.fillText(notes[part], 16, 230);
  }, [part]);

  const pick = (p: Part) => {
    setPart(p);
    setFb({ text: '路径已高亮 — 点击其他模块继续探索。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={part === 'input' ? 'active' : ''} onClick={() => pick('input')}>输入</button>
        <button type="button" className={part === 'vlm' ? 'active' : ''} onClick={() => pick('vlm')}>VLM</button>
        <button type="button" className={part === 'concat' ? 'active' : ''} onClick={() => pick('concat')}>拼接</button>
        <button type="button" className={part === 'dit' ? 'active' : ''} onClick={() => pick('dit')}>DiT</button>
        <button type="button" className={part === 'action' ? 'active' : ''} onClick={() => pick('action')}>输出</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch8Mod1;
