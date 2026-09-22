import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 4.1 —— P6 拖拽 + 生活隐喻
// 多文档问答：把"含答案的那篇文档"拖到不同位置，看模型是否答对。
const W = 720;
const H = 240;

const DOC_COUNT = 5;

export function LitmDocOrder({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [answerPos, setAnswerPos] = useState(2); // 含答案文档的位置 0..4
  const stateRef = useRef({ answerPos });
  stateRef.current = { answerPos };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);

    const draw = () => {
      const { answerPos: ap } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, W, H);
      const padX = 30;
      const y = 70;
      const h = 80;
      const cw = (W - padX * 2) / DOC_COUNT;
      for (let i = 0; i < DOC_COUNT; i++) {
        const x = padX + i * cw;
        const isAns = i === ap;
        ctx.fillStyle = isAns ? '#ffd166' : '#23335c';
        ctx.fillRect(x + 4, y, cw - 8, h);
        ctx.fillStyle = isAns ? '#1a1206' : '#cfe0ff';
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(isAns ? '答案文档' : `文档${i + 1}`, x + cw / 2, y + h / 2 - 4);
        if (!isAns) {
          ctx.font = '11px system-ui';
          ctx.fillText('无关干扰', x + cw / 2, y + h / 2 + 14);
        }
      }
      // 箭头标注首尾更稳
      const ok = ap === 0 || ap === DOC_COUNT - 1;
      ctx.fillStyle = ok ? '#52e0a0' : '#ff6b6b';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(ok ? '✓ 模型答对' : '✗ 模型答错', W / 2, 30);
      ctx.fillStyle = '#9fb3d9';
      ctx.font = '11px system-ui';
      ctx.fillText('提示：含答案的文档放在最前或最后时，模型更可能答对', W / 2, 200);
    };

    const start = () => {
      const loop = () => { draw(); reqRef.current = requestAnimationFrame(loop); };
      loop();
    };
    const stop = () => cancelAnimationFrame(reqRef.current);
    start();
    return () => stop();
  }, []);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <div className="litm-controls">
        <label>
          含答案的文档放在第几位：<b>{answerPos + 1}</b> / {DOC_COUNT}
          <input type="range" min={0} max={DOC_COUNT - 1} step={1} value={answerPos}
            onChange={(e) => setAnswerPos(Number(e.target.value))} />
        </label>
      </div>
      <p className="litm-hint">
        多文档问答里，相关文档位于<strong>开头或结尾</strong>时模型更易答对；塞进<strong>中间</strong>则常被忽略。
        拖到两端看绿色"答对"，拖到中间看红色"答错"。
      </p>
    </div>
  );
}
