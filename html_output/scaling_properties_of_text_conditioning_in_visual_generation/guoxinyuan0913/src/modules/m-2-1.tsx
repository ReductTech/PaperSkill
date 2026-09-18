import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

// §2 模块 2.1：三作用域热点（P5，混合视图）——左：客厅场景；右：伪 JSON 卡
const W = 1080, H = 280;

type Sel = 'global' | 'elements' | 'relations';
const DESCS: Record<Sel, string> = {
  global: '全局字段：意图、场景、氛围、摄影、风格、光照——定下画面基调',
  elements: '逐元素字段：id、描述、材质、包围盒位置、深度——每个物件可单独寻址',
  relations: '跨元素关系：谁在谁左边、谁支撑谁——把条目绑成一个场景',
};

export const M211: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<Sel>('global');

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    // 左区：客厅简笔场景（对应 Figure 5 示例）
    const boxes = [
      { x: 60, y: 150, w: 150, h: 60, id: 1 },   // 白色簇绒沙发
      { x: 260, y: 160, w: 90, h: 50, id: 3 },   // 黑色茶几
      { x: 380, y: 100, w: 46, h: 90, id: 7 },   // 落地灯
    ];
    ctx.fillStyle = C.light; ctx.fillRect(40, 60, 420, 160);
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(40, 40, 420, 26);
    boxes.forEach((b) => {
      ctx.fillStyle = '#d8d2c0';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      const active =
        (sel === 'elements') ||
        (sel === 'global' && b.id === 7) ||
        (sel === 'relations' && b.id !== 7);
      ctx.strokeStyle = active ? C.orange : C.border;
      ctx.lineWidth = active ? 3 : 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = C.muted; ctx.font = '11px sans-serif';
      ctx.fillText(`#${b.id}`, b.x + 4, b.y - 4);
    });
    if (sel === 'relations') {
      ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(210, 175); ctx.lineTo(260, 185);
      ctx.moveTo(350, 150); ctx.lineTo(380, 140);
      ctx.stroke(); ctx.setLineDash([]);
      drawSceneLabel(ctx, '左于 / 旁置', 220, 165);
    }
    if (sel === 'global') {
      ctx.fillStyle = 'rgba(39,68,110,0.15)'; ctx.fillRect(40, 40, 420, 30);
      drawSceneLabel(ctx, '暗色木屋 · 柔和自然光', 50, 96);
    }
    drawSceneLabel(ctx, '客厅场景（Figure 5 示例）', 40, 30, true);
    // 右区：伪 JSON 卡三段
    const segs: { id: Sel; y: number; label: string; code: string }[] = [
      { id: 'global', y: 24, label: 'GLOBAL', code: '"intent":"stylish living room" · "lighting":"soft natural light"' },
      { id: 'elements', y: 104, label: 'PER-ELEMENT', code: '"elements":[{"id":1,"caption":"white tufted sofa","position":"<bbox>28 564 464 786</bbox>","depth":159}]' },
      { id: 'relations', y: 196, label: 'CROSS-ELEMENT', code: '"relationships":["<bbox>…</bbox> is left of <bbox>…</bbox>"]' },
    ];
    segs.forEach((s) => {
      const on = sel === s.id;
      ctx.fillStyle = on ? 'rgba(39,68,110,0.08)' : C.sheet;
      ctx.fillRect(500, s.y, 550, 68);
      ctx.strokeStyle = on ? C.blue : C.border;
      ctx.lineWidth = on ? 3 : 1;
      ctx.strokeRect(500, s.y, 550, 68);
      ctx.fillStyle = C.blue; ctx.font = 'bold 13px monospace';
      ctx.fillText(s.label, 514, s.y + 22);
      ctx.fillStyle = C.text; ctx.font = '12px monospace';
      wrap(ctx, s.code, 514, s.y + 44, 520, 16);
    });
  }, [sel]);

  return (
    <div className="widget">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W }} />
      <div className="ctrl-row">
        <button className={sel === 'global' ? 'chip chip-on' : 'chip'} onClick={() => setSel('global')}>全局字段</button>
        <button className={sel === 'elements' ? 'chip chip-on' : 'chip'} onClick={() => setSel('elements')}>逐元素条目</button>
        <button className={sel === 'relations' ? 'chip chip-on' : 'chip'} onClick={() => setSel('relations')}>跨元素关系</button>
      </div>
      <div className="feedback fb-blue">{DESCS[sel]}</div>
    </div>
  );
};

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) {
      ctx.fillText(line, x, yy);
      line = ch; yy += lh;
      if (yy > y + lh) return;
    } else line += ch;
  }
  ctx.fillText(line, x, yy);
}
