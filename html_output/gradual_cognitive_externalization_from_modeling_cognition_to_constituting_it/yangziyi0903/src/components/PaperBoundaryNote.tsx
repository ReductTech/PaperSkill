import React from 'react';
export function PaperBoundaryNote({ text, title = '论文边界' }: { text?: string; title?: string }) { if (!text) return null; return <details className="paper-boundary"><summary>{title}<span>+</span></summary><p dangerouslySetInnerHTML={{ __html: text }} /></details>; }
