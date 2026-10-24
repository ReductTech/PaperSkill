import React from 'react';
import { HW, Num } from './kit';

const SKELETON = ['Agent 循环', '流式工具执行', '四层权限管道', 'MCP 集成', 'Skill 系统', 'Swarm 多 Agent'];

const MOMENTS = [
  '反自我欺骗', 'AI 做梦', '缓存经济学', 'YOLO 分类器',
  '提示词组装', '遥测与远程', '320 个旋钮', '语音',
  'KAIROS', '隐藏后台服务', '两种管理智慧', '六条教训',
];

/* 这一页只做一件事：把“已经有人拆过骨架”和“本文要看什么”分开。 */
export function WhyRead() {
  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.18fr)' }}>
      <div className="hw-card hw-card--plain hw-col">
        <p className="hw-h">已经被拆过的骨架</p>
        <p className="hw-t hw-muted">这些分析已经很完整，本文不再重复。</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {SKELETON.map(item => (
            <span key={item} className="hw-chip" data-tone="teal">{item}</span>
          ))}
        </div>
        <div className="hw-slot" style={{ marginTop: 'auto' }}>
          <p className="hw-t hw-t--tight">
            洁净室反混淆、逆向分析、架构拆解都在回答<strong>“它怎么做的”</strong>。
            骨架清楚了，问题才刚出现：为什么是这个形状？
          </p>
        </div>
      </div>

      <div className="hw-card hw-card--plain hw-col">
        <p className="hw-h">本文停下来看的 12 个瞬间</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px', marginTop: 4 }}>
          {MOMENTS.map((item, index) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="hw-num" style={{ width: 36, height: 36, fontSize: 26, background: index < 4 ? HW.blue : HW.teal }}>{index + 1}</span>
              <span className="hw-t hw-t--tight">{item}</span>
            </div>
          ))}
        </div>
        <div className="hw-band" style={{ marginTop: 'auto' }}>
          <span>骨架回答<strong>怎么搭</strong>；这篇问<strong>为什么这么想</strong>。</span>
        </div>
      </div>
    </div>
  );
}
