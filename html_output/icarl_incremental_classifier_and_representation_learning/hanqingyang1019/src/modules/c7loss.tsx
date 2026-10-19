import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { clamp } from '../lib/canvasKit';
import { C, W, H, scene, txt, type WidgetProps } from './kit';

// Chapter 7.1 — classification term vs distillation term: a visible trade-off.
function accNew(wc: number, wd: number): number {
  return clamp(0.34 + 0.55 * wc - 0.16 * wd, 0.08, 0.95);
}
function accOld(wc: number, wd: number): number {
  return clamp(0.34 + 0.55 * wd - 0.16 * wc, 0.08, 0.95);
}

export const C7Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [wc, setWc] = useState(0.5);
  const [wd, setWd] = useState(0.5);
  const an = accNew(wc, wd);
  const ao = accOld(wc, wd);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const rows = [
      { y: 92, label: '新类', v: accNew(wc, wd), color: C.blue },
      { y: 176, label: '旧类', v: accOld(wc, wd), color: C.green },
    ];
    rows.forEach((r) => {
      txt(ctx, r.label, 100, r.y, C.text, 20, 'left', '700');
      ctx.fillStyle = 'rgba(215,222,234,0.6)';
      ctx.fillRect(180, r.y - 15, 760, 30);
      ctx.fillStyle = r.color;
      ctx.fillRect(180, r.y - 15, 760 * r.v, 30);
      txt(ctx, r.v.toFixed(2), 960, r.y, r.color, 22, 'left', '700');
    });

    // balance indicator between the two bars
    const gap = Math.abs(an - ao);
    ctx.fillStyle = gap < 0.08 ? C.green : gap < 0.22 ? C.orange : C.red;
    ctx.fillRect(180, 138, 760, 4);
    c.classList.add('is-ready');
  }, [wc, wd, an, ao]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          分类项权重 <span className="val">{wc.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(wc * 100)} onChange={(e) => setWc(Number(e.target.value) / 100)} />
      </div>
      <div className="ctrl">
        <label>
          蒸馏项权重 <span className="val">{wd.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(wd * 100)} onChange={(e) => setWd(Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${Math.abs(an - ao) < 0.08 ? 'good' : Math.abs(an - ao) < 0.22 ? '' : 'bad'}`}>
        {Math.abs(an - ao) < 0.08
          ? '两股力配平：新类学得动，旧类也守得住。iCaRL 的做法是让两项同时存在，而不是二选一。'
          : wc > wd
          ? '分类项压倒蒸馏项：新类准确率上去了，旧类的判别边界却被改写。'
          : '蒸馏项压倒分类项：旧类守住了，新类却学不进去——特征没有为新类做出调整。'}
      </div>
    </div>
  );
};

export default C7Loss;
