import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

const ANGLES = [-60, -30, 0, 30, 60] as const;

function panelIndex(angle: number) {
  return ANGLES.indexOf(angle as (typeof ANGLES)[number]);
}

function formatAngle(angle: number) {
  return `${angle > 0 ? '+' : ''}${angle}°`;
}

function FacePanel({ angle, label }: { angle: number; label: string }) {
  const index = panelIndex(angle);
  return (
    <div className="face-view-card">
      <div className="face-view-card-head">
        <span>{label}</span>
        <strong>{formatAngle(angle)}</strong>
      </div>
      <div className="face-view-frame">
        <img
          className="face-turntable-sprite"
          src="./images/face-viewpoint-turntable.png"
          alt={`同一虚构人物在${formatAngle(angle)}摄像机视角下的人脸`}
          style={{ transform: `translateX(-${index * 20}%)` }}
        />
      </div>
    </div>
  );
}

export const ImageViewpointDemo: React.FC<WidgetProps> = () => {
  const [angle, setAngle] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const timerRef = useRef<number | null>(null);

  const chooseAngle = (next: number) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setAngle(next);
    setStatus('idle');
  };

  const generate = () => {
    setStatus('generating');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setStatus('done');
      timerRef.current = null;
    }, 520);
  };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="face-viewpoint-demo">
      <div className="face-viewpoint-stage">
        <FacePanel angle={0} label="给定人脸图像" />
        <div className={`face-view-arrow ${status === 'generating' ? 'is-running' : ''}`} aria-hidden="true">
          <span>选择视角</span>
          <b>→</b>
        </div>
        {status === 'done' ? (
          <FacePanel angle={angle} label="生成的新视角" />
        ) : (
          <div className="face-view-card">
            <div className="face-view-card-head">
              <span>生成的新视角</span>
              <strong>{formatAngle(angle)}</strong>
            </div>
            <div className={`face-view-placeholder ${status === 'generating' ? 'is-generating' : ''}`}>
              <span className="face-view-placeholder-icon">{status === 'generating' ? '◌' : '＋'}</span>
              <strong>{status === 'generating' ? '正在生成目标视角…' : '等待生成'}</strong>
              <small>{status === 'generating' ? '根据目标角度重建可见内容' : '先选择角度，再点击生成'}</small>
            </div>
          </div>
        )}
      </div>

      <div className="face-control-row">
        <div className="face-angle-controls">
          <div className="face-angle-label">
            <span>目标摄像机水平旋转角度</span>
            <strong>{formatAngle(angle)}</strong>
          </div>
          <input
            aria-label="目标摄像机水平旋转角度"
            type="range"
            min="-60"
            max="60"
            step="30"
            value={angle}
            onInput={event => chooseAngle(Number(event.currentTarget.value))}
          />
          <div className="face-angle-options" aria-label="快捷角度选项">
            {ANGLES.map(option => (
              <button
                type="button"
                key={option}
                className={`chip ${angle === option ? 'active' : ''}`}
                onClick={() => chooseAngle(option)}
              >
                {formatAngle(option)}
              </button>
            ))}
          </div>
        </div>

        <div className="face-generate-row">
          <button type="button" onClick={generate} disabled={status === 'generating'}>
            {status === 'generating' ? '生成中…' : status === 'done' ? '重新生成' : '生成目标视角'}
          </button>
          {status === 'done' ? (
            <span aria-live="polite">已从正面参考图像生成{formatAngle(angle)}目标视角。</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImageViewpointDemo;
