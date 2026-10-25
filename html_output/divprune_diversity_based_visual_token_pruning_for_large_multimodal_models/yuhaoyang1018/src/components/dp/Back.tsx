import React from 'react';
import { tutorial, COMMIT } from '../../data/tutorial';
import { Rich, Tag } from '../../ui/kit';

const LEVEL_ICON: Record<string, string> = { proven: '✓', explained: '≈', unknown: '?' };

export function Verdict() {
  return (
    <section id="verdict" className="back" aria-labelledby="verdict-title">
      <header className="back-head reveal">
        <div className="chap-num" aria-hidden="true">
          ✦
        </div>
        <div>
          <div className="chap-badge">全文收束</div>
          <h2 id="verdict-title" tabIndex={-1}>
            结论分级：哪些已证明，哪些还只是解释
          </h2>
          <p className="chap-bridge">把论文的主张按证据强度分成三档，每一条都写明依据。“已证明”也只在论文测试的条件内成立。</p>
        </div>
      </header>
      <div className="vd-grid">
        {tutorial.verdict!.map((g) => (
          <div key={g.level} className={`vd vd-${g.level} reveal`}>
            <div className="vd-head">
              <span className="vd-ic" aria-hidden="true">
                {LEVEL_ICON[g.level]}
              </span>
              <div>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </div>
            </div>
            <ol>
              {g.items.map((it) => (
                <li key={it.claim}>
                  <div className="vd-claim">
                    <Rich text={it.claim} />
                  </div>
                  <div className="vd-basis">
                    <span>依据</span>
                    <Rich text={it.basis} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Glossary() {
  const entries = Object.entries(tutorial.glossary!);
  return (
    <section id="glossary" className="back" aria-labelledby="glossary-title">
      <header className="back-head reveal">
        <div className="chap-num" aria-hidden="true">
          Aa
        </div>
        <div>
          <div className="chap-badge">术语表 · {entries.length} 条</div>
          <h2 id="glossary-title" tabIndex={-1}>
            术语表
          </h2>
          <p className="chap-bridge">正文中带下划虚线的词都可以悬停或点按查看。这里集中列出“直觉解释”和“在本文中的作用”。</p>
        </div>
      </header>
      <dl className="gl-grid">
        {entries.map(([k, g]) => (
          <div className="gl reveal" key={k} id={`term-${k}`}>
            <dt>
              {g.term}
              {g.en ? <span> · {g.en}</span> : null}
            </dt>
            <dd>
              <p>
                <b>直觉：</b>
                {g.intuition}
              </p>
              <p>
                <b>本文中：</b>
                {g.role}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Sources() {
  return (
    <section id="sources" className="back" aria-labelledby="sources-title">
      <header className="back-head reveal">
        <div className="chap-num" aria-hidden="true">
          ¶
        </div>
        <div>
          <div className="chap-badge">资料与口径</div>
          <h2 id="sources-title" tabIndex={-1}>
            资料来源与本页口径
          </h2>
          <p className="chap-bridge">所有编号、数字以 CVPR 2025 正式版为准；代码链接固定到具体 commit 与行号。</p>
        </div>
      </header>
      <ul className="src-list reveal">
        {tutorial.sources!.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label} ↗
            </a>
            <span>{s.note}</span>
          </li>
        ))}
      </ul>
      <div className="legend reveal">
        <h3>四种口径标记</h3>
        <ul>
          <li>
            <Tag kind="paper" /> 直接取自论文正文、表格或图（含补充材料，补充材料的图表注明 supp）。
          </li>
          <li>
            <Tag kind="code" /> 直接取自官方代码 commit {COMMIT.slice(0, 7)}，附行号链接。
          </li>
          <li>
            <Tag kind="extrap" /> 本页按论文公式或官方代码计算得到，论文本身没有报告。
          </li>
          <li>
            <Tag kind="demo" /> 为讲解而绘制或生成的示意数据（点云、示意图块、小模型），不是真实数据。
          </li>
        </ul>
        <p className="legend-note">
          <Rich text="本页没有引用任何视频平台资源；模板自带的视频推荐组件保留在工程中但不渲染。页面中的“本页推测 / 推断”均为作者解读，不代表论文结论。" />
        </p>
      </div>
      <footer className="foot">
        <p>DivPrune 交互式中文精读 · 基于 PaperSkill React + TypeScript 模板制作 · 论文版权归原作者所有</p>
      </footer>
    </section>
  );
}
