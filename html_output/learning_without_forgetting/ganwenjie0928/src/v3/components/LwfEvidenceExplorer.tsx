import { useState } from "react";
import { evidenceCards, knowledgeById, type ClaimCard, type EvidenceCard } from "../../data/knowledge";
import { table1ImageNetCub } from "../../data/tableResults";
import {
  evidenceInterpretations,
  evidenceOrder,
  evidenceProtocol,
  evidenceQuestions,
  figure4ReadingGuide,
  figure7ReadingGuide,
  arxivPaperRecord,
  table2Questions,
  verdictClaimIds,
  verdictQuestions,
  type LwfEvidenceId,
} from "../data/evidence";

const evidenceLabels: Record<LwfEvidenceId, string> = {
  table_1: "Table 1 · 单次新任务比较",
  table_2: "Table 2 · 架构与训练消融",
  figure_4: "Figure 4 · 连续加入任务",
  figure_7: "Figure 7 · 目标与损失选择",
};

const evidenceAliases: Record<string, string> = {
  "evidence:table_1": "table-1",
  "evidence:table_2": "table-2",
  "evidence:figure_4": "figure-4",
  "evidence:figure_7": "figure-7",
  "evidence:tracking": "tracking-appendix",
};

const verdictOptions = [
  { id: "Supported", label: "Supported" },
  { id: "Too Strong", label: "Too Strong" },
  { id: "Unsupported", label: "Unsupported" },
] as const;

function evidenceCardFor(id: LwfEvidenceId): EvidenceCard {
  return evidenceCards.find((card) => card.id === `evidence:${id}`)!;
}

function claimFor(id: (typeof verdictClaimIds)[number]): ClaimCard | undefined {
  const card = knowledgeById.get(id);
  return card?.kind === "claim" ? card as ClaimCard : undefined;
}

