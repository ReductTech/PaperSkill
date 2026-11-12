import { Children, isValidElement, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { playFeedback } from '../lib/controlMotion';

export function SlidingChoices({ selected, className, label, children }: {
  selected: string | number | boolean;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const previous = useRef(selected);
  const flight = useRef<Animation>();
  const optionKeys = Children.toArray(children).map(child => isValidElement(child) ? child.key : '').join('|');
  useLayoutEffect(() => {
    const group = row.current!;
    const pill = marker.current!;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>(':scope > button'));
    const active = buttons.find(b => b.matches('[aria-checked="true"],[aria-pressed="true"]'));
    if (!active) { pill.hidden = true; return; }
    for (const button of buttons) button.tabIndex = button === active ? 0 : -1;
    const place = (animate: boolean) => {
      const left = active.offsetLeft, top = active.offsetTop;
      const width = active.offsetWidth, height = active.offsetHeight;
      if (width === 0 || height === 0) return;
      // ResizeObserver also fires after mount; don't cancel a flight when the
      // layout still matches the destination.
      const target = [left, top, width, height].join(',');
      if (target === pill.dataset.position) return;
      const from = pill.getBoundingClientRect();
      flight.current?.cancel();
      pill.hidden = false;
      pill.dataset.position = target;
      pill.style.left = left + 'px';
      pill.style.top = top + 'px';
      pill.style.width = width + 'px';
      pill.style.height = height + 'px';
      pill.style.borderRadius = getComputedStyle(active).borderRadius;
      if (animate && from.width && from.height) {
        const to = pill.getBoundingClientRect();
        flight.current = playFeedback(pill, [
          { transform: 'translate(' + (from.left-to.left) + 'px,' + (from.top-to.top) + 'px) scale(' + from.width/to.width + ',' + from.height/to.height + ')' },
          { transform: 'none' },
        ], 290);
      }
    };
    place(previous.current !== selected);
    previous.current = selected;
    const obs = new ResizeObserver(() => place(false));
    obs.observe(group);
    for (const button of buttons) obs.observe(button);
    return () => obs.disconnect();
  }, [selected, optionKeys]);
  useLayoutEffect(() => () => flight.current?.cancel(), []);
  function move(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(':scope > button:not(:disabled)'));
    const at = buttons.indexOf(event.target as HTMLButtonElement);
    if (at < 0 || event.altKey || event.metaKey || event.ctrlKey) return;
    let next: number;
    switch (event.key) {
      case 'Home': next = 0; break;
      case 'End': next = buttons.length-1; break;
      case 'ArrowRight': case 'ArrowDown': next = (at+1) % buttons.length; break;
      case 'ArrowLeft': case 'ArrowUp': next = (at+buttons.length-1) % buttons.length; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    buttons[next].focus({preventScroll:true});
    buttons[next].click();
  }
  return <div className={className+' fv-segments'} ref={row} role={label ? 'group' : undefined} aria-label={label} onKeyDown={move}>
    <span className="fv-selection-marker" aria-hidden="true" ref={marker}/>
    {children}
  </div>;
}
