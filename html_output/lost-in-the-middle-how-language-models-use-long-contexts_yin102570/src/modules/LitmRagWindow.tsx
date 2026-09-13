import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 7.1 —— P5 热点 + 技术
// 检索增强（RAG）：把检索到的相关段落塞进提示的"窗口"，但模型仍偏向首尾，
// 所以要把关键信息放在窗口两端而非中间。
const W = 720;
const H = 200;

export function LitmRagWindow({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [midBias, setMidBias] = useState(false); // 是否把关键段落放中间
  const stateRef = useRef({ midBias });
  stateRef.current = { midBias };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);

    const draw = () => {
      const { midBias } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, W, H);
      const padX = 30, y = 70, h = 70, winW = W - padX * 2;
      // 窗口
      ctx.fillStyle = '#16213f';
      ctx.fillRect(padX, y, winW, h);
      ctx.strokeStyle = '#5b6b8f';
      ctx.strokeRect(padX, y, winW, h);
      // 首尾"黄金区"高亮
      const goldW = winW * 0.18;
      ctx.fillStyle = 'rgba(82,224,160,0.18)';
      ctx.fillRect(padX, y, goldW, h);
      ctx.fillRect(padX + winW - goldW, y, goldW, h);
      // 相关段落
      const keyX = midBias ? padX + winW / 2 : padX + 24;
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(keyX - 10, y + 18, 20, h - 36);
      ctx.fillStyle = '#cfe0ff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('检索到的关键段落', keyX, y - 8);
      // 标签
      ctx.fillStyle = '#52e0a0';
      ctx.fillText('模型关注区', padX + goldW / 2, y + h + 16);
      ctx.fillText('模型关注区', padX + winW - goldW / 2, y + h + 16);
      ctx.fillStyle = midBias ? '#ff6b6b' : '#52e0a0';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(midBias ? '⚠ 关键段落落在"盲区"' : '✓ 关键段落落在"黄金区"', W / 2, 36);
    };

    const start = () => { const loop = () => { draw(); reqRef.current = requestAnimationFrame(loop); }; loop(); };
    const stop = () => cancelAnimationFrame(reqRef.current);
    start();
    return () => stop();
  }, []);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <div className="litm-controls">
        <label className="litm-toggle">
          <input type="checkbox" checked={midBias} onChange={(e) => setMidBias(e.target.checked)} />
          把关键段落放在窗口中间
        </label>
      </div>
      <p className="litm-hint">
        检索增强（RAG）把所有候选段落拼进一个上下文窗口。由于模型偏好首尾，
        <strong>把关键段落放在窗口两端</strong>更稳；勾选放中间即看到它落入"盲区"。
      </p>
    </div>
  );
}
