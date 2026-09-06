import React from 'react';
import type { WidgetProps } from './registry';

// §9 模块 9.3 —— 定性结果视频：浙江大学大场景重建 hero 演示。
// 视频文件置于 public/ 下，Vite 以根路径 /zju-zjg-hero-720p.mp4 直接提供服务。
export const ModVideo: React.FC<WidgetProps> = () => {
  return (
    <div className="video-block">
      <video
        className="result-video"
        src="/zju-zjg-hero-720p.mp4"
        controls
        loop
        muted
        playsInline
        preload="metadata"
      />
      <p className="video-cap">
        浙江大学大场景重建演示：数百帧长序列<b>一次</b>拼成一张一致的三维地图，相机轨迹与几何结构随镜头连续推进而<b>稳定对齐</b>，没有明显的块间漂移与接缝错位。
      </p>
    </div>
  );
};

export default ModVideo;
