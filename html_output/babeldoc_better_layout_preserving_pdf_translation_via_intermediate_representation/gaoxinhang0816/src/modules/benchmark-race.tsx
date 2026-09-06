import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MUSEUM_COLORS } from './museum-hero';

type Protocol = 'biou' | 'llmJudge' | 'human';
type SystemId = 'deepl' | 'pdfmt' | 'babeldoc';
type Direction = 'higher' | 'lower';

interface ProtocolSpec {
  label: string;
  shortLabel: string;
  who: string;
  compares: string;
  metric: string;
  direction: Direction;
  directionLabel: string;
  unit: string;
  values: Readonly<Record<SystemId, number>>;
  decimals: 1 | 2;
  evidenceNote: string;
  conclusion: string;
  boundary: string;
  statuses: Readonly<Record<SystemId, string>>;
  cautionSystem?: SystemId;
}

const SYSTEMS: readonly { id: SystemId; label: string }[] = [
  { id: 'deepl', label: 'DeepL' },
  { id: 'pdfmt', label: 'PDFMathTranslate' },
  { id: 'babeldoc', label: 'BabelDOC' },
];

const PROTOCOL_ORDER: readonly Protocol[] = ['biou', 'llmJudge', 'human'];

const PROTOCOLS: Readonly<Record<Protocol, ProtocolSpec>> = {
  biou: {
    label: '自动几何匹配',
    shortLabel: '自动计算',
    who: '同一 parser + 匹配流程',
    compares: '源页框 ↔ 译页框',
    metric: 'BIoU（边界框交并比）',
    direction: 'higher',
    directionLabel: '↑ 越高越重合',
    unit: '%',
    values: { deepl: 19.8, pdfmt: 48.7, babeldoc: 50.0 },
    decimals: 1,
    evidenceNote: '自动协议用 BIoU 展示几何布局重合。',
    conclusion: 'BabelDOC 为 50.0%，比 PDFMathTranslate 高 1.3 个百分点；这是几何布局重合优势，不是翻译精度优势。',
    boundary: 'BIoU 比较边界框几何关系，不能据此判断译文内容是否准确。',
    statuses: { deepl: '', pdfmt: '低 1.3 个百分点', babeldoc: '最高' },
  },
  llmJudge: {
    label: '多模态模型评审',
    shortLabel: 'Gemini 看页面',
    who: 'Gemini-2.5-Flash',
    compares: '原页 + 三系统高分辨率结果',
    metric: 'TP（翻译精度）',
    direction: 'higher',
    directionLabel: '↑ 越高越好',
    unit: '1–5 分',
    values: { deepl: 4.19, pdfmt: 2.78, babeldoc: 4.19 },
    decimals: 2,
    evidenceNote: 'Gemini 协议还报告其他维度；本页选 TP 保留“与 DeepL 并列”的谨慎结论。',
    conclusion: 'BabelDOC 与 DeepL 的 TP 同为 4.19；这套模型评审不支持“BabelDOC 的翻译精度超过 DeepL”。',
    boundary: '这是 Gemini-2.5-Flash 在该协议下的页面评分；TP 只是该协议的一项代表指标。',
    statuses: { deepl: '并列最高', pdfmt: '', babeldoc: '并列最高' },
  },
  human: {
    label: '人工评审',
    shortLabel: '人工检查覆盖',
    who: '3 名英中双语 NLP 标注者',
    compares: '匿名系统页面，展示顺序随机',
    metric: 'UTB（未翻译块）',
    direction: 'lower',
    directionLabel: '↓ 越低越好',
    unit: '块/页',
    values: { deepl: 2.33, pdfmt: 6.25, babeldoc: 2.85 },
    decimals: 2,
    evidenceNote: '人工协议还报告 LF / TP / VA / TC；本页选 UTB 作为覆盖反例。',
    conclusion: 'UTB 越低越好，DeepL 2.33 优于 BabelDOC 2.85；BabelDOC 仍存在未翻译块。',
    boundary: 'UTB 只统计未翻译文本块，不能代表人工协议的全部质量维度。',
    statuses: { deepl: '最低 = 更好', pdfmt: '', babeldoc: '不是最优' },
    cautionSystem: 'babeldoc',
  },
};

function bestSystems(spec: ProtocolSpec): SystemId[] {
  const values = SYSTEMS.map((system) => spec.values[system.id]);
  const best = spec.direction === 'higher' ? Math.max(...values) : Math.min(...values);
  return SYSTEMS
    .filter((system) => Math.abs(spec.values[system.id] - best) < 1e-9)
    .map((system) => system.id);
}

function formatValue(spec: ProtocolSpec, systemId: SystemId): string {
  const value = spec.values[systemId].toFixed(spec.decimals);
  return spec.unit === '%' ? `${value}%` : value;
}

const cardFieldStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr)',
  gap: 8,
  alignItems: 'start',
  textAlign: 'left',
};

