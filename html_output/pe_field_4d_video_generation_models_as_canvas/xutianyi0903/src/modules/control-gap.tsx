import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { startObservedLoop } from './stage-analogy';
import { drawCarCameraScene } from './hero-camera';

export const ControlGap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<HTMLCanvasElement>(null);
  const yawRef = useRef(30);
  const [yaw, setYaw] = useState(30);

  const chooseYaw = (value: number) => {
    yawRef.current = value;
    setYaw(value);
  };

  useEffect(() => {
    const source = sourceRef.current;
    const target = targetRef.current;
    if (!source || !target) return;
    const stopSource = startObservedLoop(source, 360, 190, ctx => {
      drawCarCameraScene(ctx, 0, true, {
        backgroundColor: '#edf3f8',
        showLabels: false,
        showTurntable: false,
      });
    });
    const stopTarget = startObservedLoop(target, 360, 190, ctx => {
      drawCarCameraScene(ctx, yawRef.current * Math.PI / 180, false, {
        backgroundColor: '#f8eff1',
        showLabels: false,
        showTurntable: false,
        showWheelInset: true,
      });
    });
    return () => {
      stopSource();
      stopTarget();
    };
  }, []);

  const severity = Math.abs(yaw) < 8
    ? '当前视角变化较小，轮胎偏移尚不明显。继续增大角度观察错误累积。'
    : `目标视角达到${yaw}°后，红色生成轮胎逐渐偏离虚线标出的正确投影位置。`;

  return (
    <div className="car-wheel-gap">
      <p className="car-wheel-intro">将参考输入的视角旋转特定角度。</p>
      <div className="car-wheel-compare">
        <div className="car-wheel-panel">
          <canvas id={`cv-${chapterId}-${moduleId}-source`} ref={sourceRef} width={360} height={190} aria-label="汽车原始视角中车架与四个轮胎正确对齐" />
          <p className="car-wheel-panel-label">参考输入</p>
        </div>
        <div className="car-wheel-panel target">
          <canvas id={`cv-${chapterId}-${moduleId}-target`} ref={targetRef} width={360} height={190} aria-label="直接输入目标视角条件后汽车轮胎发生位置错位" />
          <p className="car-wheel-panel-label">生成效果</p>
        </div>
      </div>
      <div className="walk-param-grid camera-only">
        <label className="walk-param">
          <span>摄像机角度</span>
          <input type="range" min="-30" max="30" step="1" value={yaw} onChange={(event) => chooseYaw(Number(event.target.value))} />
          <output>{yaw >= 0 ? '+' : ''}{yaw}°</output>
        </label>
      </div>
      <div className="feedback bad">
        <strong>直接将视角条件送入模型生成视频会出现位置错位等质量问题。</strong>{severity}
      </div>
      <div className="feedback">
        预训练好的视频生成模型没有学习到视角变换后的空间结构，直接将视角改变条件送入模型进行生成时，模型不能保证物体的空间结构对齐
      </div>
    </div>
  );
};

export default ControlGap;
