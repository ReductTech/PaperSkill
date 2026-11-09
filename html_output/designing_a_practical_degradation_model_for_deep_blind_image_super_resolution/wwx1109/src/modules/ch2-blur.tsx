import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { blurImage, createReferenceImage, drawImageTo, px } from './bsrganKit';

export function Ch2Blur(_props: WidgetProps) {
  const [kind, setKind] = useState<'iso' | 'aniso'>('iso');
  const [width, setWidth] = useState(1.4);
  const [angle, setAngle] = useState(45);
  const [ratio, setRatio] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(260, 195), []);
  const blurred = useMemo(
    () => blurImage(hr, width, kind === 'aniso' ? angle : 0, kind === 'aniso' ? ratio : 1),
    [hr, width, angle, ratio, kind],
  );
  useEffect(() => {
    if (canvasRef.current) drawImageTo(canvasRef.current, blurred, true);
  }, [blurred]);

  const major = width * (kind === 'aniso' ? ratio : 1);
  const rx = 36 + Math.min(100, major * 22);
  const ry = 36 + Math.min(100, width * 22);
  const feedback = width < 0.2
    ? '宽度 0.1 近似恒等核，几乎不模糊。论文也指出这个边界。'
    : kind === 'iso'
      ? '各向同性核把各个方向的边缘均匀抹开，像失焦。'
      : '各向异性核沿一个方向拉长，边缘出现方向性拖影，像运动模糊或散焦光斑。';

  return (
    <div className="bsr-ch2-blur">
      <section className="bsr-kernel-panel">
        <div className="bsr-panel-head"><span>模糊核形状</span><b>{kind === 'iso' ? '圆形' : '椭圆'}</b></div>
        <svg viewBox="0 0 360 360" role="img" aria-label={kind === 'iso' ? '各向同性高斯核' : '各向异性高斯核'}>
          <defs>
            <radialGradient id="kernelGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f07e47" stopOpacity="0.95" />
              <stop offset="52%" stopColor="#f07e47" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#f07e47" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="360" height="360" fill="#ffffff" />
          {[60, 120, 180].map((r) => <circle key={r} cx="180" cy="180" r={r} fill="none" stroke="#e8edf5" strokeWidth="1" />)}
          <line x1="180" y1="16" x2="180" y2="344" stroke="#e8edf5" strokeWidth="1" />
          <line x1="16" y1="180" x2="344" y2="180" stroke="#e8edf5" strokeWidth="1" />
          <g transform={`rotate(${kind === 'aniso' ? angle : 0} 180 180)`}>
            <ellipse cx="180" cy="180" rx={rx} ry={ry} fill="url(#kernelGrad)" />
            <ellipse cx="180" cy="180" rx={rx} ry={ry} fill="none" stroke="#92400e" strokeWidth="2.5" />
            <line x1={180 - rx} y1="180" x2={180 + rx} y2="180" stroke="#92400e" strokeWidth="2" strokeDasharray="7 6" />
          </g>
          <circle cx="180" cy="180" r="5" fill="#21324a" />
        </svg>
        <p className="bsr-kernel-caption">主方向宽度约 {px(major)}σ，短轴约 {px(width)}σ</p>
      </section>
      <section className="bsr-photo-panel">
        <div className="bsr-panel-head"><span>同一张参考照片</span><b>{kind === 'iso' ? 'Biso' : 'Baniso'}</b></div>
        <canvas ref={canvasRef} className="bsr-image" aria-label="被高斯核模糊的静物照片" />
        <p className="bsr-photo-caption">高光花瓣和窗框的高频细节先被抹平，再影响后续下采样与压缩。</p>
      </section>
      <section className="bsr-control-panel">
        <div className="bsr-toggle-row" role="group" aria-label="模糊核类型">
          <button className={kind === 'iso' ? 'is-on' : ''} aria-pressed={kind === 'iso'} onClick={() => setKind('iso')}>各向同性</button>
          <button className={kind === 'aniso' ? 'is-on' : ''} aria-pressed={kind === 'aniso'} onClick={() => setKind('aniso')}>各向异性</button>
        </div>
        <label className="bsr-slider">
          <span>核宽度</span><b>{px(width)}</b>
          <input type="range" min="0.1" max="2.8" step="0.05" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <label className={`bsr-slider ${kind === 'iso' ? 'is-disabled' : ''}`}>
          <span>旋转角</span><b>{Math.round(angle)}°</b>
          <input type="range" min="0" max="180" step="1" value={angle} disabled={kind === 'iso'} onChange={(e) => setAngle(Number(e.target.value))} />
        </label>
        <label className={`bsr-slider ${kind === 'iso' ? 'is-disabled' : ''}`}>
          <span>轴长比</span><b>{kind === 'iso' ? '1' : ratio.toFixed(1)}</b>
          <input type="range" min="1" max="8" step="0.1" value={ratio} disabled={kind === 'iso'} onChange={(e) => setRatio(Number(e.target.value))} />
        </label>
        <p className="bsr-feedback is-blue">{feedback}</p>
        <p className="bsr-note">论文范围：核尺寸 {`{7×7,…,21×21}`}；各向同性宽度 s=2 时 [0.1,2.4]、s=4 时 [0.1,2.8]；各向异性角度 [0,π]、轴长 [0.5,6] 或 [0.5,8]。本页用连续滑杆做教学简化。</p>
      </section>
    </div>
  );
}
