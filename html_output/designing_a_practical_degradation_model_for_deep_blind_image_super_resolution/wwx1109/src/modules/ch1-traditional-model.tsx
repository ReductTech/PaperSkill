import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import {
  applyOps,
  createReferenceImage,
  drawImageTo,
  px,
} from './bsrganKit';

type Last = 'blur' | 'noise' | 'scale';

export function Ch1TraditionalModel(_props: WidgetProps) {
  const [blurWidth, setBlurWidth] = useState(1.2);
  const [noiseSigma, setNoiseSigma] = useState(8);
  const [scale, setScale] = useState<2 | 4>(2);
  const [last, setLast] = useState<Last>('blur');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(320, 240), []);
  const lr = useMemo(() => applyOps(hr, [
    { type: 'blur', kind: 'iso', width: blurWidth, angle: 0, ratio: 1 },
    { type: 'down', mode: 'bicubic', scale, align: false, a: 1 },
    { type: 'gauss', sigma: noiseSigma },
  ]), [hr, blurWidth, noiseSigma, scale]);

  useEffect(() => {
    if (canvasRef.current) drawImageTo(canvasRef.current, lr, false);
  }, [lr]);

  const feedback = blurWidth < 0.2 && noiseSigma < 2
    ? '接近双三次退化：样张干净，但缺少真实颗粒与压缩。'
    : noiseSigma >= 18
      ? '噪声只在链路最后；真实照片可能先有噪声再被压缩。'
      : '固定链路：先模糊，再下采样，最后加噪；顺序不变。';

  return (
    <div className="bsr-ch1-traditional">
      <section className="bsr-preview-card">
        <div className="bsr-preview-head"><span>固定链路生成的 LR</span><b>{lr.width}×{lr.height}</b></div>
        <canvas ref={canvasRef} className="bsr-image" aria-label="传统退化模型生成的低分辨率样张" />
        <div className="bsr-controls">
          <label>
            <span>模糊宽度 σk</span><b>{px(blurWidth)}</b>
            <input type="range" min="0" max="3" step="0.1" value={blurWidth}
              onChange={(e) => { setBlurWidth(Number(e.target.value)); setLast('blur'); }} />
          </label>
          <label>
            <span>噪声强度 σn</span><b>{Math.round(noiseSigma)}/255</b>
            <input type="range" min="0" max="25" step="1" value={noiseSigma}
              onChange={(e) => { setNoiseSigma(Number(e.target.value)); setLast('noise'); }} />
          </label>
          <div className="bsr-scale-row" role="group" aria-label="缩放因子">
            <span>缩放 s</span>
            <button className={scale === 2 ? 'is-on' : ''} aria-pressed={scale === 2} onClick={() => { setScale(2); setLast('scale'); }}>2</button>
            <button className={scale === 4 ? 'is-on' : ''} aria-pressed={scale === 4} onClick={() => { setScale(4); setLast('scale'); }}>4</button>
          </div>
        </div>
      </section>
      <section className="bsr-formula-side">
        <div className="bsr-formula-card">
          <p className="bsr-formula-lead">传统退化模型把 LR 图像写成一次卷积、一次下采样和一次加噪：</p>
          <div className="bsr-formula">
            <SymbolHint meaning="y：低分辨率（LR）输出图像。">y</SymbolHint>
            {' = ('}
            <SymbolHint meaning="x：高分辨率（HR）输入图像。">x</SymbolHint>
            {' ⊗ '}
            <SymbolHint meaning="k：模糊核（点扩散函数），论文用高斯核。">k</SymbolHint>
            {') '}
            <SymbolHint meaning="↓s：以尺度 s 下采样；论文聚焦 s=2 和 s=4。">↓s</SymbolHint>
            {' + '}
            <SymbolHint meaning="n：加性噪声；传统模型假设为白高斯噪声。">n</SymbolHint>
          </div>
          <p className="bsr-formula-note">双三次退化可看作 k 固定、n=0 的特例。顺序始终是“模糊 → 下采样 → 加噪”。</p>
        </div>
        <div className="bsr-chain" aria-label="传统退化链路">
          {[
            { key: 'blur', label: '模糊', sub: 'k' },
            { key: 'scale', label: '下采样', sub: '↓s' },
            { key: 'noise', label: '加噪', sub: 'n' },
          ].map((node, i) => (
            <React.Fragment key={node.key}>
              <div className={`bsr-chain-node ${last === node.key ? 'is-active' : ''}`}>
                <span>{node.label}</span><b>{node.sub}</b>
              </div>
              {i < 2 && <span className="bsr-chain-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
        <p className={`bsr-feedback ${noiseSigma >= 18 ? 'is-red' : 'is-blue'}`}>{feedback}</p>
        <div className="bsr-solution-note">
          <span>本文解法</span>
          <p>保留三个因素，把每个算子扩成家族并随机打乱顺序。</p>
        </div>
        <p className="bsr-note">公式见论文第 1 页 Eq. (1)；样张为程序化图像。</p>
      </section>
    </div>
  );
}
