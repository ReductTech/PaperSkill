import React from 'react';
import type { ChapterDef } from '../types';
import { PARTS } from '../outline';

// 阅读导览：把 10 章按六大块归类，给第一次读的人一张结构总纲。

export function Outline({
  chapters,
  onJump,
  onRepro,
}: {
  chapters: ChapterDef[];
  onJump: (chapterNumber: number) => void;
  onRepro: () => void;
}) {
  return (
    <section className="outline">
      <h2 className="outline-title">阅读导览 · 六大部分</h2>
      <p className="outline-sub">
        第一次读？先看这张总纲，把握全文结构，再逐章深入。点击任意章节可直达。
      </p>

      <div className="outline-grid">
        {PARTS.map((p) => (
          <div key={p.n} className="outline-part">
            <div className="outline-part-head">
              <span className="outline-part-num">{p.n}</span>
              <span className="outline-part-title">{p.title}</span>
            </div>
            <p className="outline-part-desc">{p.desc}</p>
            <div className="outline-part-chapters">
              {p.chapters.length === 0 ? (
                <button className="outline-chap" onClick={onRepro}>
                  项目复现指南与避坑要点
                </button>
              ) : (
                p.chapters.map((ci) => (
                  <button key={ci} className="outline-chap" onClick={() => onJump(ci)}>
                    §{ci} {chapters[ci - 1].title}
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
