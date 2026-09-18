// 前置知识 slide：把读这篇论文真正需要、而论文本身不解释的概念先摆出来。
// 每个概念先给「直觉」，再给「最小定义」，最后说清「为什么这篇论文需要它」。
// 默认折叠，点一下展开——避免一上来就把人压住。

import React, { useState } from 'react';
import type { Prerequisite } from '../types';

export function PrerequisiteMap({ items }: { items: Prerequisite[] }) {
  const [openId, setOpenId] = useState<string | null>(items.length ? items[0].id : null);

  return (
    <section className="pre-section">
      <h2 className="chap-title">
        <span className="num">前置</span>
        开始之前：读这篇论文需要的几个概念
      </h2>
      <p className="pre-intro">
        论文默认读者已经熟悉下面这些。为方便零基础读者学习，在这里补上重要的几个概念介绍，
        点击查看它的最小定义。
      </p>

      <div className="pre-grid">
        {items.map((item, i) => {
          const open = openId === item.id;
          return (
            <article
              key={item.id}
              className={`pre-card ${open ? 'open' : ''}`}
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <div className="pre-card-head">
                <span className="pre-index">{i + 1}</span>
                <h3 className="pre-title">{item.title}</h3>
                <span className="pre-toggle">{open ? '−' : '+'}</span>
              </div>
              <p className="pre-intuition">{item.intuition}</p>
              {open ? (
                <div className="pre-detail">
                  <div className="pre-field">
                    <span className="pre-label">最小定义</span>
                    <p>{item.minimalDefinition}</p>
                  </div>
                  <div className="pre-field">
                    <span className="pre-label">这篇论文为什么需要它</span>
                    <p>{item.whyNeeded}</p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
