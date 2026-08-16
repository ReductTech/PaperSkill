import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { FormulaDef } from '../types';
import { MathFormulaStatic, preloadMathlive } from '../shared/react/learning/MathFormulaBlock';

const LATEX_SYMBOLS: Record<string, string> = {
  N_visual: 'N_{\\mathrm{visual}}',
  N_frame: 'N_{\\mathrm{frame}}',
  'N_token/frame': 'N_{\\mathrm{token/frame}}',
  R: 'R',
  I_current: 'I_{\\mathrm{current}}',
  I_pred: '\\hat{I}_{\\mathrm{pred}}',
  p_speak: 'p_{\\mathrm{speak}}',
  h_t: 'h_t',
  'τ': '\\tau',
  g_t: 'g_t',
  w_g: 'w_{g_t}',
  M_per: 'M_{\\mathrm{per}}',
};

const DATA_SYMBOLS: Record<string, string> = {
  N_token_frame: 'N_token/frame',
  tau: 'τ',
};

type MathElementInfo = {
  bounds?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  data?: Record<string, string | undefined>;
};

type InteractiveMathField = HTMLElement & {
  value: string;
  getElementInfo: (offset: number) => MathElementInfo | undefined;
};

type SymbolRegion = {
  symbol: string;
  bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  area: number;
};

type HoveredSymbol = {
  symbol: string;
  left: number;
  top: number;
};

const symbolLatex = (symbol: string) => LATEX_SYMBOLS[symbol] ?? symbol;
const stripHtml = (html: string) => html.replace(/<br\s*\/?\s*>/gi, '；').replace(/<[^>]+>/g, '');

