import React, { useState } from 'react';
import llavaCover from '../assets/videos/llava.jpg';
import fastvCover from '../assets/videos/fastv.jpg';
import flashCover from '../assets/videos/flash.jpg';
import dpcCover from '../assets/videos/dpc.jpg';

// 延伸学习 · B 站视频（卡片样式沿用 DivPrune / VTW）。只放外链，不内嵌播放器；封面随构建打包，
// 不在运行时请求 B 站接口；封面加载失败时保留渐变底、标题和链接。显示简洁标题，原标题存在 sourceTitle；不显示播放量。
export interface Video {
  bvid: string;
  title: string;
  sourceTitle: string;
  up: string;
  duration: string;
  label: string;
  cover?: string;
  why: string;
}

// 2026-11-03 在 B 站检索“SparseVLM”及相关词，没有找到 SparseVLM 本篇的讲解；以下四段为背景 / 对照材料。
// BV 号、原标题、UP 主、时长、封面于 2026-11-03 在 B 站核对（视频信息接口与视频页）。
export const VIDEOS: Video[] = [
  {
    bvid: 'BV12PznYuExg',
    title: 'LLaVA / LLaVA-1.5 / LLaVA-NeXT：多模态模型结构',
    sourceTitle: '看傻眼！LLaVA多模态模型最简单的模型，最强的效果！LLaVA LLaVA-1.5 LLaVA-NeXT',
    up: 'RethinkFun',
    duration: '15:14',
    label: '模型背景',
    cover: llavaCover,
    why: '对应 §1：视觉编码器、投影层与语言模型怎样连起来，576 个视觉 token 从哪里来。',
  },
  {
    bvid: 'BV1A2VT6wE6J',
    title: 'FastV 算法详解（Token Compression）',
    sourceTitle: '大模型推理加速第4期—Token Compression---FastV算法详解',
    up: '图明讲算法',
    duration: '08:58',
    label: '对照方法',
    cover: fastvCover,
    why: '对应 §2、§8：FastV 用最后位置的注意力剪枝，是表 1、表 3 的主要对照。',
  },
  {
    bvid: 'BV1UT421k7rA',
    title: 'Flash Attention 为什么那么快',
    sourceTitle: 'Flash Attention 为什么那么快？原理讲解',
    up: 'RethinkFun',
    duration: '17:34',
    label: '工程背景',
    cover: flashCover,
    why: '对应 §4：FlashAttention 为什么不保存注意力矩阵，所以打分需要额外办法。',
  },
  {
    bvid: 'BV1p44y137se',
    title: '密度峰值聚类算法（Science 2014）导读',
    sourceTitle: 'Science 论文导读：密度峰值聚类算法（density peak clustering）',
    up: '科研小玩家',
    duration: '08:32',
    label: '算法背景',
    cover: dpcCover,
    why: '对应 §6：ρ 与 δ 怎样选出簇中心；SparseVLM 用它的 kNN 变体聚合被删 token。',
  },
];

export function Videos() {
  const [badCovers, setBadCovers] = useState<Record<string, boolean>>({});
  return (
    <section className="dl-related-section sv-videos" id="videos" aria-labelledby="videos-t">
      <h3 id="videos-t">延伸学习 · B 站视频</h3>
      <p>没有找到 SparseVLM 本篇的 B 站讲解（2026-11-03 检索）。下面四段是背景与对照材料：补模型结构看 LLaVA，比较方法看 FastV，理解打分的工程难点看 FlashAttention，理解回收看密度峰聚类。</p>
      <div className="dl-video-strip">
        {VIDEOS.map((video) => (
          <a
            key={video.bvid}
            className="dl-video-card"
            href={`https://www.bilibili.com/video/${video.bvid}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在 B 站打开：${video.sourceTitle}（新标签页）`}
            data-bvid={video.bvid}
          >
            <div className={`dl-video-link-cover ${badCovers[video.bvid] || !video.cover ? '' : 'is-loaded'}`}>
              {video.cover && !badCovers[video.bvid] ? (
                <img
                  className="dl-video-cover-img"
                  src={video.cover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="640"
                  height="360"
                  onError={() => setBadCovers((previous) => ({ ...previous, [video.bvid]: true }))}
                />
              ) : null}
              <span className="dl-video-play" aria-hidden="true">▶</span>
              <span className="dl-video-link-tag">{video.label}</span>
              <span className="dl-video-duration">{video.duration}</span>
            </div>
            <strong title={video.sourceTitle}>{video.title}</strong>
            <div className="dl-video-meta">
              <span>{video.up}</span>
              <span>B 站 ↗</span>
            </div>
            <div className="dl-video-why">{video.why}</div>
          </a>
        ))}
      </div>
      <p className="sv-video-note">视频为补充学习材料，不能替代 SparseVLM 论文与固定版本代码；SparseVLM 的剪枝层、配额、回收常数与实验数字，以 ICML 正式版和固定提交为准。</p>
    </section>
  );
}
