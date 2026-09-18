import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import legacyCss from '../styles.css?inline';
import { ParadigmShowcase } from '../components/ParadigmShowcase';
import { TextLDMPipeline } from '../components/TextLDMPipeline';
import { MethodLab } from '../components/MethodLab';
import { ExperimentFlow } from '../components/ExperimentFlow';
import { ExperimentSimulator } from '../components/ExperimentSimulator';
import { DenoisingPlayground } from '../components/DenoisingPlayground';
import { EvidenceMatrix } from '../components/EvidenceMatrix';
import { ResultsLab } from '../components/ResultsLab';

export type LegacyView =
  | 'paradigm'
  | 'pipeline'
  | 'method'
  | 'flow'
  | 'simulator'
  | 'denoising'
  | 'evidence'
  | 'results';

const views = {
  paradigm: ParadigmShowcase,
  pipeline: TextLDMPipeline,
  method: MethodLab,
  flow: ExperimentFlow,
  simulator: ExperimentSimulator,
  denoising: DenoisingPlayground,
  evidence: EvidenceMatrix,
  results: ResultsLab,
} satisfies Record<LegacyView, React.ComponentType>;

// The legacy widgets were designed as a standalone dark research console. Render them
// inside a shadow root so their large global stylesheet cannot alter the standard shell.
const shadowCss = `
${legacyCss.replace(/:root\s*\{/g, ':host {')}
:host {
  display: block;
  width: 100%;
  color: var(--text);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
:host .app-shell { min-height: 0 !important; }
:host .page { margin-left: 0 !important; }
:host .legacy-section {
  min-height: 0 !important;
  padding: clamp(18px, 2.4vw, 32px) !important;
  border: 0 !important;
  background:
    radial-gradient(circle at 88% 0%, rgba(var(--cyan-rgb), 0.10), transparent 24rem),
    linear-gradient(145deg, rgba(7, 16, 23, 0.98), rgba(5, 11, 16, 0.98)) !important;
}
:host .legacy-section > * { margin-top: 0 !important; }
@media (max-width: 760px) {
  :host .legacy-section { padding: 12px !important; }
}
`;

export function LegacyIsland({ view }: { view: LegacyView }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.replaceChildren();

    const style = document.createElement('style');
    style.textContent = shadowCss;

    const mount = document.createElement('div');
    mount.className = 'legacy-root';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    const page = document.createElement('main');
    page.className = 'page';
    const section = document.createElement('section');
    section.className = 'section legacy-section';
    page.appendChild(section);
    shell.appendChild(page);
    mount.appendChild(shell);
    shadow.append(style, mount);

    const View = views[view];
    let root: Root | null = null;
    let observer: ResizeObserver | null = null;

    try {
      root = createRoot(section);
      root.render(<View />);
      observer = new ResizeObserver(() => {
        host.style.minHeight = `${Math.ceil(section.scrollHeight)}px`;
      });
      observer.observe(section);
    } catch (error) {
      section.innerHTML = `<div class="feedback bad">模块加载失败：${String(error)}</div>`;
    }

    return () => {
      observer?.disconnect();
      root?.unmount();
      shadow.replaceChildren();
      host.style.minHeight = '';
    };
  }, [view]);

  return <div ref={hostRef} className="legacy-island" />;
}
