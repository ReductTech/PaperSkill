import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from './aiflow-shared';
import type { WidgetProps } from './registry';

interface LogEntry {
  time: string;
  from: string;
  to: string;
  type: string;
  status: 'ok' | 'rejected';
  message: string;
}

type InjectMode = 'source' | 'node';
type TargetNode = 'classify' | 'reasoning' | 'tts' | 'safety';
type EventType = 'interrupt' | 'token' | 'mismatch';

const NODE_LABELS: Record<TargetNode, string> = {
  classify: '分类',
  reasoning: '推理日志',
  tts: 'TTS',
  safety: '安全标签',
};

const NODE_INPUT_TYPES: Record<TargetNode, string> = {
  classify: 'Token',
  reasoning: 'Reasoning',
  tts: 'AudioText',
  safety: 'SafetyLabel',
};

const INJECT_TYPES: Record<EventType, string> = {
  interrupt: 'ControlSignal',
  token: 'Token',
  mismatch: 'SafetyLabel',
};

const Ch5Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<InjectMode>('source');
  const [target, setTarget] = useState<TargetNode>('classify');
  const [eventType, setEventType] = useState<EventType>('interrupt');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [pulse, setPulse] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (pulse) {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const p = elapsed / 800;
        if (p >= 1) {
          setPulse(null);
          setAnimPhase(0);
          return;
        }
        setAnimPhase(p);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }
  }, [pulse]);

  const inject = () => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const from = mode === 'source' ? '图源' : '注入器';
    const to = mode === 'source' ? '图源' : NODE_LABELS[target];

    if (eventType === 'mismatch') {
      setLog(l => [{
        time: now,
        from,
        to,
        type: INJECT_TYPES[eventType],
        status: 'rejected' as const,
        message: `编译期拒绝：${to} 声明输入类型 ${NODE_INPUT_TYPES[target]} 与注入类型 ${INJECT_TYPES[eventType]} 不兼容`,
      }, ...l].slice(0, 12));
      return;
    }

    setLog(l => [{
      time: now,
      from,
      to,
      type: INJECT_TYPES[eventType],
      status: 'ok' as const,
      message: `offer(${mode === 'source' ? 'value' : `'${target}', value`}) → ${to} 已投递，类型校验通过`,
    }, ...l].slice(0, 12));
    setPulse(mode === 'source' ? 'source' : target);
  };

  const allNodes = [
    { id: 'source', label: '图源', x: 50, y: 60, kind: 'source' as const },
    { id: 'classify', label: '分类', x: 180, y: 60, kind: 'node' as const },
    { id: 'reasoning', label: '推理日志', x: 340, y: 20, kind: 'node' as const },
    { id: 'tts', label: 'TTS', x: 460, y: 100, kind: 'node' as const },
    { id: 'safety', label: '安全标签', x: 340, y: 100, kind: 'node' as const },
  ];

  const edges: [string, string][] = [
    ['source', 'classify'],
    ['classify', 'reasoning'],
    ['classify', 'safety'],
    ['safety', 'tts'],
  ];

  const isControlChannel = eventType === 'interrupt' && pulse !== null;
  const activeTarget = pulse ?? (mode === 'node' ? target : '');

  return (
    <div className="ch5mod2-container" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', padding: '8px' }}>
      {/* 左栏：控制面板 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px', background: '#fff' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: COLORS.textMain, marginBottom: '8px' }}>注入方式</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={mode === 'source' ? 'active' : ''}
              style={{ flex: 1, padding: '6px', border: `1px solid ${mode === 'source' ? COLORS.blue : COLORS.border}`, borderRadius: '4px', background: mode === 'source' ? COLORS.blue : '#fff', color: mode === 'source' ? '#fff' : COLORS.textMain, cursor: 'pointer', fontSize: '12px' }}
              onClick={() => setMode('source')}
            >offer(value)</button>
            <button
              className={mode === 'node' ? 'active' : ''}
              style={{ flex: 1, padding: '6px', border: `1px solid ${mode === 'node' ? COLORS.blue : COLORS.border}`, borderRadius: '4px', background: mode === 'node' ? COLORS.blue : '#fff', color: mode === 'node' ? '#fff' : COLORS.textMain, cursor: 'pointer', fontSize: '12px' }}
              onClick={() => setMode('node')}
            >offer(nodeId, value)</button>
          </div>
        </div>

        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px', background: '#fff' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: COLORS.textMain, marginBottom: '8px' }}>目标节点</div>
          <select
            value={target}
            disabled={mode === 'source'}
            style={{ width: '100%', padding: '6px', border: `1px solid ${COLORS.border}`, borderRadius: '4px', fontSize: '12px', background: mode === 'source' ? '#f0f0f0' : '#fff', color: COLORS.textMain, cursor: mode === 'source' ? 'not-allowed' : 'pointer' }}
            onChange={e => setTarget(e.target.value as TargetNode)}
          >
            {Object.entries(NODE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {mode === 'source' && (
            <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '4px' }}>offer(value) 投递到图源，无需选目标</div>
          )}
        </div>

        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px', background: '#fff' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: COLORS.textMain, marginBottom: '8px' }}>事件类型</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([['interrupt', '中断事件'], ['token', '令牌事件'], ['mismatch', '类型不匹配']] as [EventType, string][]).map(([key, label]) => (
              <button
                key={key}
                className={eventType === key ? 'active' : ''}
                style={{ padding: '5px 10px', border: `1px solid ${eventType === key ? COLORS.blue : COLORS.border}`, borderRadius: '4px', background: eventType === key ? COLORS.blue : '#fff', color: eventType === key ? '#fff' : COLORS.textMain, cursor: 'pointer', fontSize: '12px' }}
                onClick={() => setEventType(key)}
              >{label}</button>
            ))}
          </div>
        </div>

        <button
          onClick={inject}
          style={{ padding: '10px', border: 'none', borderRadius: '6px', background: COLORS.green, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
        >注入事件</button>
      </div>

      {/* 右栏：图可视化 + 日志 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: COLORS.bg, padding: '8px', position: 'relative' }}>
          <svg width="100%" height="180" viewBox="0 0 520 150" style={{ overflow: 'visible' }}>
            {/* 边 */}
            {edges.map(([from, to], i) => {
              const f = allNodes.find(n => n.id === from)!;
              const t = allNodes.find(n => n.id === to)!;
              const isCtrl = isControlChannel && (to === activeTarget || from === activeTarget);
              return (
                <line
                  key={i}
                  x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                  stroke={isCtrl ? COLORS.red : COLORS.lightEnv}
                  strokeWidth={isCtrl ? 3 : 4}
                  strokeDasharray={isCtrl ? '6 4' : 'none'}
                />
              );
            })}
            {/* 中断信号动画 */}
            {isControlChannel && animPhase < 1 && (
              <>
                {(['reasoning', 'safety', 'tts'] as TargetNode[]).map((tid, i) => {
                  const tgt = allNodes.find(n => n.id === tid);
                  if (!tgt) return null;
                  const src = allNodes.find(n => n.id === 'classify')!;
                  const p = Math.max(0, Math.min(1, (animPhase - i * 0.15) * 1.5));
                  if (p <= 0 || p >= 1) return null;
                  return (
                    <circle key={`sig-${i}`} cx={src.x + (tgt.x - src.x) * p} cy={src.y + (tgt.y - src.y) * p} r="5" fill={COLORS.red} />
                  );
                })}
              </>
            )}
            {/* 节点 */}
            {allNodes.map(n => {
              const isPulsed = pulse === n.id;
              const isTarget = mode === 'node' && target === n.id;
              const r = isPulsed ? 20 + Math.sin(animPhase * Math.PI) * 4 : 16;
              const fill = isPulsed ? COLORS.orange : isTarget ? COLORS.blue : COLORS.darkEnv;
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke={isPulsed ? COLORS.orange : COLORS.border} strokeWidth="2" />
                  <text x={n.x} y={n.y + 3} textAnchor="middle" fill="#fff" style={{ fontSize: '9px' }}>{n.label}</text>
                </g>
              );
            })}
            {/* 拒绝框 */}
            {eventType === 'mismatch' && pulse === null && log.length > 0 && log[0].status === 'rejected' && (
              <g>
                <rect x="330" y="120" width="190" height="25" fill={COLORS.red + '22'} stroke={COLORS.red} rx="3" />
                <text x="425" y="137" textAnchor="middle" fill={COLORS.red} style={{ fontSize: '11px' }}>✗ 编译期拒绝：类型不匹配</text>
              </g>
            )}
            {/* 中断传播文案 */}
            {isControlChannel && (
              <text x="260" y="145" textAnchor="middle" fill={COLORS.red} style={{ fontSize: '11px' }}>
                中断信号沿控制通道传播 → 下游取消
              </text>
            )}
          </svg>
        </div>

        {/* 日志列表 */}
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: '#fff', maxHeight: '120px', overflowY: 'auto' }}>
          <div style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: '12px', color: COLORS.textMain, position: 'sticky', top: 0, background: '#fff' }}>
            注入日志
          </div>
          {log.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>点击"注入事件"查看投递结果</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={{ padding: '5px 10px', borderBottom: `1px solid ${COLORS.border}33`, fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>{entry.time}</span>
                <span style={{ color: entry.status === 'ok' ? COLORS.green : COLORS.red, flexShrink: 0, fontWeight: 600 }}>
                  {entry.status === 'ok' ? '✓' : '✗'}
                </span>
                <span style={{ color: COLORS.textMain }}>{entry.message}</span>
              </div>
            ))
          )}
        </div>

        {/* 反馈条 */}
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          background: eventType === 'mismatch' ? `${COLORS.red}15` : `${COLORS.green}15`,
          color: eventType === 'mismatch' ? COLORS.red : COLORS.green,
          border: `1px solid ${eventType === 'mismatch' ? COLORS.red : COLORS.green}`,
        }}>
          {eventType === 'mismatch'
            ? '编译器拒绝注入：事件类型与目标节点声明的输入类型不一致'
            : eventType === 'interrupt'
              ? '中断事件经控制通道沿图传播，下游节点收到取消信号'
              : '令牌事件经正常通道传播到下游节点'}
        </div>
      </div>
    </div>
  );
};

