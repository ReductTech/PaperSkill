import React from 'react';
import { tutorial } from '../data/tutorial';
import { widgetRegistry } from '../modules/registry';
import { C, STATUS_LEGEND, TOKEN_LEGEND } from '../modules/sv-palette';
import { Tag, type ContentTag } from '../modules/sv-kit';
import { Rich } from './Rich';
import { ModuleCard } from './Chapter';
import { ROUTES } from './content';
import { GLOSSARY } from './glossary';
import { LEVELS, RETELL, SOURCES, VERDICTS } from './closing';

// 封面与收束（版式取自 VTW v7.3 的 vtw9/Parts.tsx）。
// 封面的原模型 / SparseVLM 两侧画在同一张画布里，共用一个时钟：进入视口播放一次后停在结果，可重播；
// 只给一帧的环境（缩略图、后台标签页）和减少动态效果时直接显示结果。

const STATS: { value: string; label: string; tag: ContentTag }[] = [
  { value: '99.1%', label: '192 档 8 项平均精度（相对原模型，表 1）', tag: 'paper' },
  { value: '1.72 / 4.62 T', label: '128 档 / 原模型的预填充 FLOPs（表 1）', tag: 'paper' },
  { value: '33.28 / 57.82 ms', label: '128 档 / 原模型的 CUDA 延迟（单张 A100，表 1）', tag: 'paper' },
  { value: '576→​309→​204→​113', label: '192 档逐层视觉 token 数（按代码常数推算）', tag: 'extrap' },
];

