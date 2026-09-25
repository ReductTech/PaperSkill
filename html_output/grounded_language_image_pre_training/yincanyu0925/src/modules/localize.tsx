import React, { useState } from 'react';
import { Canvas, C, clear, box, text, exhibit, Feedback, Reset } from './glip-kit';

export function Localize() {
  const [position, setPosition] = useState({ x: 220, y: 110 });
  const [scale, setScale] = useState(1);
  const w = 160 * scale, h = 140 * scale;
  const left = position.x - w / 2, top = position.y - h / 2;
  const iw = Math.max(0, Math.min(left + w, 560) - Math.max(left, 400));
  const ih = Math.max(0, Math.min(top + h, 220) - Math.max(top, 80));
  const intersection = iw * ih, union = 160 * 140 + w * h - intersection;
  const iou = intersection / union;
  const move = (x: number, y: number) => setPosition({ x: Math.max(w / 2, Math.min(720 - w / 2, x)), y: Math.max(h / 2, Math.min(300 - h / 2, y)) });
  const reset = () => { setPosition({ x: 220, y: 110 }); setScale(1); };
  return <div data-exercise="localize">
    <Canvas height={300} label="拖动蓝色预测框；左右方向键平移，End 对齐，Home 重置" drag
      onPoint={(x, y) => { if (x <= 720) move(x, y); }}
      onKey={key => { if (key === 'Home') reset(); else if (key === 'End') { setPosition({ x: 480, y: 150 }); setScale(1); } else move(position.x + (key === 'ArrowRight' ? 10 : -10), position.y); }}
      draw={c => {
        clear(c, 1080, 300); exhibit(c, 480, 130, 0);
        c.fillStyle = '#228d5c18'; c.fillRect(400, 80, 160, 140);
        c.strokeStyle = C.green; c.lineWidth = 3; c.strokeRect(400, 80, 160, 140);
        c.fillStyle = '#27446e18'; c.fillRect(left, top, w, h);
        c.strokeStyle = C.blue; c.setLineDash([8, 5]); c.strokeRect(left, top, w, h); c.setLineDash([]);
        if (intersection) { c.fillStyle = '#228d5c66'; c.fillRect(Math.max(400, left), Math.max(80, top), iw, ih); }
        text(c, 'IoU', 820, 72); text(c, iou.toFixed(3), 805, 139, iou >= .5 ? C.green : C.red, 42);
        box(c, 780, 184, 240, 22, C.line, true); box(c, 780, 184, Math.max(1, 240 * iou), 22, C.blue, true);
        text(c, '0', 780, 239); text(c, '1', 1005, 239);
      }} />
    <p className="exercise-hint">绿框＝参考框；蓝色虚线＝你的预测框；深色重叠部分＝交集。拖动图中蓝框，或使用下方滑杆。</p>
    <div className="exercise-sliders" onKeyDown={e => e.stopPropagation()}>
      <label>水平位置 <input aria-label="预测框水平位置" type="range" min={w / 2} max={720 - w / 2} step="1" value={position.x} onChange={e => move(Number(e.target.value), position.y)} /></label>
      <label>垂直位置 <input aria-label="预测框垂直位置" type="range" min={h / 2} max={300 - h / 2} step="1" value={position.y} onChange={e => move(position.x, Number(e.target.value))} /></label>
      <label>框的大小 ×{scale.toFixed(1)} <input aria-label="预测框缩放" type="range" min="0.5" max="2" step="0.1" value={scale} onChange={e => { const s = Number(e.target.value); setScale(s); setPosition(p => ({ x: Math.max(80 * s, Math.min(720 - 80 * s, p.x)), y: Math.max(70 * s, Math.min(300 - 70 * s, p.y)) })); }} /></label>
    </div>
    <div className="ctrl"><button className="tiny" onClick={() => { setPosition({ x: 480, y: 150 }); setScale(1); }}>对齐参考框</button><button className="tiny" onClick={() => { setPosition({ x: 480, y: 150 }); setScale(2); }}>试试大框全包住</button><Reset onClick={reset} /></div>
    <Feedback kind={iou >= .5 ? 'good' : 'bad'}>交集={intersection.toFixed(0)}；并集={union.toFixed(0)}；IoU={iou.toFixed(3)}。{iou === 1 ? '完全重合！' : scale === 2 && iou === .25 ? '虽然包住了整个目标，多余背景扩大了并集，IoU 只有 0.250。' : iou >= .5 ? '当前超过练习用的 0.5 门槛；继续调整，看看能否达到 1。' : '还未达到练习用的 0.5 门槛，试着移动或缩放预测框。'} 这是人工几何示例；单个框的 IoU 不是 COCO AP，实际评测还涉及类别、排序、匹配与多个 IoU 门槛。</Feedback>
  </div>;
}