type SideEffectMode = 'idempotent' | 'non-idempotent' | 'speculative';

interface SeLogEntry {
  time: string;
  action: string;
  result: string;
  ok: boolean;
}

const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<SideEffectMode>('idempotent');
  const [triggered, setTriggered] = useState(false);
  const [log, setLog] = useState<SeLogEntry[]>([]);
  const [bufProgress, setBufProgress] = useState(0);
  const bufRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'speculative' && !triggered) {
      const tick = () => {
        setBufProgress(p => {
          const np = p + 0.015;
          return np >= 1 ? 0.15 : np;
        });
        bufRef.current = requestAnimationFrame(tick);
      };
      bufRef.current = requestAnimationFrame(tick);
      return () => { if (bufRef.current) cancelAnimationFrame(bufRef.current); };
    } else if (bufRef.current) {
      cancelAnimationFrame(bufRef.current);
      bufRef.current = null;
    }
  }, [mode, triggered]);

  const triggerFail = () => {
    setTriggered(true);
    const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    if (mode === 'idempotent') {
      setLog(l => [{
        time: now,
        action: '重试 #1',
        result: 'key=(cid_42, classify, seq_7) → 命中去重，结果一致',
        ok: true,
      }, {
        time: now,
        action: '重试 #2',
        result: 'key=(cid_42, classify, seq_7) → 命中去重，结果一致',
        ok: true,
      }, ...l].slice(0, 12));
    } else if (mode === 'non-idempotent') {
      setLog(l => [{
        time: now,
        action: '失败检测',
        result: '无补偿策略 → fail-fast，不重试',
        ok: false,
      }, ...l].slice(0, 12));
    } else {
      setLog(l => [{
        time: now,
        action: '投机确认',
        result: '缓冲区已满(7/7 token) → 确认提交',
        ok: true,
      }, ...l].slice(0, 12));
    }
    setTimeout(() => setTriggered(false), 1500);
  };

  const modeConfig = {
    idempotent: {
      label: 'Idempotent（幂等）',
      color: COLORS.green,
      desc: 'key = (conversation_id, node_id, input_sequence)',
      detail: '重试时用相同 key 去重，可安全重试',
      viz: (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['cid_42', 'classify', 'seq_7'].map((part, i) => (
            <span key={i} style={{ padding: '3px 8px', border: `1px solid ${COLORS.green}`, borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace', color: COLORS.green, background: `${COLORS.green}11` }}>
              {part}
            </span>
          ))}
          <span style={{ fontSize: '11px', color: COLORS.textMuted, alignSelf: 'center' }}>→ 派生 key</span>
        </div>
      ),
    },
    'non-idempotent': {
      label: 'Non-Idempotent（非幂等）',
      color: COLORS.red,
      desc: '无补偿策略',
      detail: '→ fail-fast（快速失败），不重试',
      viz: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ padding: '4px 12px', border: `2px solid ${COLORS.red}`, borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: COLORS.red, background: `${COLORS.red}11` }}>
            ✗ FAIL-FAST
          </span>
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>立即报错，不重试</span>
        </div>
      ),
    },
    speculative: {
      label: 'Speculative（投机）',
      color: COLORS.purple,
      desc: '输出本地缓冲直到确认',
      detail: '适合安全过滤跨多 token 的场景',
      viz: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: '100%', height: '24px', border: `1px solid ${COLORS.purple}`, borderRadius: '3px', background: `${COLORS.purple}11`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${bufProgress * 100}%`, height: '100%', background: `${COLORS.purple}66`, transition: 'width 0.05s linear' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: COLORS.purple, fontWeight: 600 }}>
              缓冲区 {Math.floor(bufProgress * 7)}/7 token
            </div>
          </div>
          {bufProgress > 0.85 && (
            <span style={{ fontSize: '11px', color: COLORS.green, fontWeight: 600 }}>✓ 接近满 → 确认提交</span>
          )}
        </div>
      ),
    },
  };
  const cfg = modeConfig[mode];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', padding: '8px' }}>
      {/* 左栏 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '10px', background: '#fff' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: COLORS.textMain, marginBottom: '8px' }}>副作用类型</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {([['idempotent', 'Idempotent'], ['non-idempotent', 'Non-idempotent'], ['speculative', 'Speculative']] as [SideEffectMode, string][]).map(([key, label]) => (
              <button
                key={key}
                className={mode === key ? 'active' : ''}
                style={{ padding: '8px', border: `1px solid ${mode === key ? cfg.color : COLORS.border}`, borderRadius: '4px', background: mode === key ? `${cfg.color}11` : '#fff', color: mode === key ? cfg.color : COLORS.textMain, cursor: 'pointer', fontSize: '12px', textAlign: 'left', fontWeight: mode === key ? 600 : 400 }}
                onClick={() => { setMode(key); setTriggered(false); setLog([]); }}
              >{label}</button>
            ))}
          </div>
        </div>

        <button
          onClick={triggerFail}
          disabled={triggered}
          style={{ padding: '10px', border: 'none', borderRadius: '6px', background: triggered ? COLORS.border : COLORS.orange, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: triggered ? 'not-allowed' : 'pointer' }}
        >触发失败</button>
      </div>

      {/* 右栏 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ border: `1px solid ${cfg.color}`, borderRadius: '6px', background: '#fff', padding: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: cfg.color, marginBottom: '8px' }}>{cfg.label}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: COLORS.textMain, marginBottom: '6px' }}>{cfg.desc}</div>
          <div style={{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '12px' }}>{cfg.detail}</div>
          {cfg.viz}
        </div>

        {/* 日志 */}
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', background: '#fff', maxHeight: '100px', overflowY: 'auto' }}>
          <div style={{ padding: '6px 10px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, fontSize: '12px', color: COLORS.textMain, position: 'sticky', top: 0, background: '#fff' }}>
            执行日志
          </div>
          {log.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '12px', color: COLORS.textMuted }}>点击"触发失败"查看恢复行为</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={{ padding: '5px 10px', borderBottom: `1px solid ${COLORS.border}33`, fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: COLORS.textMuted, flexShrink: 0 }}>{entry.time}</span>
                <span style={{ color: entry.ok ? COLORS.green : COLORS.red, flexShrink: 0, fontWeight: 600 }}>
                  {entry.ok ? '✓' : '✗'}
                </span>
                <span style={{ color: COLORS.textMain, fontWeight: 600, flexShrink: 0 }}>{entry.action}:</span>
                <span style={{ color: COLORS.textMuted }}>{entry.result}</span>
              </div>
            ))
          )}
        </div>

        {/* 反馈条 */}
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          background: mode === 'non-idempotent' ? `${COLORS.red}15` : mode === 'speculative' ? `${COLORS.purple}15` : `${COLORS.green}15`,
          color: mode === 'non-idempotent' ? COLORS.red : mode === 'speculative' ? COLORS.purple : COLORS.green,
          border: `1px solid ${mode === 'non-idempotent' ? COLORS.red : mode === 'speculative' ? COLORS.purple : COLORS.green}`,
        }}>
          {mode === 'idempotent'
            ? '幂等：用(cid, nodeId, seq)派生key，可安全重试'
            : mode === 'non-idempotent'
              ? '非幂等：无补偿策略则fail-fast，不重试'
              : '投机：输出本地缓冲直到确认，适合安全过滤跨多token场景'}
        </div>
      </div>
    </div>
  );
};

export { Ch5Mod2, Ch9Mod2 };
