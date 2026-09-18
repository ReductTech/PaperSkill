import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = { bg: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', line: '#d7deea' };

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.font = '700 20px "Segoe UI", sans-serif'; ctx.fillText(title, x + 22, y + 34);
}

export const AuditToggle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState({ audit: false });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.height = 'auto';
    const render = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      card(ctx, 50, 42, 420, 190, '最终产物');
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(130, 135, 42, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(109, 136); ctx.lineTo(124, 151); ctx.lineTo(153, 118); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '600 18px "Segoe UI", sans-serif'; ctx.fillText('文件已生成', 205, 122); ctx.fillStyle = C.muted; ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillText('表面上符合交付格式', 205, 151);

      card(ctx, 530, 42, 500, 190, '环境状态账本');
      const issues = ['错误收件人', '残留临时文件', '权限状态不一致'];
      issues.forEach((issue, i) => {
        const y = 102 + i * 42; ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(570, y - 5, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.ink; ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillText(issue, 595, y);
      });
      if (!model.audit) {
        ctx.fillStyle = 'rgba(245,248,240,.91)'; ctx.fillRect(538, 78, 484, 143);
        ctx.fillStyle = C.muted; ctx.font = '600 18px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('未启用状态审计：副作用不可见', 780, 148); ctx.textAlign = 'left';
      }
      const verdictColor = model.audit ? C.red : C.green;
      ctx.fillStyle = verdictColor; ctx.beginPath(); ctx.roundRect(425, 242, 230, 31, 15); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 17px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(model.audit ? '结论：需修正' : '结论：通过', 540, 264); ctx.textAlign = 'left';
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => {}); return () => disconnect();
  }, [model.audit]);

  const feedback = model.audit
    ? { cls: 'good', text: '加入状态审计：隐藏副作用被发现。' }
    : { cls: 'bad', text: '只看产物：一次误判被放过。' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="最终产物与环境状态联合验收示意" />
      <div className="ctrl" role="group" aria-label="验收方式">
        <button type="button" className={`chip ${!model.audit ? 'active' : ''}`} aria-pressed={!model.audit} onClick={() => setModel({ audit: false })}>仅看最终答案</button>
        <button type="button" className={`chip ${model.audit ? 'active' : ''}`} aria-pressed={model.audit} onClick={() => setModel({ audit: true })}>加入状态审计</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default AuditToggle;
