"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Film } from "lucide-react";
import { officialMedia } from "@/src/data/vista4d";

export function OfficialVideo({
  src,
  label,
  caption,
}: {
  src: string;
  label: string;
  caption: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (entry.isIntersecting && !reduceMotion) void video.play().catch(() => undefined);
      else video.pause();
    }, { threshold: 0.35 });
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); };
  }, []);

  const revealFirstFrame = () => {
    const video = ref.current;
    if (video && video.currentTime === 0) video.currentTime = Math.min(0.05, video.duration || 0.05);
  };

  return <figure className={`official-video ${failed ? "video-failed" : ready ? "video-ready" : "video-loading"}`} aria-busy={!ready && !failed}>
    <div className="official-video-top"><span><Film /> {label}</span><em>官方演示</em></div>
    <div className="official-video-frame">
      {failed ? <div className="video-error" role="status"><Film /><b>视频暂时无法加载</b><span>请稍后重试，或通过下方链接查看官方来源。</span></div> : <>
        <span className="video-first-frame-status">正在载入官方演示首帧…</span>
        <video ref={ref} muted loop playsInline preload="metadata" controls aria-label={label} onLoadedMetadata={revealFirstFrame} onLoadedData={() => setReady(true)} onCanPlay={() => setReady(true)} onSeeked={() => setReady(true)} onError={() => setFailed(true)}>
          <source src={src} type="video/mp4" />
        </video>
      </>}
    </div>
    <figcaption>{caption}</figcaption>
  </figure>;
}

export function HeroOfficialDemo() {
  return <div className="hero-official-demo">
    <OfficialVideo src={officialMedia.reshoot} label="源视频 · 点云渲染 · 重拍结果" caption="视频来源：Vista4D 官方项目演示。画面保持原始事件动态，并按新的目标摄影机生成重拍结果。" />
    <a href="https://github.com/Eyeline-Labs/Vista4D" target="_blank" rel="noreferrer">查看官方项目来源 <ExternalLink /></a>
  </div>;
}
