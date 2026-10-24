import React, { useState } from 'react';
import { Dept, Feedback, HW, Stamp } from './kit';

const EXCUSES = [
  { quote: '“代码我看着是对的”', rebut: '阅读不是验证。去跑。' },
  { quote: '“实现者的测试已经过了”', rebut: '独立验证。' },
  { quote: '“大概没问题”', rebut: '“大概”不算验证。去跑。' },
  { quote: '“这太花时间了”', rebut: '这不是你该决定的。' },
  { quote: '“我没有浏览器”', rebut: '去找 MCP 工具。' },
];

type Result = 'none' | 'pass' | 'fail';

/* 复查科：验证者的目标不是“确认它能跑”，而是“试着把它搞崩”。
   阅读只能给 PARTIAL；PASS 必须有执行证据。 */
export function Verification() {
  const [excuse, setExcuse] = useState<number | null>(null);
  const [result, setResult] = useState<Result>('none');
  const verdict = result === 'fail' ? 'FAIL' : result === 'pass' ? 'PASS' : 'PARTIAL';

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.32fr) minmax(0, 1fr)' }}>
      <div className="hw-col">
        <div className="hw-card" style={{ borderTop: `4px solid ${HW.blue}` }}>
          <div className="hw-spread">
            <p className="hw-t hw-muted">系统提示词 · 第一句</p>
            <Dept>复查科</Dept>
          </div>
          <p className="hw-h" style={{ marginTop: 4, lineHeight: 1.3 }}>
            “Your job is not to confirm the implementation works — it’s to try to break it.”
          </p>
        </div>

        <div className="hw-card hw-card--plain hw-col" style={{ gap: 6, flex: '1 1 auto' }}>
          <p className="hw-t hw-muted">它会想用这些借口跳过检查，逐个点开看反驳</p>
          {EXCUSES.map((item, index) => (
            <button key={item.quote} type="button" className="hw-btn hw-btn--block"
              aria-pressed={excuse === index} onClick={() => setExcuse(index)}
              style={{ padding: '6px 14px' }}>
              <span>{item.quote}</span>
              <span className="hw-chip" data-tone={excuse === index ? 'orange' : 'teal'}>
                {excuse === index ? item.rebut : '识别'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="hw-col">
        <div className="hw-card hw-card--plain" style={{ display: 'grid', gap: 8 }}>
          <p className="hw-t hw-muted">这次检查的结果</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['none', '没有执行'], ['pass', '跑了，通过'], ['fail', '跑了，失败']] as [Result, string][]).map(([id, label]) => (
              <button key={id} type="button" className="hw-btn"
                aria-pressed={result === id} onClick={() => setResult(id)}
                style={{ fontSize: 28, padding: '6px 12px' }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '10px 0' }}>
            <Stamp tone={verdict === 'PASS' ? 'green' : verdict === 'FAIL' ? 'red' : 'blue'}>{verdict}</Stamp>
            <p className="hw-t hw-muted" style={{ marginTop: 6 }}>
              {verdict === 'PASS' ? '有命令输出作为证据' : verdict === 'FAIL' ? '证据显示它确实坏了' : '只有阅读，没有证据'}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={result === 'none' ? 'bad' : result === 'fail' ? 'neutral' : 'good'}>
            {result === 'none'
              ? '读一遍就下结论，是这个 Agent 最想避免的事：它只允许 PARTIAL。'
              : result === 'fail'
                ? '验证者把实现搞崩了，这才是它被设计出来的用途。'
                : 'PASS 需要命令输出兜底；没有证据的“通过”不算通过。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
