import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const ink = '#21324a';
const blue = '#27446e';
const green = '#228d5c';
const red = '#c43f52';
const orange = '#f07e47';
const border = '#d7deea';
const paper = '#f5f8f0';

const wrap: CSSProperties = {
  display: 'grid', height: '100%', gridTemplateRows: '1fr auto', gap: 18,
  fontSize: 'var(--ppt-body-text)', color: ink, lineHeight: 1.34,
};
const panel: CSSProperties = {
  padding: '23px 28px', borderRadius: 20, border: '1px solid ' + border,
  background: '#fff', minWidth: 0,
};
const heading: CSSProperties = { fontSize: 'var(--ppt-body-heading)', margin: 0, lineHeight: 1.2 };
const emphasis: CSSProperties = { fontSize: 'var(--ppt-body-emphasis)', fontWeight: 750 };
const footer: CSSProperties = {
  margin: 0, padding: '13px 21px', borderLeft: '5px solid ' + orange,
  background: '#fff5eb', borderRadius: '0 12px 12px 0',
};

function Button({ children, onClick, pressed, disabled }: {
  children: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return <button type="button" onClick={onClick} aria-pressed={pressed} disabled={disabled}
    style={{
      padding: '8px 18px', borderRadius: 10, lineHeight: 1.2, whiteSpace: 'nowrap',
      border: '2px solid ' + (pressed ? blue : border), background: pressed ? blue : 'white',
      color: pressed ? 'white' : blue, opacity: disabled ? 0.45 : 1,
      font: 'inherit', fontWeight: 680, cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>;
}

type Stove = 'gas' | 'induction';

function fillRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.fill();
}

function drawKitchen(ctx: CanvasRenderingContext2D, x: number, jump: number, available: Stove, adapted: boolean) {
  ctx.clearRect(0, 0, 780, 258);
  fillRounded(ctx, 0, 0, 780, 258, 15, paper);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      fillRounded(ctx, col * 69 + 13, row * 42 + 9, 64, 37, 4, '#e3ebda');
    }
  }
  fillRounded(ctx, 0, 147, 780, 18, 4, '#92400e');
  fillRounded(ctx, 0, 165, 780, 93, 0, '#ceb396');
  for (let col = 0; col < 4; col += 1) {
    fillRounded(ctx, col * 193 + 12, 176, 176, 67, 7, '#ac8b70');
    fillRounded(ctx, col * 193 + 78, 191, 44, 6, 3, '#f4e7d7');
  }
  for (const [center, kind] of [[182, 'gas'], [584, 'induction']] as const) {
    const enabled = kind === available;
    fillRounded(ctx, center - 143, 111, 286, 38, 11, enabled ? blue : '#a9afb6');
    oval(ctx, center, 121, 75, 13, enabled ? '#e0e9f4' : '#d7dce1');
    oval(ctx, center, 121, 65, 10, enabled ? blue : '#a9afb6');
    if (kind === 'gas') {
      for (const offset of [-29, -10, 10, 29]) {
        ctx.fillStyle = enabled ? orange : '#737d8c';
        ctx.beginPath();
        ctx.moveTo(center + offset - 5, 125);
        ctx.quadraticCurveTo(center + offset + 6, 110, center + offset + 2, 108);
        ctx.quadraticCurveTo(center + offset + 16, 124, center + offset + 5, 128);
        ctx.fill();
      }
    } else {
      oval(ctx, center, 121, 42, 7, enabled ? '#70b49a' : '#d7dce1');
      oval(ctx, center, 121, 33, 5, enabled ? blue : '#a9afb6');
    }
  }

  const panColor = adapted ? green : '#37475a';
  const y = 84 - jump;
  fillRounded(ctx, x + 59, y + 1, 79, 13, 6, '#92400e');
  oval(ctx, x, y + 12, 74, 19, panColor);
  oval(ctx, x, y, 78, 18, panColor);
  oval(ctx, x, y, 67, 13, '#e2e7e9');
  oval(ctx, x - 15, y + 1, 12, 5, '#f5c870');
  oval(ctx, x + 10, y + 2, 12, 5, '#a4bf75');
}

function Kitchen({ available, adapted }: { available: Stove; adapted: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const previous = useRef(182);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const from = previous.current;
    const to = adapted ? 584 : 182;
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    function render(now: number) {
      if (!ctx) return;
      const progress = reduce || from === to ? 1 : Math.min((now - start) / 420, 1);
      const eased = progress * progress * (3 - 2 * progress);
      previous.current = from + (to - from) * eased;
      drawKitchen(ctx, previous.current, Math.sin(progress * Math.PI) * 19, available, adapted);
      if (progress < 1) frame = requestAnimationFrame(render);
    }
    render(start);
    return () => cancelAnimationFrame(frame);
  }, [available, adapted]);

  return <canvas width={780} height={258} ref={canvas} role="img"
    aria-label={adapted ? '换了合适的锅，移到电磁炉' : '旧轨迹仍把锅放在燃气灶上'}
    style={{ display: 'block', width: '100%', height: 'auto' }} />;
}

