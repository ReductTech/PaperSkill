import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, createReferenceImage, drawImageTo } from './bsrganKit';

export function Ch3Patch(_props: WidgetProps) {
  const [patch, setPatch] = useState(72);
  const [cx, setCx] = useState(0.5);
  const [cy, setCy] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const hr = useMemo(() => createReferenceImage(640, 480), []);
  useEffect(() => { if (canvasRef.current) drawImageTo(canvasRef.current, hr, true); }, [hr]);

  const halfX = patch / 320;
  const halfY = patch / 240;
  const clampC = (value: number, half: number) => clamp(value, half, 1 - half);
  const coverage = ((patch * 2) ** 2 / (320 * 240)) * 100;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, cx, cy };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dx = (event.clientX - dragRef.current.x) / rect.width;
    const dy = (event.clientY - dragRef.current.y) / rect.height;
    setCx(clampC(dragRef.current.cx + dx, halfX));
    setCy(clampC(dragRef.current.cy + dy, halfY));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const feedback = patch <= 56
    ? '只看到局部纹理，结构上下文不足。'
    : patch >= 112
      ? '上下文更多，但训练块更大、显存开销上升。'
      : patch === 72
        ? '72×72 是论文的选择：严重退化下仍能提供足够纹理与结构。'
        : '块越大，一次能看到的结构越多；论文在退化严重时选择了更大的 72×72。';

  return (
    <div className="bsr-ch3-patch">
      <section className="bsr-patch-photo">
        <div className="bsr-panel-head"><span>参考照片上的训练裁切</span><b>LR patch {patch}×{patch}</b></div>
        <div className="bsr-patch-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="bsr-image" aria-label="带裁切框的参考照片" />
          <div
            className="bsr-crop-frame"
            style={{ left: `${(cx - halfX) * 100}%`, top: `${(cy - halfY) * 100}%`, width: `${halfX * 200}%`, height: `${halfY * 200}%` }}
            role="slider"
            tabIndex={0}
            aria-label="训练裁切框位置"
            aria-valuenow={Math.round(cx * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(e) => {
              const step = 0.04;
              if (e.key === 'ArrowLeft') { e.preventDefault(); setCx((v) => clampC(v - step, halfX)); }
              if (e.key === 'ArrowRight') { e.preventDefault(); setCx((v) => clampC(v + step, halfX)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCy((v) => clampC(v - step, halfY)); }
              if (e.key === 'ArrowDown') { e.preventDefault(); setCy((v) => clampC(v + step, halfY)); }
            }}
          />
        </div>
        <p className="bsr-photo-caption">拖动裁切框：一次训练只看框内的 HR 区域，再按尺度 s=2 生成对应 LR patch。</p>
      </section>
      <section className="bsr-patch-side">
        <label className="bsr-slider">
          <span>LR patch 尺寸</span><b>{patch}</b>
          <input type="range" min="48" max="128" step="8" value={patch}
            onChange={(e) => { const v = Number(e.target.value); setPatch(v); setCx((x) => clampC(x, v / 320)); setCy((y) => clampC(y, v / 240)); }} />
        </label>
        <div className="bsr-coverage-card">
          <span>覆盖画面</span><b>{coverage.toFixed(0)}%</b>
          <em>HR 裁切约 {patch * 2}×{patch * 2}</em>
        </div>
        <div className="bsr-config-card">
          <h3>训练配方</h3>
          <dl>
            <div><dt>数据</dt><dd>DIV2K / Flickr2K / WED / 2k FFHQ</dd></div>
            <div><dt>清洗</dt><dd>按拉普拉斯方差去掉模糊图</dd></div>
            <div><dt>损失</dt><dd>L1 : 感知 : 对抗 = 1 : 1 : 0.1</dd></div>
            <div><dt>优化</dt><dd>Adam，固定 lr 1e-5，batch 48</dd></div>
            <div><dt>LR patch</dt><dd>72 × 72</dd></div>
          </dl>
        </div>
        <p className={`bsr-feedback ${patch === 72 ? 'is-green' : 'is-blue'}`}>{feedback}</p>
        <p className="bsr-note">配置见论文 §5；覆盖百分比是几何值。</p>
      </section>
    </div>
  );
}
