import React, { useMemo, useState } from 'react';

type CartridgeId = 'sql' | 'summary' | 'classification' | 'domain';
type StoragePlan = 'full' | 'lora';

const cartridges: Array<{ id: CartridgeId; name: string; mode: string; code: string }> = [
  { id: 'sql', name: 'WikiSQL LoRA', mode: 'SQL', code: 'SQL-042' },
  { id: 'summary', name: 'Summarization LoRA', mode: 'SUMMARIZATION', code: 'SUM-118' },
  { id: 'classification', name: 'Classification LoRA', mode: 'CLASSIFICATION', code: 'CLS-207' },
  { id: 'domain', name: 'Custom Domain LoRA', mode: 'CUSTOM DOMAIN', code: 'DOM-∞' },
];

function Cartridge({ item, held, inserted, onPick }: { item: typeof cartridges[number]; held: boolean; inserted: boolean; onPick: () => void }) {
  return (
    <button className={`task-cartridge cartridge-${item.id} ${held ? 'is-held' : ''} ${inserted ? 'is-inserted' : ''}`} onClick={onPick} aria-pressed={held}>
      <span className="cartridge-handle"><i /><i /></span>
      <small>{item.code}</small><strong>{item.name}</strong><em>{inserted ? 'ACTIVE IN ENGINE' : held ? 'IN YOUR HAND' : 'WALL RACK'}</em>
      <div className="cartridge-contacts"><i /><i /><i /><i /><i /></div>
    </button>
  );
}

