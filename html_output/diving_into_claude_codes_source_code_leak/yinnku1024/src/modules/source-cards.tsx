import React from 'react';
import { INK } from './kit';

const SOURCE = 'https://read.engineerscodex.com/p/diving-into-claude-codes-source-code';

/* 开篇先把"读的是什么"讲清楚：哪些是文章报告的事实，哪些是作者推断，
   哪些是本教程自己造的教学模型。三层边界决定了后面每一页可以说多满。 */
export function SourceCards() {
  return (
    <div className="ps" style={{ gridTemplateColumns: '500px minmax(0, 1fr)' }}>
      <section className="ps-card ps-col" style={{ gap: 6 }}>
        <span className="ps-chip" data-tone="orange">二手分析 · 非同行评议</span>
        <p className="ps-t ps-t--tight" style={{ fontWeight: 700 }}>
          Diving into Claude Code&apos;s Source Code Leak
        </p>
        <hr className="ps-rule" />
        <dl className="ps-kv" style={{ gap: '4px 18px' }}>
          <dt>作者</dt><dd>Engineer&apos;s Codex</dd>
          <dt>载体</dt><dd>Substack 技术专栏</dd>
          <dt>日期</dt><dd>2026-04-01</dd>
          <dt>类型</dt><dd>技术分析长文</dd>
          <dt>反响</dt><dd>193 赞 · 27 次分享</dd>
          <dt>机构</dt><dd>原文未提供</dd>
        </dl>
        <a className="ps-t" href={SOURCE} target="_blank" rel="noreferrer"
          title="https://read.engineerscodex.com/p/diving-into-claude-codes-source-code">
          read.engineerscodex.com ↗
        </a>
      </section>

      <div className="ps-col" style={{ gap: 12 }}>
        <Boundary n={1} title="文章报告" tone={INK.blue}
          body="日期、文件名、代码字面量。"
          hint="对应原文正文与代码截图。" />
        <Boundary n={2} title="作者推断" tone={INK.orange}
          body="型号对应、效果强弱、数量口径。"
          hint="文中多以推测措辞出现。" />
        <Boundary n={3} title="本页教学模型" tone={INK.moss}
          body="可操作画面都是确定性示例。"
          hint="不调用模型、不跑命令。" />
        <div className="ps-band" style={{ marginTop: 'auto' }}>
          <span>阅读路线：<strong>泄漏</strong> → 可读的决策 → 五条下沉 → 代价</span>
        </div>
      </div>
    </div>
  );
}

function Boundary({ n, title, body, hint, tone }: { n: number; title: string; body: string; hint: string; tone: string }) {
  return (
    <section className="ps-card ps-row" style={{ alignItems: 'flex-start', flex: '1 1 0', gap: 18 }}>
      <span style={{
        display: 'inline-grid', placeItems: 'center', flex: 'none',
        width: 56, height: 56, borderRadius: 999, background: tone, color: '#fff',
        fontSize: 30, fontWeight: 700,
      }}>{n}</span>
      <div style={{ minWidth: 0 }}>
        <p className="ps-h" style={{ marginBottom: 2 }}>{title}</p>
        <p className="ps-t ps-t--tight">{body}</p>
        <p className="ps-t ps-t--tight ps-muted">{hint}</p>
      </div>
    </section>
  );
}
