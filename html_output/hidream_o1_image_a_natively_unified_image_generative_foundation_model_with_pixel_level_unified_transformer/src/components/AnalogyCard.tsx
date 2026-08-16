import React, { useEffect, useRef } from 'react';
import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const analogyOnlyComponent =
    analogy.componentId && analogy.componentId !== 'prompt-construction-workshop'
      ? analogy.componentId
      : undefined;
  const Widget = analogyOnlyComponent ? widgetRegistry[analogyOnlyComponent] : undefined;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || Widget || analogy.figure) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#fffbeb');
    bg.addColorStop(1, '#fde68a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(217, 119, 6, 0.18)';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.roundRect(18 + i * 38, 24 + (i % 2) * 18, 52, 24, 10);
      ctx.fill();
    }

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 98);
    ctx.bezierCurveTo(78, 58, 140, 128, 216, 52);
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('Analogy', 86, 112);
    canvas.classList.add('is-ready');
  }, [Widget, analogy.figure]);

  return (
    <div className="analogy-card">
      <div className="analogy-visual">
        {Widget ? <Widget chapterId={chapterId} moduleId="ana" /> : analogy.figure ? <Figure src={analogy.figure} alt={analogy.title} /> : <canvas ref={canvasRef} width={244} height={130} />}
      </div>
      <div className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text">{analogy.text}</div>
      </div>
    </div>
  );
}
