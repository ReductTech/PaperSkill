import React from 'react';

// 视频演示：嵌入一段相关视频（public/videos/doubao.mp4），可直接播放。

export function VideoDemo() {
  return (
    <section className="video-demo">
      <h2 className="video-title">视频演示</h2>
      <p className="video-sub">下面是一段相关视频，点击即可播放。</p>
      <video className="video-player" controls preload="metadata">
        <source src="/videos/doubao.mp4" type="video/mp4" />
        你的浏览器不支持视频播放。
      </video>
    </section>
  );
}
