import { memo, useMemo } from 'react';
import katex from 'katex';
import type { SymbolDef } from '../types';
import 'katex/dist/katex.min.css';

type LatexProps = {
  tex: string;
  display?: boolean;
  symbols?: Record<string, SymbolDef>;
};

/** The source and definitions are part of the tutorial, never learner input. */
export const Latex = memo(function Latex({ tex, display = false, symbols }: LatexProps) {
  const html = useMemo(() => {
    let order = 0;
    const source = symbols ? tex.replace(/\\sym\{([a-zA-Z]+)\}/g, (_, key: string) => {
      const symbol = symbols[key];
      if (!symbol) throw new Error('Unknown tutorial formula symbol: ' + key);
      return '\\htmlData{symbol=' + key + ',order=' + order++ + '}{' + symbol.tex + '}';
    }) : tex;
    return {
      __html: katex.renderToString(source, {
        displayMode: display,
        output: 'htmlAndMathml',
        throwOnError: true,
        strict: (code) => code === 'htmlExtension' ? 'ignore' : 'warn',
        trust: context => context.command === '\\htmlData' && !!symbols && !!symbols[context.attributes['data-symbol']],
      }),
    };
  }, [tex, display, symbols]);
  return <span className={display ? 'coop-tex-display' : 'coop-tex-inline'} dangerouslySetInnerHTML={html} />;
});
