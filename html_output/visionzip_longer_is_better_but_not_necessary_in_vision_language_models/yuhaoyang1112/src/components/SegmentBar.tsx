import { useLayoutEffect, useRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { animateUI } from './motion';

type Props = HTMLAttributes<HTMLDivElement> & { value: string | number | boolean | null };

export function SegmentBar({ value, children, className = '', ...rest }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const active = useRef<Animation>();
  const previous = useRef('');

  useLayoutEffect(() => {
    const root = host.current!, pill = marker.current!;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>(':scope > button'));
    const selected = buttons.find(b => b.getAttribute('aria-pressed') === 'true');
    for (const button of buttons) button.tabIndex = button === (selected ?? buttons[0]) ? 0 : -1;
    if (!selected) {
      active.current?.cancel();
      previous.current = '';
      pill.hidden = true;
      return;
    }
    const place = (animate: boolean) => {
      const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = selected;
      if (!w || !h) return;
      const key = [x, y, w, h].join('/');
      if (previous.current === key) return;
      const before = previous.current ? pill.getBoundingClientRect() : null;
      active.current?.cancel();
      pill.hidden = false;
      Object.assign(pill.style, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
      previous.current = key;
      if (animate && before) {
        const after = pill.getBoundingClientRect();
        active.current = animateUI(pill, [
          { transform: 'translate('+ (before.left - after.left) +'px,'+ (before.top - after.top) +'px) scale('+ before.width / w +','+ before.height / h +')' },
          { transform: 'none' },
        ], 300);
      }
    };
    place(true);
    const observer = new ResizeObserver(() => place(false));
    observer.observe(root);
    buttons.forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [value]);

  useLayoutEffect(() => () => active.current?.cancel(), []);
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(':scope > button:not(:disabled)'));
    const i = buttons.indexOf(event.target as HTMLButtonElement);
    if (i < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const keys: Record<string, number> = {
      ArrowLeft: (i + buttons.length - 1) % buttons.length, ArrowRight: (i + 1) % buttons.length,
      ArrowUp: (i + buttons.length - 1) % buttons.length, ArrowDown: (i + 1) % buttons.length,
      Home: 0, End: buttons.length - 1,
    };
    const index = keys[event.key];
    if (index === undefined) return;
    event.preventDefault();
    buttons[index].focus({ preventScroll: true });
    buttons[index].click();
  }
  return <div {...rest} className={className + ' vz-segment'} ref={host} onKeyDown={navigate}>
    <span ref={marker} className="vz-segment-marker" aria-hidden="true" hidden />{children}
  </div>;
}