function expectedVerdict(claim: ClaimCard) {
  if (claim.verdict === "Too strong") return "Too Strong";
  if (claim.verdict === "Not directly tested") return "Unsupported";
  return "Supported";
}

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1)} pp`;
}

function claimLabel(id: (typeof verdictClaimIds)[number]) {
  const labels: Record<(typeof verdictClaimIds)[number], string> = {
    "claim:eliminates_forgetting": "消除灾难性遗忘",
    "claim:no_old_training_data": "无需旧任务训练数据",
    "claim:response_beats_parameter": "响应正则与参数 L2 的受限比较",
    "claim:foundation_models_scope": "适用于基础模型",
  };
  return labels[id];
}

export function LwfEvidenceExplorer({ onOpenReference }: { onOpenReference: (termId: string) => void }) {
  const [selectedEvidence, setSelectedEvidence] = useState<LwfEvidenceId>("table_1");
  const [selectedTable2Question, setSelectedTable2Question] = useState<(typeof table2Questions)[number]["id"]>("branch");
  const [selectedClaimId, setSelectedClaimId] = useState<(typeof verdictClaimIds)[number]>(verdictClaimIds[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const card = evidenceCardFor(selectedEvidence);
  const interpretation = evidenceInterpretations[selectedEvidence];
  const selectedClaim = claimFor(selectedClaimId);
  const selectedAnswer = answers[selectedClaimId];
  const question2 = table2Questions.find((question) => question.id === selectedTable2Question)!;

  const openEvidenceReference = (id: string) => {
    const alias = evidenceAliases[id];
    if (alias) onOpenReference(alias);
  };

  const renderProtocol = () => <section className="v3-evidence-chain-step is-protocol" aria-labelledby="v3-evidence-protocol-title">
    <span className="v3-evidence-step-label">02 · PROTOCOL</span>
    <h4 id="v3-evidence-protocol-title">先确认任务、模型和测量方式</h4>
    <p>{evidenceProtocol[selectedEvidence].text}</p>
    <div className="v3-evidence-source-line"><span>论文位置</span><strong>{evidenceProtocol[selectedEvidence].sourceLabel}</strong></div>
  </section>;

  const renderTable1 = () => <div className="v3-table-scroll" role="region" aria-label="ImageNet 到 CUB 的 Table 1(a) 原始报告值" tabIndex={0}>
    <table className="v3-evidence-table">
      <caption>Table 1(a) 摘录 · ImageNet → CUB · Top-1 accuracy</caption>
      <thead><tr><th scope="col">Method</th><th scope="col">Old task · ImageNet</th><th scope="col">New task · CUB</th><th scope="col">使用旧训练数据</th></tr></thead>
      <tbody>{table1ImageNetCub.methods.map((method) => <tr key={method.id}>
        <th scope="row">{method.label}</th>
        <td>{method.id === "lwf" ? `${table1ImageNetCub.baseline.old.toFixed(1)}%` : formatDelta(method.oldDelta!)}</td>
        <td>{method.id === "lwf" ? `${table1ImageNetCub.baseline.next.toFixed(1)}%` : formatDelta(method.newDelta!)}</td>
        <td>{method.oldData ? "是 · 图像与标签" : "否"}</td>
      </tr>)}</tbody>
    </table>
    <p className="v3-evidence-table-note">此处选取四种常见路线。原表还包含 LFL 与 Fine-tune FC。LwF 行是原表直接报告的绝对准确率；其他方法是相对 LwF 的带符号差值（百分点），这里不重建绝对值。</p>
  </div>;

  const renderTable2 = () => <div className="v3-table2-explorer" aria-label="Table 2 研究问题">
    <div className="v3-table2-questions" role="tablist" aria-label="选择消融研究问题">
      {table2Questions.map((question) => <button key={question.id} type="button" role="tab" aria-selected={question.id === selectedTable2Question} onClick={() => setSelectedTable2Question(question.id)}>{question.label}</button>)}
    </div>
    <dl className="v3-table2-answer" role="tabpanel">
      <div><dt>Setup · 对照设置</dt><dd>{question2.setup}</dd></div>
      <div><dt>Observed result · 观察结果</dt><dd>{question2.observed}</dd></div>
      <div><dt>Interpretation · 解读</dt><dd>{question2.interpretation}</dd></div>
      <div><dt>Boundary · 结论边界</dt><dd>{question2.boundary}</dd></div>
    </dl>
  </div>;

  const renderFigure = () => {
    const isFigure4 = selectedEvidence === "figure_4";
    const readingGuide = isFigure4 ? figure4ReadingGuide : figure7ReadingGuide;
    const page = evidenceProtocol[selectedEvidence].sourcePage;
    return <>
      <figure className="v3-evidence-paper-preview">
        <div className="v3-evidence-paper-source">
          <span>原文图索引 · {isFigure4 ? "Figure 4" : "Figure 7"} · 第 {page} 页</span>
          <strong>{isFigure4 ? "连续加入任务后的各任务表现" : "目标权重与损失选择下的表现对照"}</strong>
          <p>此处提供原文定位和逐项读图说明；需要核对原图时，请从 arXiv 论文记录打开。</p>
          <a href={arxivPaperRecord()} target="_blank" rel="noreferrer">打开 arXiv 论文记录 ↗</a>
        </div>
        <figcaption>下方读图指南只总结登记过的设置与结论，不补画论文中未登记的曲线坐标。</figcaption>
      </figure>
      <dl className="v3-figure-reading-guide">{readingGuide.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl>
    </>;
  };

  const renderEvidence = () => {
    if (selectedEvidence === "table_1") return renderTable1();
    if (selectedEvidence === "table_2") return renderTable2();
    return renderFigure();
  };

  const claimEvidenceIds = selectedClaim
    ? [...new Set([...selectedClaim.supportingEvidence, ...(selectedClaim.related ?? []).filter((id) => id.startsWith("evidence:"))])]
    : [];

  return <>
    <section className="v3-evidence-block v3-evidence-main-block" aria-labelledby="v3-evidence-main-title">
      <div className="v3-evidence-block-heading"><span>06B · CLAIM ↔ EVIDENCE EXPLORER</span><h3 id="v3-evidence-main-title">按问题核对四组核心证据</h3><p>每组都先列出自己的任务与评估协议，再查看论文表格或图、作者解释和结论边界。</p></div>
      <div className="v3-evidence-explorer">
    <section className="v3-evidence-selector" aria-label="选择论文证据">
      <span className="v3-evidence-step-label">CLAIM SELECTOR</span>
      <p>从一个问题开始，逐组核对论文提供的材料。</p>
      <div role="tablist" aria-label="四组核心证据">
        {evidenceOrder.map((id) => {
          const linkedToCurrentClaim = Boolean(selectedAnswer && claimEvidenceIds.includes(`evidence:${id}`));
          return <button key={id} type="button" role="tab" aria-selected={selectedEvidence === id} aria-label={`${evidenceLabels[id]}${linkedToCurrentClaim ? " · 与当前判断主张相关" : ""}`} className={linkedToCurrentClaim ? "is-claim-linked" : ""} data-evidence-id={id} data-linked-claim={linkedToCurrentClaim || undefined} onClick={() => setSelectedEvidence(id)}>
            <strong>{evidenceLabels[id]}</strong><span>{evidenceQuestions[id]}</span>{linkedToCurrentClaim ? <em>关联当前判断</em> : null}
          </button>;
        })}
      </div>
    </section>

    <article key={selectedEvidence} className={`v3-evidence-detail ${selectedAnswer && claimEvidenceIds.includes(`evidence:${selectedEvidence}`) ? "is-claim-linked" : ""}`} data-evidence-id={selectedEvidence}>
      <header className="v3-evidence-detail-heading">
        <span>01 · CLAIM / QUESTION</span>
        <h3>{evidenceQuestions[selectedEvidence]}</h3>
        <p>{evidenceLabels[selectedEvidence]}</p>
      </header>

      {renderProtocol()}

      <section className="v3-evidence-chain-step is-evidence" aria-labelledby="v3-evidence-observation-title">
        <span className="v3-evidence-step-label">03 · EVIDENCE</span>
        <h4 id="v3-evidence-observation-title">{selectedEvidence === "table_1" ? "原表报告" : selectedEvidence === "table_2" ? "按研究问题查看 Table 2" : "原论文图与读图信息"}</h4>
        {selectedEvidence === "table_1" ? <p className="v3-evidence-source-link"><a href={arxivPaperRecord()} target="_blank" rel="noreferrer">打开 arXiv 论文记录 · Table 1 位于第 7 页 ↗</a></p> : null}
        {renderEvidence()}
        <div className="v3-evidence-observation"><strong>测量内容</strong><p>{card.measures}</p><strong>观察结果</strong><p>{card.supports}</p></div>
      </section>

      <section className="v3-evidence-chain-step is-interpretation" aria-labelledby="v3-evidence-interpretation-title">
        <span className="v3-evidence-step-label">04 · INTERPRETATION</span>
        <h4 id="v3-evidence-interpretation-title">{interpretation.kind === "AUTHOR INTERPRETATION" ? "作者解读" : "读表提示"}</h4>
        <p>{interpretation.text}</p>
      </section>

      <section className="v3-evidence-chain-step is-boundary" aria-labelledby="v3-evidence-boundary-title">
        <span className="v3-evidence-step-label">05 · BOUNDARY</span>
        <h4 id="v3-evidence-boundary-title">这组结果不能单独证明什么？</h4>
        <p>{card.doesNotEstablish}</p>
      </section>

      <button className="v3-evidence-reference-link" type="button" onClick={() => openEvidenceReference(card.id)}>Reference Hub · 打开规范证据条目 ↗</button>
    </article>

      </div>
    </section>
    <section className="v3-evidence-block v3-verdict-explorer" aria-labelledby="v3-verdict-title">
      <div className="v3-evidence-block-heading"><span>06C · EVIDENCE VERDICT</span><h3 id="v3-verdict-title">哪些结论有证据支持？</h3><p>判断结论是否超出对应实验；“Unsupported”表示论文没有直接检验该主张。</p></div>
      <div className="v3-verdict-layout">
        <div className="v3-verdict-claim-list" role="tablist" aria-label="待判断主张">
          {verdictClaimIds.map((id, index) => <button key={id} type="button" role="tab" aria-selected={selectedClaimId === id} onClick={() => setSelectedClaimId(id)}>
            <span>CLAIM 0{index + 1}</span><strong>{claimLabel(id)}</strong>
          </button>)}
        </div>
        <article className="v3-verdict-card" data-claim-id={selectedClaimId}>
          <span className="v3-evidence-step-label">YOUR VERDICT</span>
          <h4>{selectedClaim ? verdictQuestions[selectedClaim.id as (typeof verdictClaimIds)[number]] : ""}</h4>
          <div className="v3-verdict-options" role="group" aria-label="选择主张判断">
            {verdictOptions.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = selectedClaim && option.id === expectedVerdict(selectedClaim);
              return <button key={option.id} type="button" aria-pressed={isSelected} className={isSelected ? (isCorrect ? "is-correct" : "is-incorrect") : ""} onClick={() => setAnswers((current) => ({ ...current, [selectedClaimId]: option.id }))}>{option.label}</button>;
            })}
          </div>
          {selectedClaim && selectedAnswer ? <div className={`v3-verdict-feedback ${selectedAnswer === expectedVerdict(selectedClaim) ? "is-correct" : "is-incorrect"}`} role="status">
            <strong>{selectedAnswer === expectedVerdict(selectedClaim) ? "判断符合证据" : `论文证据分类：${expectedVerdict(selectedClaim)}`}</strong>
            <p>{selectedClaim.summary}</p>
            {claimEvidenceIds.length ? <div className="v3-verdict-evidence-links"><span>回看相关材料</span>{claimEvidenceIds.map((id) => {
              const relatedCard = knowledgeById.get(id);
              const label = relatedCard?.kind === "evidence" ? evidenceLabels[id.replace("evidence:", "") as LwfEvidenceId] ?? relatedCard.title : relatedCard?.title ?? id;
              return <button key={id} type="button" onClick={() => openEvidenceReference(id)}>{label} ↗</button>;
            })}</div> : null}
          </div> : null}
        </article>
      </div>
    </section>
  </>;
}
