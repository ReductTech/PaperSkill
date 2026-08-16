import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const STAGES = [
  { id: 't2a', name: 'I T2A', vlm: '冻结', dit: '训练', note: '无图像：语言→动作 decompressor' },
  { id: 'cpt', name: 'II CPT', vlm: '解冻', dit: '解冻', note: '异构混合数据视觉 grounding' },
  { id: 'sft', name: 'III SFT', vlm: '微调', dit: '微调', note: '多任务 + 真实机器人 teleop 分支' },
  { id: 'rl', name: 'IV RL', vlm: '微调', dit: '微调', note: 'SimplerEnv 稀疏奖励 → Instruct' },
];

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '点击阶段，查看 VLM 与 DiT 的训练状态。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const s = STAGES[idx];
    const vlmFrozen = s.vlm === '冻结';
    const ditFrozen = s.dit === '冻结';
    ctx.fillStyle = vlmFrozen ? '#e8ecf0' : C.blue;
    ctx.fillRect(40, 50, 220, 70);
    ctx.strokeStyle = vlmFrozen ? C.border : C.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 50, 220, 70);
    ctx.fillStyle = vlmFrozen ? C.muted : '#fff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('VLM (Qwen3.5-4B)', 60, 78);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(s.vlm, 60, 102);

    ctx.fillStyle = ditFrozen ? '#e8ecf0' : C.green;
    ctx.fillRect(300, 50, 220, 70);
    ctx.strokeStyle = ditFrozen ? C.border : C.green;
    ctx.strokeRect(300, 50, 220, 70);
    ctx.fillStyle = ditFrozen ? C.muted : '#fff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('DiT (1.15B)', 320, 78);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(s.dit, 320, 102);

    STAGES.forEach((st, j) => {
      ctx.fillStyle = j === idx ? C.orange : C.border;
      ctx.fillRect(40 + j * 130, 145, 115, 32);
      ctx.fillStyle = j === idx ? '#fff' : C.text;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.name, 97 + j * 130, 166);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(s.note, 40, 210);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {STAGES.map((s, i) => (
          <button key={s.id} type="button" className={idx === i ? 'active' : ''} onClick={() => {
            setIdx(i);
            setFb({ text: s.note, cls: i === 3 ? 'good' : '' });
          }}>{s.name}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch7Mod1;
