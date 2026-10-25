import React from 'react';
import { RW } from './kit';

const SOURCE = 'https://github.com/777genius/claude-code-source-code-full/blob/main/docs/architecture.md';

/* 开篇先交代这份文档是什么：一份社区仓库里的架构说明，不是官方设计文档。
   三层边界决定后面每页可以说多满。 */
export function SourceCards() {
  return (
    <div className="rw" style={{ gridTemplateColumns: '500px minmax(0, 1fr)' }}>
      <section className="rw-card rw-card--plain rw-col" style={{ gap: 8 }}>
        <span className="rw-chip" data-tone="orange">社区整理 · 非官方文档</span>
        <p className="rw-t rw-t--tight" style={{ fontWeight: 700 }}>Architecture</p>
        <hr style={{ height: 1, background: RW.line, border: 0 }} />
        <dl className="rw-kv" style={{ gap: '4px 18px' }}>
          <dt>仓库</dt><dd style={{ fontSize: 28 }}>claude-code-source-code-full</dd>
          <dt>路径</dt><dd className="rw-mono" style={{ fontSize: 28 }}>docs/architecture.md</dd>
          <dt>更新</dt><dd>2026-10-08</dd>
          <dt>收藏</dt><dd>419 star（抓取时）</dd>
          <dt>许可</dt><dd>未声明（NOASSERTION）</dd>
          <dt>篇幅</dt><dd>224 行 · 约 7.8 KB</dd>
        </dl>
        <a className="rw-t" href={SOURCE} target="_blank" rel="noreferrer"
          title={SOURCE} style={{ wordBreak: 'break-all', fontSize: 28 }}>
          github.com/777genius/claude-code-source-code-full ↗
        </a>
      </section>

      <div className="rw-col" style={{ gap: 10 }}>
        <Boundary n={1} title="文档陈述" tone={RW.blue}
          body="Bun 运行时、46K 行引擎、九组特性开关。" hint="来自维护者的通读，不是官方说明。" />
        <Boundary n={2} title="代码可验证" tone={RW.green}
          body="文件名、注册表、开关名都能直接 grep。" hint="本页引用的是这类可核对的事实。" />
        <Boundary n={3} title="本教程模型" tone={RW.steel}
          body="耗时、包体、并发数都是示意值。" hint="不调用真实构建，也不代表当前版本。" />
        <div className="rw-band" style={{ marginTop: 'auto' }}>
          <span>阅读路线：全景 → 进程/渲染/控制 → 工具/状态 → 构建/启动 → 可迁移性</span>
        </div>
      </div>
    </div>
  );
}

function Boundary({ n, title, body, hint, tone }: { n: number; title: string; body: string; hint: string; tone: string }) {
  return (
    <section className="rw-card rw-row" style={{ alignItems: 'flex-start', flex: '1 1 0', gap: 16, borderLeftColor: tone }}>
      <span style={{
        display: 'inline-grid', placeItems: 'center', flex: 'none',
        width: 52, height: 52, borderRadius: 6, background: tone, color: '#fff',
        fontSize: 30, fontWeight: 700,
      }}>{n}</span>
      <div style={{ minWidth: 0 }}>
        <p className="rw-h" style={{ marginBottom: 2 }}>{title}</p>
        <p className="rw-t rw-t--tight">{body}</p>
        <p className="rw-t rw-t--tight rw-muted">{hint}</p>
      </div>
    </section>
  );
}
