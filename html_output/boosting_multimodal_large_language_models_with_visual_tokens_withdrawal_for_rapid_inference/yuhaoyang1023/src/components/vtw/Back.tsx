import React, { useState } from 'react';
import { useReducedMotion } from '../../lib/hooks';
import { jumpTo } from './Nav';
import { tutorial, COMMIT } from '../../data/tutorial';
import { Rich, Tag } from '../../ui/kit';

const LEVEL_ICON: Record<string, string> = { proven: '✓', explained: '≈', unknown: '?' };

function BackHead({ id, mark, badge, title, desc }: { id: string; mark: string; badge: string; title: string; desc: string }) {
  return (
    <header className="back-head reveal">
      <div className="chap-num" aria-hidden="true">
        {mark}
      </div>
      <div>
        <div className="chap-badge">{badge}</div>
        <h2 id={`${id}-title`} tabIndex={-1} className="chap-title">
          <span className="chap-title-mask">{title}</span>
        </h2>
        <p className="back-desc">{desc}</p>
      </div>
    </header>
  );
}

function RetellCard({ i, item }: { i: number; item: NonNullable<typeof tutorial.retell>[number] }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  return (
    <li className="rt-item reveal">
      <div className={`rt ${open ? 'is-open' : ''}`}>
      <div className="rt-n" aria-hidden="true">
        {i + 1}
      </div>
      <div className="rt-body">
        <p className="rt-q">{item.q}</p>
        <label className="rt-own">
          <span>先用自己的话说一遍（只在这台设备的这个页面里，不会保存或上传）</span>
          <textarea id={`retell-${i}`} rows={2} placeholder="写下你的说法……" />
        </label>
        <div className="ctrl-row">
          <button type="button" className="btn btn-primary" aria-expanded={open} aria-controls={`retell-a-${i}`} onClick={() => setOpen((o) => !o)}>
            {open ? '收起参考说法' : '对照参考说法'}
          </button>
          <a
            className="rt-link"
            href={`#${item.target}`}
            onClick={(e) => {
              e.preventDefault();
              jumpTo(item.target, reduced);
            }}
          >
            {item.targetLabel} ↑
          </a>
        </div>
        <div className="rt-a" id={`retell-a-${i}`} hidden={!open}>
          <Rich text={item.a} />
        </div>
      </div>
      </div>
    </li>
  );
}

export function Retell() {
  const items = tutorial.retell ?? [];
  return (
    <section id="retell" className="back" aria-labelledby="retell-title">
      <BackHead
        id="retell"
        mark="↺"
        badge="合上页面之前"
        title="用自己的话讲一遍 VTW"
        desc="五个问题串起全文。先自己说，再对照参考说法；说不上来的那一题，点链接回看对应章节。"
      />
      <ol className="rt-list">
        {items.map((it, i) => (
          <RetellCard key={it.q} i={i} item={it} />
        ))}
      </ol>
    </section>
  );
}

export function Verdict() {
  return (
    <section id="verdict" className="back" aria-labelledby="verdict-title">
      <BackHead
        id="verdict"
        mark="✦"
        badge="全文收束"
        title="结论分级：哪些已证明，哪些只是解释"
        desc="把论文的主张按证据强度分成三档，每一条写明依据。“已证明”也只在论文测试过的模型、基准与硬件上成立。"
      />
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
      <BackHead
        id="glossary"
        mark="Aa"
        badge={`术语表 · ${entries.length} 条`}
        title="术语表"
        desc="正文中带虚线下划线的词都可以悬停或点按查看。这里集中列出“直觉解释”和“在本文中的作用”。"
      />
      <dl className="gl-grid">
        {entries.map(([k, g]) => (
          <div className="gl reveal" key={k} id={`term-${k}`}>
            <dt>
              {g.term}
              {g.en ? <span> · {g.en}</span> : null}
            </dt>
            <dd>
              <p>
                <b>直觉</b>
                {g.intuition}
              </p>
              <p>
                <b>本文中</b>
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
      <BackHead id="sources" mark="¶" badge="资料与口径" title="资料来源与本页口径" desc="编号与数字以 AAAI 2025 正式版为准；arXiv 附录单独标注；代码链接固定到具体 commit 与行号。" />
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
            <Tag kind="paper" /> 直接取自论文正文、表格或图；只见于 arXiv v3 附录的内容会注明“arXiv 附录”。
          </li>
          <li>
            <Tag kind="code" /> 直接取自官方代码 commit {COMMIT.slice(0, 7)}（含 README 截图），附行号链接。
          </li>
          <li>
            <Tag kind="extrap" /> 本页按论文公式或代码口径计算、反推得到，论文没有报告。
          </li>
          <li>
            <Tag kind="demo" /> 为讲解绘制的示意曲线、小模型或场景，不是论文或真实模型的数据。
          </li>
        </ul>
        <h3>颜色约定</h3>
        <ul className="legend-colors">
          <li>
            <i className="lc lc-ok" /> 绿：验证通过（复算一致、猜对）
          </li>
          <li>
            <i className="lc lc-warn" /> 琥珀：限制、证据边界、复算不一致
          </li>
          <li>
            <i className="lc lc-bad" /> 红：错误或失败（例如所需信息已被撤走）
          </li>
          <li>
            <i className="lc lc-vis" /> 青：视觉 token · <i className="lc lc-sys" /> 月银紫：系统 token · <i className="lc lc-ins" /> 沙色：指令 token · <i className="lc lc-out" /> 珍珠白：输出 token
          </li>
        </ul>
        <p className="legend-note">
          <Rich text="页面中写明“本页推断 / 本页解释”的内容是解读，不代表论文结论。本页没有任何视频平台推荐。" />
        </p>
      </div>
      <footer className="foot">
        <p>VTW 交互式中文精读 · 基于 PaperSkill React + TypeScript 模板制作 · 论文与代码版权归原作者所有</p>
      </footer>
    </section>
  );
}