export function Repair() {
  const [available, setAvailable] = useState<Stove>('gas');
  const [adapted, setAdapted] = useState(false);
  const valid = available === 'gas' || adapted;
  function changeStove(next: Stove) {
    setAvailable(next);
    setAdapted(false);
  }
  return <section style={wrap}>
    <div style={{ display: 'grid', gridTemplateColumns: '837px 1fr', gap: 24, minHeight: 0 }}>
      <div style={{ ...panel, display: 'grid', alignContent: 'start', gap: 16 }}>
        <h2 style={heading}>选择新厨房的可用灶具</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button pressed={available === 'gas'} onClick={() => changeStove('gas')}>燃气灶</Button>
          <Button pressed={available === 'induction'} onClick={() => changeStove('induction')}>电磁炉</Button>
        </div>
        <Kitchen available={available} adapted={adapted} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', color: blue, fontWeight: 650 }}>
          <span>燃气灶{available === 'gas' ? ' · 可用' : ' · 不可用'}</span>
          <span>电磁炉{available === 'induction' ? ' · 可用' : ' · 不可用'}</span>
        </div>
      </div>
      <div style={{ ...panel, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h2 style={heading}>检验旧示范的具体动作</h2>
        <p style={{ margin: 0, color: blue }}>旧轨迹：把锅放上燃气灶，再开火预热。</p>
        <div aria-live="polite">
          <div style={{ ...emphasis, color: valid ? green : red }}>{valid ? '动作可执行' : '动作不可执行'}</div>
          <p style={{ margin: '7px 0 0' }}>{adapted ? '换用可电磁加热的锅具，改走电磁炉的操作步骤。' : available === 'gas' ? '当前厨房具备旧动作所需的燃气灶。' : '炉具不匹配，旧轨迹里的开火动作在这里不可用。'}</p>
        </div>
        <Button disabled={available !== 'induction' || adapted} onClick={() => setAdapted(true)}>按现有炉具改写动作</Button>
      </div>
    </div>
    <p style={footer}>教学示例。可以保留「下菜前先预热」这条规则，具体动作仍需满足新环境的约束。</p>
  </section>;
}

const tokenBudget = 768;
const tokensPerRule = 24;

function drawNotebook(ctx: CanvasRenderingContext2D, ruleCount: number) {
  ctx.clearRect(0, 0, 470, 184);
  fillRounded(ctx, 0, 0, 470, 184, 14, paper);
  fillRounded(ctx, 44, 147, 382, 13, 5, '#92400e');
  const pages = Math.ceil(ruleCount / 6);
  for (let page = 0; page < pages; page += 1) {
    fillRounded(ctx, 81 + page * 2, 133 - page * 7, 234, 17, 4, '#b8c9a7');
    fillRounded(ctx, 80 + page * 2, 130 - page * 7, 229, 14, 3, '#fffaf1');
  }
  fillRounded(ctx, 75 + (pages - 1) * 2, 116 - (pages - 1) * 7, 244, 17, 4, blue);
  fillRounded(ctx, 228 + (pages - 1) * 2, 111 - (pages - 1) * 7, 28, 21, 3, orange);
  fillRounded(ctx, 348, 93, 47, 52, 7, '#c18b65');
  oval(ctx, 371, 94, 23, 7, '#644534');
  fillRounded(ctx, 365, 58, 8, 45, 3, '#92400e');
  oval(ctx, 369, 58, 10, 14, '#a26941');
  fillRounded(ctx, 383, 62, 7, 40, 3, '#92400e');
  fillRounded(ctx, 379, 50, 14, 19, 3, '#a26941');
}

function Notebook({ count }: { count: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) drawNotebook(ctx, count);
  }, [count]);
  return <canvas ref={canvas} width={470} height={184} role="img"
    aria-label={'厨房笔记本中积累了 ' + count + ' 条规则'} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}

export function Limits() {
  const [count, setCount] = useState(18);
  const use = count * tokensPerRule;
  const remaining = tokenBudget - use;
  const statusColor = remaining < 0 ? red : green;
  const fill = Math.min(100, (use / tokenBudget) * 100);
  return <section style={wrap}>
    <div style={{ display: 'grid', gridTemplateColumns: '876px 1fr', gap: 24, minHeight: 0 }}>
      <div style={{ ...panel, display: 'grid', alignContent: 'space-between', gap: 15 }}>
        <h2 style={heading}>整张规则表占用多少上下文？</h2>
        <p style={{ margin: 0 }}>模拟预算 768 token，每条规则平均 24 token。</p>
        <label htmlFor="expel-rule-count" style={{ color: blue, fontWeight: 650 }}>规则数量 <strong style={emphasis}>{count}</strong> 条</label>
        <input id="expel-rule-count" type="range" min={4} max={48} value={count}
          onChange={event => setCount(event.currentTarget.valueAsNumber)}
          style={{ width: '100%', height: 28, accentColor: orange, margin: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <span style={emphasis}>{use} / {tokenBudget} token</span>
          <strong style={{ color: statusColor }} aria-live="polite">
            {remaining < 0 ? '超出 ' + -remaining + ' token' : remaining ? '剩余 ' + remaining + ' token' : '恰好用完预算'}
          </strong>
        </div>
        <div aria-hidden="true" style={{ height: 30, background: '#e8edf2', borderRadius: 8 }}>
          <div style={{ width: fill + '%', height: '100%', background: statusColor, borderRadius: 8,
            transition: 'width 160ms ease-out, background-color 160ms ease-out' }} />
        </div>
        <p style={{ margin: 0 }}>论文推理阶段拼接完整规则表。长期积累时，可以考虑按需检索规则。</p>
      </div>
      <div style={{ ...panel, display: 'grid', alignContent: 'start', gap: 15 }}>
        <Notebook count={count} />
        <h2 style={heading}>论文还留下三个边界</h2>
        <ul style={{ margin: 0, paddingLeft: 33, display: 'grid', gap: 9 }}>
          <li>实验只使用文本观测。</li>
          <li>实验依赖闭源模型 API。</li>
          <li>提示词方法缺少理论保证。</li>
        </ul>
      </div>
    </div>
    <p style={footer}>规则积累能改变下一次推理的上下文。要做持续学习，还得解决规则增长后的选择问题。</p>
  </section>;
}