export function TaskCartridgeVault({ onNext }: { onNext: () => void }) {
  const [held, setHeld] = useState<CartridgeId | null>(null);
  const [inserted, setInserted] = useState<CartridgeId | null>(null);
  const [tried, setTried] = useState<Set<CartridgeId>>(() => new Set());
  const [plan, setPlan] = useState<StoragePlan | null>(null);
  const [limitationOpen, setLimitationOpen] = useState(false);

  const activeCartridge = useMemo(() => cartridges.find((item) => item.id === inserted) ?? null, [inserted]);
  const heldCartridge = useMemo(() => cartridges.find((item) => item.id === held) ?? null, [held]);
  const guideStep = held ? (tried.size === 0 ? 2 : 3) : tried.size === 0 ? 1 : tried.size < 2 ? 3 : plan ? 5 : 4;
  const guidePrompt = held
    ? tried.size === 0
      ? `已拿起 ${heldCartridge?.name}。现在点击中央控制台，把它插入主引擎。`
      : `已拿起第二枚卡匣 ${heldCartridge?.name}。将它插入同一台主引擎，对比 TASK MODE 的变化与 W₀ 的 UNCHANGED 状态。`
    : tried.size === 0
      ? '先从左右墙架选一枚任务卡匣。注意：此时 W₀ 仍显示 UNCHANGED。'
      : tried.size < 2
        ? '第一次切换已完成。再选一枚不同卡匣，验证同一个 W₀ 能否切换到另一种任务模式。'
        : !plan
          ? '已确认主引擎本体不变。现在到仓储区，先选方案 A，再切换方案 B 比较 100 个任务的存储代价。'
          : plan === 'full'
            ? '观察方案 A：每个任务复制整台模型，仓库迅速堆满。现在切换到方案 B。'
            : '对比完成：一个共享基座加多个小型任务更新，让仓储与任务切换都更轻量。';

  const insert = () => {
    if (!held) return;
    setInserted(held);
    setTried((current) => new Set([...current, held]));
    setHeld(null);
  };

  return (
    <section className="cartridge-vault" aria-labelledby="vault-title">
      <header className="vault-header">
        <div><span>ACT 10 · TASK ARCHIVE</span><h1 id="vault-title">TASK CARTRIDGE VAULT</h1></div>
        <div className="vault-ledger"><small>BASE ENGINES</small><b>1</b><small>TASK CARTRIDGES TESTED</small><b>{tried.size} / 4</b></div>
      </header>

      <div className="vault-question"><small>OPERATION 01 · TASK SWITCHING</small><h2>一台主引擎，能否保管很多种任务能力？</h2><p>这一幕把前面的结论变成工程操作：W₀ 始终共享，每个任务只保存它自己的小型低秩更新。</p></div>

      <section className="vault-mission-guide" aria-label="任务卡匣操作引导">
        <header><small>ENGINEER MISSION</small><strong>完成一次任务切换与仓储决策</strong><span>当前步骤 {guideStep} / 5</span></header>
        <ol>
          <li className={guideStep === 1 ? 'is-active' : guideStep > 1 ? 'is-done' : ''}><b>1</b><span>选择一枚卡匣</span></li>
          <li className={guideStep === 2 ? 'is-active' : guideStep > 2 ? 'is-done' : ''}><b>2</b><span>插入主引擎</span></li>
          <li className={guideStep === 3 ? 'is-active' : guideStep > 3 ? 'is-done' : ''}><b>3</b><span>切换第二个任务</span></li>
          <li className={guideStep === 4 ? 'is-active' : guideStep > 4 ? 'is-done' : ''}><b>4</b><span>比较两种仓储方案</span></li>
          <li className={guideStep === 5 ? 'is-active' : ''}><b>5</b><span>归纳工程结论</span></li>
        </ol>
        <p><i />{guidePrompt}</p>
      </section>

      <div className="vault-floor">
        <div className="cartridge-wall wall-left">
          <Cartridge item={cartridges[0]} held={held === 'sql'} inserted={inserted === 'sql'} onPick={() => setHeld('sql')} />
          <Cartridge item={cartridges[1]} held={held === 'summary'} inserted={inserted === 'summary'} onPick={() => setHeld('summary')} />
        </div>

        <div className="base-engine-station">
          <div className="vault-engine">
            <div className="vault-engine-crown"><small>SHARED WEIGHT ASSEMBLY</small><strong>BASE MODEL ENGINE</strong></div>
            <div className="vault-engine-gears"><i /><i /><i /><div><span>W₀</span><b>UNCHANGED</b></div></div>
            <div className="task-mode"><small>TASK MODE</small><strong>{activeCartridge?.mode ?? 'STANDBY'}</strong></div>
            <div className={`cartridge-slot ${held ? 'is-ready' : ''} ${inserted ? 'is-loaded' : ''}`}><span>{inserted ? activeCartridge?.code : 'EMPTY SLOT'}</span><i /><i /><i /><i /><i /></div>
          </div>
          <div className="insertion-console">
            <div><small>IN HAND</small><strong>{heldCartridge?.name ?? '—'}</strong></div>
            <button disabled={!held} onClick={insert}>{held ? `插入 ${heldCartridge?.code}` : '先拿起一个卡匣'}</button>
          </div>
          <p className="engine-invariance"><i />引擎 W₀ 的机械结构始终不变；变化的是插槽中的任务更新与任务状态。</p>
        </div>

        <div className="cartridge-wall wall-right">
          <Cartridge item={cartridges[2]} held={held === 'classification'} inserted={inserted === 'classification'} onPick={() => setHeld('classification')} />
          <Cartridge item={cartridges[3]} held={held === 'domain'} inserted={inserted === 'domain'} onPick={() => setHeld('domain')} />
        </div>
      </div>

      <div className="vault-motto"><span>一个大机器。</span><i /><strong>很多微小的匣子。</strong></div>

      <section className={`storage-gallery ${tried.size < 2 ? 'is-locked' : ''}`} aria-labelledby="storage-title">
        <header><div><small>OPERATION 02 · STORAGE COMPARISON</small><h2 id="storage-title">100 个任务，要占满多少仓库？</h2></div><span>{tried.size < 2 ? `再切换 ${2 - tried.size} 个任务后解锁` : 'COMPARISON UNLOCKED'}</span></header>
        {tried.size < 2 ? <div className="storage-lock"><i /><b>先确认同一台引擎可以切换不同任务</b></div> : (
          <>
            <div className="storage-plan-switch">
              <button className={plan === 'full' ? 'active' : ''} onClick={() => setPlan('full')}><small>方案 A</small>100 × FULL FINE-TUNED MODELS</button>
              <button className={plan === 'lora' ? 'active' : ''} onClick={() => setPlan('lora')}><small>方案 B</small>1 × BASE MODEL + 100 × SMALL LoRA MODULES</button>
            </div>
            <div className={`warehouse-visual plan-${plan ?? 'none'}`}>
              {!plan ? <div className="warehouse-await"><b>?</b><span>选择一个仓储方案</span></div> : null}
              {plan === 'full' ? <><div className="full-model-stack">{Array.from({ length: 30 }, (_, index) => <i key={index}><span>175B</span></i>)}</div><div className="capacity-readout danger"><small>WAREHOUSE CAPACITY</small><b>FULL</b><em>每个任务都复制整台机器</em></div></> : null}
              {plan === 'lora' ? <><div className="lora-storage"><div className="stored-base"><i /><b>W₀</b><span>× 1</span></div><div className="module-drawers">{Array.from({ length: 100 }, (_, index) => <i key={index} />)}</div></div><div className="capacity-readout safe"><small>WAREHOUSE CAPACITY</small><b>MOSTLY EMPTY</b><em>共享基座，只保存微小任务更新</em></div></> : null}
            </div>
            {plan ? <div className="gpt-scale-note"><small>GPT-3 量级参照 · 不必背数字</small><p>论文示例中，Full FT 需要处理约 <b>175,255.8M</b> 个可训练参数；LoRA 配置约为 <b>4.7M / 37.7M</b>。这里只帮助理解数量级，不把参数量直接等同于文件字节数。</p></div> : null}
          </>
        )}
      </section>

      <button className={`limitation-tab ${limitationOpen ? 'is-open' : ''}`} onClick={() => setLimitationOpen((open) => !open)} aria-expanded={limitationOpen}><span>ENGINEERING<br />LIMITATION</span><b>{limitationOpen ? '×' : '!'}</b></button>
      <aside className={`limitation-drawer ${limitationOpen ? 'is-open' : ''}`} aria-hidden={!limitationOpen}>
        <header><small>DEPLOYMENT BOUNDARY</small><h2>合并很快，但混用不总是方便</h2><button onClick={() => setLimitationOpen(false)} aria-label="关闭 Engineering Limitation">×</button></header>
        <div className="batch-diagram"><div><span>SAMPLE A</span><b>SQL</b></div><div><span>SAMPLE B</span><b>SUMMARY</b></div><i>ONE MERGED W</i></div>
        <p>如果已经把某个 LoRA 合并进 W，那么同一 batch 内让不同样本分别使用不同任务 LoRA，并不是最方便的场景。</p>
        <p>工程上可以保留未合并分支、分组 batch，或按任务切换/重新合并；这些选择会重新引入调度或计算权衡。</p>
      </aside>

      {plan === 'lora' ? <div className="vault-exit"><div><small>ARCHIVE PRINCIPLE CONFIRMED</small><strong>共享重量级基座，按任务保存轻量更新。</strong><p>从全量微调危机到任务卡匣，所有证据已经收集完成。最后请你自己重建整条 LoRA 推理链。</p></div><button onClick={onNext}>带着证据进入 Final Review →</button></div> : null}
    </section>
  );
}
