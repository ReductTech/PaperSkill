import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 6.1 —— 替换原"少样本"章节：论文实际研究的是"查询感知上下文化"
// （query-aware contextualization）：把查询放在文档之前或之后，看模型检索表现。
const W = 720;
const H = 240;

export function LitmQueryAware({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [queryFirst, setQueryFirst] = useState(true); // 查询放前面
  const stateRef = useRef({ queryFirst });
  stateRef.current = { queryFirst };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);

    const draw = () => {
      const { queryFirst } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, W, H);
      const padX = 30, y = 70, h = 90, winW = W - padX * 2;
      // 上下文窗口
      ctx.fillStyle = '#16213f';
      ctx.fillRect(padX, y, winW, h);
      ctx.strokeStyle = '#5b6b8f';
      ctx.strokeRect(padX, y, winW, h);
      // 查询块（前或后）
      const qw = winW * 0.16;
      ctx.fillStyle = '#52e0a0';
      if (queryFirst) ctx.fillRect(padX, y, qw, h);
      else ctx.fillRect(padX + winW - qw, y, qw, h);
      // 文档块
      ctx.fillStyle = '#23335c';
      const dw = (winW - qw) / 5;
      for (let i = 0; i < 5; i++) {
        const x = queryFirst ? padX + qw + i * dw : padX + i * dw;
        ctx.fillRect(x + 3, y + 10, dw - 6, h - 20);
      }
      // 标注
      ctx.fillStyle = '#cfe0ff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('查询', queryFirst ? padX + qw / 2 : padX + winW - qw / 2, y + h / 2 + 4);
      ctx.fillText('文档(1篇含答案)', W / 2, y + h + 18);
      // 结果文字（论文观察：查询前置对键值任务近乎完美；多文档QA仅开头微升）
      ctx.fillStyle = queryFirst ? '#52e0a0' : '#ffd166';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(
        queryFirst ? '查询在前：键值检索≈完美，多文档QA开头略升' : '查询在后：检索仍强，但中间偏弱',
        W / 2, 36,
      );
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
        <label className="litm-toggle">
          <input type="checkbox" checked={queryFirst} onChange={(e) => setQueryFirst(e.target.checked)} />
          把"查询"放在文档之前（否则放在之后）
        </label>
      </div>
      <p className="litm-hint">
        论文发现：把<strong>查询</strong>放在文档之前（上下文开头），在"键值检索"任务上几乎能完美命中；
        对多文档问答，开头位置的答案也略有提升。这再次印证模型对<strong>上下文两端</strong>最敏感。
      </p>
    </div>
  );
}
