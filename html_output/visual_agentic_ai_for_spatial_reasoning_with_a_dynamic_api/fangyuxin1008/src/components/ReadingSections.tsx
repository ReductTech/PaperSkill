import React from 'react';
import type { ReadingBlock } from '../data/explanations';

export function ReadingSections({blocks}:{blocks:ReadingBlock[]}) {
  return <div className="lesson-reading">{blocks.map((block,i)=><section className="lesson-reading-section" key={i}>{block.paragraphs.map((text,j)=><p key={j}>{text}</p>)}</section>)}</div>;
}
