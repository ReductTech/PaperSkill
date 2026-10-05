import React, { useState } from 'react';
import { figureById } from '../data/figureData';
import { FigureModal } from './FigureModal';

// 正文图表引用按钮（F1）：点击弹出模态框查看原图。
export function FigureButton({ id, label }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const item = figureById(id);
  if (!item) return null;
  return (
    <>
      <button className="fig-ref-btn" onClick={() => setOpen(true)}>
        📊 查看 {item.number} {label ?? ''}
      </button>
      <FigureModal item={open ? item : null} onClose={() => setOpen(false)} />
    </>
  );
}