export function Hero({ onStart, onRoute }: { onStart: () => void; onRoute: (n: number) => void }) {
  const { meta, hero } = tutorial;
  const Cover = widgetRegistry[hero.newMethod.componentId];
  return (
    <section className="hero" id="top">
      <span className="hero-badge">INTERACTIVE TUTORIAL</span>
      <h1>{meta.titleEn}</h1>
      <p className="hero-sub">{meta.titleZh} · ICML 2025</p>
      <p className="hero-authors">{meta.authors}</p>
      <p className="hero-authors">{meta.affiliation} · {meta.venue}</p>
      <p className="hero-abstract">
        一张图在 LLaVA-1.5 里是 576 个视觉 token，占了输入的大头，却要在每一层参与计算。SparseVLM 先从问题里挑出与图像相关的词当“评分员”，复用解码层的注意力给视觉 token 打分，逐层删掉不重要的，再把被删 token 里较重要的一批聚类合并回来；不训练、不加参数。
      </p>
      <div className="hero-chips">
        {['文本引导', '评分员', '逐层剪枝', 'token 回收', '无需训练', 'FLOPs ≠ 延迟'].map((k) => (
          <span key={k}>{k}</span>
        ))}
      </div>
      <div className="sv-hero-duel">{Cover ? <Cover chapterId="cover" moduleId="cover" /> : null}</div>
      <div className="hero-stats">
        {STATS.map((s) => (
          <div key={s.value}>
            <b>{s.value}</b>
            <span>{s.label}</span>
            <Tag kind={s.tag} />
          </div>
        ))}
      </div>
      <div className="hero-routes">
        <span className="hero-routes-k">按目的选一条路线</span>
        {ROUTES.map((r) => (
          <button key={r.title} type="button" onClick={() => onRoute(r.to)}>
            <b>{r.title}</b>
            <span>{r.path}</span>
          </button>
        ))}
      </div>
      <p className="hero-warn">
        读前须知：理论 FLOPs ≠ 实测速度；表 1 的“保留 192 个”是 32 层平均，不是每层 192 个；论文只报告一组汇总结果、未交代重复次数和方差，小差值不能判断优劣；论文与固定代码有几处不一致（见 §10）；数字以 ICML 正式版为准。
      </p>
      <div className="hero-cta">
        准备好了吗？
        <button type="button" className="chap-loader-btn" onClick={onStart}>
          开始学习 §1<span className="chap-loader-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

const LEVEL_TONE: Record<string, string> = { proven: 'is-ok', explained: 'is-warn', unknown: 'is-unknown' };

export function Closing() {
  const glossary = Object.entries(GLOSSARY);
  return (
    <>
      <section className="chap" id="closing" aria-labelledby="closing-t">
        <h2 className="chap-title" id="closing-t">
          <span className="num">✦</span>收束：结论分级<span className="badge-tag">总结</span>
        </h2>
        <div className="chap-bridge">
          <div className="cb-icon" aria-hidden="true">?</div>
          <div className="cb-body">
            <div className="cb-title">本节问题</div>
            <div className="cb-text sv-intro">读完这一篇，哪些结论站得住？先在分级模块里逐条看依据，完整分级列在下方。</div>
          </div>
        </div>
        <ModuleCard id="✦" componentId="sv-verdict" chapterId="closing" title="结论分级：已证明 / 有解释但未证实 / 仍然未知" desc="切换等级，在条目列表里选一条：所选内容给出依据和对应章节。" notes="【口径】分级是本页依据论文正式版、固定提交代码与本页复算所做的判断；每条依据写明来源。论文仅报告一组汇总结果，未交代重复运行次数和方差，也没有误差条；小差值一律只报差值。" />
        <div className="sv-verdict-cols">
          {LEVELS.map((lv) => (
            <div key={lv.level} className={`sv-verdict-col ${LEVEL_TONE[lv.level]}`}>
              <h3>{lv.title}</h3>
              <p className="sv-muted">{lv.desc}</p>
              <ul>
                {VERDICTS.filter((v) => v.level === lv.level).map((v) => (
                  <li key={v.id}>
                    <b>
                      <Rich text={v.claim} />
                    </b>
                    <span>
                      <Rich text={v.basis} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <details className="v9-deep">
          <summary>复述练习：用自己的话讲一遍（5 问）</summary>
          {RETELL.map((r, i) => (
            <details key={r.q} className="sv-retell">
              <summary>
                {i + 1}. {r.q}
              </summary>
              <p>
                <Rich text={r.a} />
              </p>
            </details>
          ))}
        </details>
      </section>

      <section className="chap" id="glossary" aria-labelledby="glossary-t">
        <h2 className="chap-title" id="glossary-t">
          <span className="num">✦</span>术语表<span className="badge-tag">{glossary.length} 条</span>
        </h2>
        <dl className="sv-gloss">
          {glossary.map(([k, g]) => (
            <div key={k} id={`g-${k}`}>
              <dt>
                {g.term}
                {g.en ? <span>{g.en}</span> : null}
              </dt>
              <dd>
                <span className="sv-gloss-k">直觉</span>
                {g.intuition}
                <br />
                <span className="sv-gloss-k">在本文中的作用</span>
                <span className="sv-muted">{g.role}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="chap" id="sources" aria-labelledby="sources-t">
        <h2 className="chap-title" id="sources-t">
          <span className="num">✦</span>来源与证据边界<span className="badge-tag">溯源</span>
        </h2>
        <ul className="sv-sources">
          {SOURCES.map((s) => (
            <li key={s.label}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
              <span>{s.note}</span>
            </li>
          ))}
        </ul>
        <div className="v9-check">
          <b>内容口径</b>　页面用四种标记区分来源：<Tag kind="paper" /> <Tag kind="code" /> <Tag kind="extrap" /> <Tag kind="demo" />（悬停可看说明）。论文仅报告一组汇总结果，未交代重复运行次数和方差，也没有逐题结果和置信区间，小差值一律只报差值；引用 arXiv 时写明版本号；代码链接固定到 734d900（视频实验为 f05b898），不用 main 分支。
        </div>
        <div className="sv-legend-block">
          <h3>配色图例</h3>
          <p className="sv-muted">同一种 token 或状态在正文、控件和画布里用同一个颜色（颜色定义集中在 sv-palette.ts）。</p>
          <ul className="sv-legend-list">
            {TOKEN_LEGEND.map((it) => (
              <li key={it.key}>
                <i className={`sv-sw ${it.dashed ? 'is-dashed' : ''}`} style={{ background: C[it.key] }} aria-hidden="true" />
                <b>{it.label}</b>
                <span>{it.note}</span>
              </li>
            ))}
          </ul>
          <ul className="sv-legend-list is-status">
            {STATUS_LEGEND.map((it) => (
              <li key={it.key}>
                <i className="sv-sw" style={{ background: C[it.key] }} aria-hidden="true" />
                <b>{it.label}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
