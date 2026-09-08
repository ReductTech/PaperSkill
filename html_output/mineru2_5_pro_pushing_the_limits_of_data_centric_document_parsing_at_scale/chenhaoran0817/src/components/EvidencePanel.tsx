import React, { useState } from 'react';
import type { Checkpoint, EvidenceRef } from '../types';
import { GlossaryText } from './Glossary';

const KIND_LABEL = {
  paper: '论文事实',
  teaching: '教学示意',
  research: '研究者视角',
} as const;

export function EvidencePanel({
  items,
  title = '查看论文证据与边界',
}: {
  items: readonly EvidenceRef[];
  title?: string;
}) {
  return (
    <details className="evidence-panel">
      <summary>
        <span>{title}</span>
        <small>{items.length} 条可核对信息</small>
      </summary>
      <div className="evidence-list">
        {items.map((item, index) => (
          <article key={`${item.label}-${index}`} className={`evidence-item ${item.kind}`}>
            <span className={`source-tag ${item.kind}`}>{KIND_LABEL[item.kind]}</span>
            <div>
              <b><GlossaryText text={item.label} /></b>
              <p><GlossaryText text={item.text} /></p>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">{item.sourceLabel ?? '打开论文出处'} ↗</a>
              ) : item.sourceLabel ? <small>{item.sourceLabel}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}

export function CheckpointCard({ checkpoint }: { checkpoint: Checkpoint }) {
  const [choice, setChoice] = useState<number | null>(null);
  const isCorrect = choice === checkpoint.answer;

  return (
    <details className="checkpoint-card">
      <summary>
        <span>一分钟自检 · 不计分</span>
        <b>{checkpoint.question}</b>
      </summary>
      <div className="checkpoint-body">
        <div className="checkpoint-options" role="group" aria-label={checkpoint.question}>
          {checkpoint.options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={choice === index ? (isCorrect ? 'correct' : 'wrong') : ''}
              aria-pressed={choice === index}
              onClick={() => setChoice(index)}
            >
              {option}
            </button>
          ))}
        </div>
        {choice !== null ? (
          <p className={`checkpoint-feedback ${isCorrect ? 'correct' : 'wrong'}`} role="status">
            <b>{isCorrect ? '判断正确。' : '再看一下机制。'}</b><GlossaryText text={checkpoint.explanation} />
          </p>
        ) : null}
      </div>
    </details>
  );
}