export function Formula({ formula }: { formula: FormulaDef }) {
  const tooltipId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<SymbolRegion[]>([]);
  const [hovered, setHovered] = useState<HoveredSymbol | null>(null);

  const symbolDefinition = hovered
    ? formula.symbols.find((symbol) => symbol.sym === hovered.symbol)
    : undefined;

  const accessibleLabel = `${stripHtml(formula.unicode)}。${formula.symbols
    .map((symbol) => `${symbol.sym}：${stripHtml(symbol.desc)}`)
    .join('；')}`;

  const clearHoveredSymbol = () => setHovered(null);

  const refreshSymbolRegions = useCallback(() => {
    const shell = shellRef.current;
    const field = shellRef.current?.querySelector('math-field') as InteractiveMathField | null;
    if (!shell || !field?.getElementInfo) {
      regionsRef.current = [];
      return;
    }

    const shellBounds = shell.getBoundingClientRect();
    const regions: SymbolRegion[] = [];
    for (let offset = 0; offset <= field.value.length; offset += 1) {
      const info = field.getElementInfo(offset);
      const dataKey = info?.data?.sym;
      const rawBounds = info?.bounds;
      if (!dataKey || !rawBounds) continue;

      const bounds = {
        left: Math.min(rawBounds.left, rawBounds.right) - shellBounds.left,
        right: Math.max(rawBounds.left, rawBounds.right) - shellBounds.left,
        top: Math.min(rawBounds.top, rawBounds.bottom) - shellBounds.top,
        bottom: Math.max(rawBounds.top, rawBounds.bottom) - shellBounds.top,
      };
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      if (width <= 0 || height <= 0) continue;

      const symbol = DATA_SYMBOLS[dataKey] ?? dataKey;
      if (!formula.symbols.some((item) => item.sym === symbol)) continue;

      const duplicate = regions.some(
        (region) =>
          region.symbol === symbol &&
          region.bounds.left === bounds.left &&
          region.bounds.top === bounds.top &&
          region.bounds.right === bounds.right &&
          region.bounds.bottom === bounds.bottom,
      );
      if (!duplicate) regions.push({ symbol, bounds, area: width * height });
    }
    regionsRef.current = regions;
  }, [formula.symbols]);

  useEffect(() => {
    let active = true;
    let frame = 0;
    const shell = shellRef.current;

    regionsRef.current = [];
    preloadMathlive()
      .then(() => {
        if (!active) return;
        frame = window.requestAnimationFrame(refreshSymbolRegions);
      })
      .catch(() => undefined);

    const resizeObserver = shell && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          regionsRef.current = [];
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(refreshSymbolRegions);
        })
      : null;
    if (shell && resizeObserver) resizeObserver.observe(shell);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
    };
  }, [formula.interactiveLatex, refreshSymbolRegions]);

  const inspectSymbol = (event: ReactMouseEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    if (!shell) {
      clearHoveredSymbol();
      return;
    }

    const shellBounds = shell.getBoundingClientRect();
    const localX = event.clientX - shellBounds.left;
    const localY = event.clientY - shellBounds.top;
    const directTarget = event.nativeEvent.composedPath().find(
      (candidate): candidate is Element =>
        candidate instanceof Element && candidate.hasAttribute('data-sym'),
    );
    const directDataKey = directTarget?.getAttribute('data-sym');
    const directSymbol = directDataKey ? (DATA_SYMBOLS[directDataKey] ?? directDataKey) : undefined;
    let region: SymbolRegion | undefined;

    if (directTarget && directSymbol && formula.symbols.some((item) => item.sym === directSymbol)) {
      const directBounds = directTarget.getBoundingClientRect();
      const bounds = {
        left: directBounds.left - shellBounds.left,
        right: directBounds.right - shellBounds.left,
        top: directBounds.top - shellBounds.top,
        bottom: directBounds.bottom - shellBounds.top,
      };
      region = {
        symbol: directSymbol,
        bounds,
        area: Math.max(1, directBounds.width * directBounds.height),
      };
    } else {
      if (regionsRef.current.length === 0) refreshSymbolRegions();
      for (const candidate of regionsRef.current) {
        const hitPadding = 4;
        const containsPoint =
          localX >= candidate.bounds.left - hitPadding &&
          localX <= candidate.bounds.right + hitPadding &&
          localY >= candidate.bounds.top - hitPadding &&
          localY <= candidate.bounds.bottom + hitPadding;
        if (containsPoint && (!region || candidate.area < region.area)) region = candidate;
      }
    }

    if (!region) {
      clearHoveredSymbol();
      return;
    }

    const naturalLeft = (region.bounds.left + region.bounds.right) / 2;
    const tooltipHalfWidth = Math.min(160, Math.max(0, (shellBounds.width - 16) / 2));
    const minimumLeft = tooltipHalfWidth + 8;
    const maximumLeft = Math.max(minimumLeft, shellBounds.width - tooltipHalfWidth - 8);
    const left = Math.min(
      maximumLeft,
      Math.max(minimumLeft, naturalLeft),
    );
    const top = region.bounds.bottom + 10;

    setHovered((current) => {
      if (
        current?.symbol === region.symbol &&
        Math.abs(current.left - left) < 0.5 &&
        Math.abs(current.top - top) < 0.5
      ) {
        return current;
      }
      return { symbol: region.symbol, left, top };
    });
  };

  return (
    <div className="formula-explain">
      <div className="fe-lead" dangerouslySetInnerHTML={{ __html: formula.lead }} />
      <div
        ref={shellRef}
        className="fe-formula-shell"
        tabIndex={0}
        role="math"
        aria-label={accessibleLabel}
        aria-describedby={symbolDefinition ? tooltipId : undefined}
        onMouseEnter={() => {
          if (regionsRef.current.length === 0) refreshSymbolRegions();
        }}
        onMouseMove={inspectSymbol}
        onMouseLeave={() => {
          clearHoveredSymbol();
        }}
        onBlur={clearHoveredSymbol}
      >
        <div className="fe-formula" aria-hidden="true">
          <MathFormulaStatic latex={formula.interactiveLatex} />
        </div>
        {hovered && symbolDefinition ? (
          <div
            className="fe-formula-tooltip"
            id={tooltipId}
            role="tooltip"
            style={{ left: hovered.left, top: hovered.top }}
          >
            <div className="fe-formula-tooltip-row">
              <MathFormulaStatic latex={symbolLatex(symbolDefinition.sym)} aria-hidden="true" />
              <span>{stripHtml(symbolDefinition.desc)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
