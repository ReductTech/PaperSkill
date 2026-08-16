import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import { PAL, clearPanel, drawInset, drawLegend, drawSceneLabel, wrapText, setupCrispCanvas } from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 320;

type Role = 'director' | 'pilot';

interface RoleSpec {
  title: string;
  decides: string;
  duties: string[];
  color: string;
}

const ROLES: Record<Role, RoleSpec> = {
  director: {
    title: '导演（VLM）',
    decides: '决定接下来发生什么',
    duties: ['分析当前画面', '对用户交互做因果推理', '给出显式事件方案', '掌管宏观语义规则'],
    color: PAL.purple,
  },
  pilot: {
    title: '飞行员（世界模型）',
    decides: '决定怎么生成',
    duties: ['模拟底层物理动态', '渲染高保真视觉过渡', '把语义指令落成时空滚动', '产出下一段世界状态'],
    color: PAL.blue,
  },
};

const DIR_BOX = { x: 72, y: 52, w: 262, h: 104 };
const PIL_BOX = { x: 72, y: 194, w: 262, h: 88 };

export const Ch8M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ role: Role }>({ role: 'director' });
  const rafRef = useRef<number | null>(null);
  const [role, setRole] = useState<Role>('director');
  const [feedback, setFeedback] = useState({
    text: '导演（VLM）：决定接下来发生什么。它分析当前画面、对用户交互做因果推理，然后给出显式的事件方案——论文指出标准视频生成模型本身缺乏这种因果推理能力。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const box = (
      b: { x: number; y: number; w: number; h: number },
      spec: RoleSpec,
      sel: boolean
    ) => {
      ctx.fillStyle = sel ? 'rgba(39,68,110,0.06)' : PAL.paper;
      ctx.strokeStyle = sel ? spec.color : PAL.axis;
      ctx.lineWidth = sel ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.w, b.h);
      ctx.fill();
      ctx.stroke();
      if (sel) {
        ctx.fillStyle = spec.color;
        ctx.fillRect(b.x, b.y, 4, b.h);
      }
      ctx.fillStyle = sel ? spec.color : PAL.ink;
      ctx.font = '600 16px "Segoe UI", sans-serif';
      ctx.fillText(spec.title, b.x + 16, b.y + 32);
      ctx.fillStyle = PAL.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(spec.decides, b.x + 16, b.y + 58);
    };

    const render = (s: { role: Role }) => {
      clearPanel(ctx, W, H);
      box(DIR_BOX, ROLES.director, s.role === 'director');
      box(PIL_BOX, ROLES.pilot, s.role === 'pilot');

      // director -> pilot: event proposals
      const dirActive = s.role === 'director';
      ctx.strokeStyle = dirActive ? PAL.purple : PAL.axis;
      ctx.lineWidth = dirActive ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(192, DIR_BOX.y + DIR_BOX.h);
      ctx.lineTo(192, PIL_BOX.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(192, PIL_BOX.y);
      ctx.lineTo(187, PIL_BOX.y - 8);
      ctx.moveTo(192, PIL_BOX.y);
      ctx.lineTo(197, PIL_BOX.y - 8);
      ctx.stroke();
      ctx.fillStyle = dirActive ? PAL.purple : PAL.muted;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('事件方案', 202, PIL_BOX.y - 12);

      // pilot -> director loop back: updated world state
      const pilActive = s.role === 'pilot';
      ctx.strokeStyle = pilActive ? PAL.blue : PAL.axis;
      ctx.lineWidth = pilActive ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(DIR_BOX.x, PIL_BOX.y + 40);
      ctx.lineTo(46, PIL_BOX.y + 40);
      ctx.lineTo(46, DIR_BOX.y + 52);
      ctx.lineTo(DIR_BOX.x, DIR_BOX.y + 52);
      ctx.stroke();
      ctx.fillStyle = pilActive ? PAL.blue : PAL.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.save();
      ctx.translate(38, 168);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('新的世界状态', 0, 0);
      ctx.restore();
      ctx.textAlign = 'left';

      // stable detail inset
      const spec = ROLES[s.role];
      drawInset(ctx, 344, 52, 352, 230, '这个角色负责什么');
      let ty = 96;
      ctx.fillStyle = spec.color;
      ctx.font = '600 16px "Segoe UI", sans-serif';
      ctx.fillText(spec.decides, 362, ty);
      ty += 32;
      ctx.font = '13px "Segoe UI", sans-serif';
      for (const d of spec.duties) {
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(368, ty - 4, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.ink;
        ctx.fillText(d, 380, ty);
        ty += 26;
      }
      ty += 10;
      ctx.fillStyle = PAL.muted;
      wrapText(ctx, '接口：事件方案（两者之间唯一的接口）', 362, ty, 320, 19);

      drawSceneLabel(ctx, 72, 34, '点击任一角色');
      drawLegend(ctx, 72, 304, [
        { color: PAL.purple, label: '导演' },
        { color: PAL.blue, label: '飞行员' },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
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
      detachCrisp();
    };
  }, []);

  const select = (r: Role) => {
    stateRef.current.role = r;
    setRole(r);
    setFeedback(
      r === 'director'
        ? {
            text: '导演（VLM）：决定接下来发生什么。它分析当前画面、对用户交互做因果推理，然后给出显式的事件方案——论文指出标准视频生成模型本身缺乏这种因果推理能力。',
            cls: '',
          }
        : {
            text: '飞行员（视频生成器）：决定怎么生成。它接过事件方案，模拟底层物理动态，把语义决策落成物理连贯的时空滚动。',
            cls: '',
          }
    );
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const inBox = (b: { x: number; y: number; w: number; h: number }) =>
      x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    if (inBox(DIR_BOX)) select('director');
    else if (inBox(PIL_BOX)) select('pilot');
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {(['director', 'pilot'] as Role[]).map((r) => (
          <button
            key={r}
            className={`chip${role === r ? ' selected' : ''}`}
            onClick={() => select(r)}
          >
            {ROLES[r].title}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8M1;
