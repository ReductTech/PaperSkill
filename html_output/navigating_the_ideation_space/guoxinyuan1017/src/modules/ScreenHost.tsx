import React, { useEffect, useRef } from 'react';
import { createScope } from '../lib/lifecycle';
import type { Scope } from '../lib/lifecycle';

// Mounts one tutorial screen: the markup is adopted from the prototype as a plain HTML
// fragment, then the screen's own behaviour is attached inside a lifecycle scope.
//
// The fragment is written with `innerHTML` on every mount so React StrictMode's double
// invocation cannot leave two sets of element listeners on the same nodes: the second mount
// replaces the subtree and the first mount's scope is already disposed by then.
export function ScreenHost({
  html,
  mount,
}: {
  html: string;
  mount: (scope: Scope) => void;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = html;
    const scope = createScope();
    mount(scope);
    return () => {
      scope.dispose();
    };
  }, [html, mount]);

  return <div className="paper-stage" ref={host} />;
}