export const BenchmarkRace: React.FC<WidgetProps> = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>('biou');
  const selected = PROTOCOLS[selectedProtocol];
  const selectedBest = bestSystems(selected);

  return (
    <div>
      <div className="feedback" style={{ marginBottom: 14, borderLeftColor: MUSEUM_COLORS.current }}>
        <strong>同一 200 页基准、同一组三个系统。</strong>
        80 页科学论文、60 页技术文档、60 页国际专利；结果必须在各自协议内读取。
      </div>

      <div
        role="tablist"
        aria-label="选择评测协议"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {PROTOCOL_ORDER.map((protocolId) => {
          const protocol = PROTOCOLS[protocolId];
          const selectedCard = selectedProtocol === protocolId;
          return (
            <button
              key={protocolId}
              id={`benchmark-tab-${protocolId}`}
              type="button"
              role="tab"
              aria-selected={selectedCard}
              aria-controls="benchmark-protocol-panel"
              onClick={() => setSelectedProtocol(protocolId)}
              style={{
                appearance: 'none',
                width: '100%',
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${selectedCard ? MUSEUM_COLORS.current : MUSEUM_COLORS.border}`,
                background: selectedCard ? '#eef3f8' : '#ffffff',
                color: MUSEUM_COLORS.text,
                cursor: 'pointer',
                font: 'inherit',
                boxShadow: selectedCard ? '0 6px 18px rgba(39, 68, 110, 0.10)' : 'none',
              }}
            >
              <span style={{ display: 'block', textAlign: 'left', marginBottom: 12 }}>
                <span style={{ display: 'block', color: MUSEUM_COLORS.current, fontSize: 13, fontWeight: 800 }}>
                  {protocol.shortLabel}
                </span>
                <strong style={{ display: 'block', marginTop: 3, fontSize: 18 }}>{protocol.label}</strong>
              </span>
              <span style={{ display: 'grid', gap: 8 }}>
                <span style={cardFieldStyle}>
                  <span style={{ color: MUSEUM_COLORS.muted, fontSize: 12 }}>谁评</span>
                  <strong style={{ fontSize: 13, lineHeight: 1.45 }}>{protocol.who}</strong>
                </span>
                <span style={cardFieldStyle}>
                  <span style={{ color: MUSEUM_COLORS.muted, fontSize: 12 }}>比什么</span>
                  <strong style={{ fontSize: 13, lineHeight: 1.45 }}>{protocol.compares}</strong>
                </span>
                <span style={cardFieldStyle}>
                  <span style={{ color: MUSEUM_COLORS.muted, fontSize: 12 }}>代表指标</span>
                  <strong style={{ fontSize: 13 }}>{protocol.metric} · {protocol.unit}</strong>
                </span>
                <span style={cardFieldStyle}>
                  <span style={{ color: MUSEUM_COLORS.muted, fontSize: 12 }}>方向</span>
                  <strong style={{ color: protocol.direction === 'lower' ? MUSEUM_COLORS.support : MUSEUM_COLORS.success, fontSize: 13 }}>
                    {protocol.directionLabel}
                  </strong>
                </span>
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 13,
                  paddingTop: 11,
                  borderTop: `1px solid ${MUSEUM_COLORS.border}`,
                  color: MUSEUM_COLORS.muted,
                  fontSize: 12,
                  lineHeight: 1.55,
                  textAlign: 'left',
                }}
              >
                {protocol.evidenceNote}
              </span>
            </button>
          );
        })}
      </div>

      <section
        id="benchmark-protocol-panel"
        role="tabpanel"
        aria-labelledby={`benchmark-tab-${selectedProtocol}`}
        style={{
          padding: 18,
          border: `1px solid ${MUSEUM_COLORS.border}`,
          borderRadius: 12,
          background: MUSEUM_COLORS.scene,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <span style={{ display: 'block', color: MUSEUM_COLORS.muted, fontSize: 12 }}>当前指标</span>
            <strong style={{ display: 'block', marginTop: 3, color: MUSEUM_COLORS.text, fontSize: 20 }}>
              {selected.metric} · {selected.unit}
            </strong>
          </div>
          <strong
            style={{
              padding: '6px 10px',
              border: `1px solid ${selected.direction === 'lower' ? MUSEUM_COLORS.support : MUSEUM_COLORS.success}`,
              borderRadius: 999,
              color: selected.direction === 'lower' ? MUSEUM_COLORS.support : MUSEUM_COLORS.success,
              background: '#ffffff',
              fontSize: 13,
            }}
          >
            {selected.directionLabel}
          </strong>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
          }}
        >
          {SYSTEMS.map((system) => {
            const isBest = selectedBest.includes(system.id);
            const isCaution = selected.cautionSystem === system.id;
            const accent = isBest
              ? MUSEUM_COLORS.success
              : isCaution
                ? MUSEUM_COLORS.support
                : MUSEUM_COLORS.border;
            return (
              <div
                key={system.id}
                style={{
                  minHeight: 126,
                  padding: 15,
                  border: `2px solid ${accent}`,
                  borderRadius: 11,
                  background: '#ffffff',
                }}
              >
                <strong style={{ display: 'block', minHeight: 38, color: MUSEUM_COLORS.text, fontSize: 14 }}>
                  {system.label}
                </strong>
                <span
                  style={{
                    display: 'block',
                    color: isBest ? MUSEUM_COLORS.success : isCaution ? MUSEUM_COLORS.support : MUSEUM_COLORS.text,
                    fontSize: 30,
                    fontWeight: 850,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatValue(selected, system.id)}
                </span>
                <span
                  style={{
                    display: 'block',
                    minHeight: 20,
                    marginTop: 8,
                    color: isBest ? MUSEUM_COLORS.success : isCaution ? MUSEUM_COLORS.support : MUSEUM_COLORS.muted,
                    fontSize: 12,
                    fontWeight: selected.statuses[system.id] ? 800 : 500,
                  }}
                >
                  {selected.statuses[system.id] || '同协议比较值'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div
        className="feedback"
        style={{
          marginTop: 12,
          borderLeftColor: selectedProtocol === 'human' ? MUSEUM_COLORS.support : MUSEUM_COLORS.current,
        }}
        aria-live="polite"
      >
        <strong>本组结论：</strong>{selected.conclusion}
      </div>
      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        <strong>证据边界：</strong>{selected.boundary}
      </div>
    </div>
  );
};

export default BenchmarkRace;
