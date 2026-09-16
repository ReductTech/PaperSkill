// 结语页：把整篇论文收成一段可复述的话。
// 只做归纳，不引入新事实；所有判断都能在前十章找到出处。

import React from 'react';
import type { ClosingDef } from '../types';

export function Closing({ closing }: { closing: ClosingDef }) {
  return (
    <section className="closing-section">
      <h2 className="chap-title">
        <span className="num">结语</span>
        {closing.title}
      </h2>
      {closing.lead ? <p className="closing-lead">{closing.lead}</p> : null}

      <div className="closing-body">
        {closing.paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>

      {closing.oneLiner ? (
        <div className="closing-oneliner" dangerouslySetInnerHTML={{ __html: closing.oneLiner }} />
      ) : null}
    </section>
  );
}
