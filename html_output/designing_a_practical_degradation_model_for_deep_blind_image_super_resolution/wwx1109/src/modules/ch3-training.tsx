import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  blurImage,
  cloneImage,
  createReferenceImage,
  downsample,
  drawImageTo,
  resample,
} from './bsrganKit';

function sharpen(data: ImageData, amount = 0.85): ImageData {
  const soft = blurImage(data, 1.1);
  const out = cloneImage(data);
  for (let i = 0; i < out.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      out.data[i + c] = data.data[i + c] + amount * (data.data[i + c] - soft.data[i + c]);
    }
  }
  return out;
}

export function Ch3Training(_props: WidgetProps) {
  const [stage, setStage] = useState<'bsrnet' | 'bsrgan'>('bsrnet');
  const [showWeights, setShowWeights] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hr = useMemo(() => createReferenceImage(320, 240), []);
  const demo = useMemo(() => {
    const lr = downsample(hr, 2, 'bicubic');
    const up = resample(lr, 320, 240, 'bicubic');
    if (stage === 'bsrnet') return blurImage(up, 0.7);
    return sharpen(up, 0.9);
  }, [hr, stage]);
  useEffect(() => { if (canvasRef.current) drawImageTo(canvasRef.current, demo, true); }, [demo]);

  const losses = [
    { key: 'L1', weight: 1, on: true, color: '#27446e', desc: '像素误差，先把平均亮度与颜色拉回来。' },
    { key: '感知', weight: 1, on: stage === 'bsrgan', color: '#7c3aed', desc: 'VGG 特征相似度，让纹理更像自然图像。' },
    { key: '对抗', weight: 0.1, on: stage === 'bsrgan', color: '#f07e47', desc: 'PatchGAN 判别，把结果推向真实分布。' },
  ];
  const feedback = stage === 'bsrnet'
    ? 'BSRNet 偏平滑，保真度更好。'
    : 'BSRGAN 更锐，但可能编细节。';

  return (
    <div className="bsr-ch3-training">
      <section className="bsr-train-left">
        <div className="bsr-panel-head"><span>两阶段训练</span><b>{stage === 'bsrnet' ? '阶段 1' : '阶段 2'}</b></div>
        <div className="bsr-stage-line" role="group" aria-label="训练阶段">
          <button className={stage === 'bsrnet' ? 'is-on' : ''} aria-pressed={stage === 'bsrnet'} onClick={() => setStage('bsrnet')}>
            <b>BSRNet</b><span>PSNR 导向</span>
          </button>
          <span className="bsr-stage-arrow">→</span>
          <button className={stage === 'bsrgan' ? 'is-on' : ''} aria-pressed={stage === 'bsrgan'} onClick={() => setStage('bsrgan')}>
            <b>BSRGAN</b><span>感知导向</span>
          </button>
        </div>
        <div className="bsr-loss-card">
          <div className="bsr-inline-row">
            <span>损失构成</span>
            <button className={`bsr-text-btn ${showWeights ? 'is-on' : ''}`} aria-pressed={showWeights} onClick={() => setShowWeights(!showWeights)}>
              {showWeights ? '隐藏权重' : '查看权重'}
            </button>
          </div>
          {losses.map((loss) => (
            <div key={loss.key} className={`bsr-loss-row ${loss.on ? 'is-on' : ''}`}>
              <span>{loss.key}</span>
              <div className="bsr-loss-bar"><i style={{ width: `${(loss.weight / 1.1) * 100}%`, background: loss.color }} /></div>
              <b>{showWeights ? `×${loss.weight}` : loss.on ? '启用' : '关闭'}</b>
            </div>
          ))}
          <p className="bsr-loss-note">权重 1 : 1 : 0.1；感知取 VGG 第 4 层卷积。</p>
        </div>
        <div className="bsr-train-config">
          <span>Adam · lr 1e-5</span><span>batch 48</span><span>LR patch 72×72</span>
        </div>
        <p className={`bsr-feedback ${stage === 'bsrnet' ? 'is-blue' : 'is-orange'}`}>{feedback}</p>
        <p className="bsr-note">流程与权重见论文第 6 页 §5；右侧为教学示意，不是训练输出。</p>
      </section>
      <section className="bsr-train-right">
        <div className="bsr-panel-head"><span>{stage === 'bsrnet' ? 'BSRNet 倾向' : 'BSRGAN 倾向'}</span><b>示意</b></div>
        <canvas ref={canvasRef} className="bsr-image bsr-training-image" aria-label="两种训练目标下的示意样张" />
        <div className={`bsr-detail-flag ${stage === 'bsrgan' ? 'is-on' : ''}`}>
          {stage === 'bsrgan' ? '纹理更锐，但可能编细节' : '边缘偏软，但像素更稳'}
        </div>
        <p className="bsr-photo-caption">同一张 LR 上采样后：左边目标更平滑，右边目标更锐。对比的是训练目标，不是两个已训练模型。</p>
      </section>
    </div>
  );
}
