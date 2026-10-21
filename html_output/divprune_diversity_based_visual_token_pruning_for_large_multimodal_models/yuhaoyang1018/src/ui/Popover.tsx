import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { canHover } from '../lib/hooks';

// 通用弹窗：点按打开 / 点空白关闭 / Esc 关闭（焦点回到触发器）；
// 仅在 (hover:hover) and (pointer:fine) 设备上额外支持悬停打开。
// 位置始终夹在屏幕内（含安全区），内容过长时在弹窗内部滚动。
// 同一时间只允许一个弹窗打开。

let closeCurrent: (() => void) | null = null;

export interface PopoverProps {
  /** 触发器内容 */
  trigger: React.ReactNode;
  triggerClass?: string;
  triggerLabel?: string;
  children: React.ReactNode;
  /** 弹窗标题（用于无障碍名称） */
  title?: string;
  wide?: boolean;
  as?: 'button' | 'span';
}

interface Pos {
  top: number;
  left: number;
  maxH: number;
  side: 'below' | 'above';
  originX: number;
}

const MARGIN = 12;

export function Popover({ trigger, triggerClass, triggerLabel, children, title, wide, as = 'button' }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const trigRef = useRef<HTMLElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const openedByHover = useRef(false);
  const focusOnOpen = useRef(false);
  const id = useId();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (closeCurrent === closeRef.current) closeCurrent = null;
    if (refocus) trigRef.current?.focus();
  }, []);
  const closeRef = useRef<() => void>(() => close());
  closeRef.current = () => close();

  const doOpen = useCallback((byHover: boolean) => {
    if (closeCurrent && closeCurrent !== closeRef.current) closeCurrent();
    closeCurrent = closeRef.current;
    openedByHover.current = byHover;
    setOpen(true);
  }, []);

  const place = useCallback(() => {
    const t = trigRef.current;
    const p = popRef.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const pw = p.offsetWidth;
    const below = vh - r.bottom - MARGIN;
    const above = r.top - MARGIN;
    const natural = p.scrollHeight;
    const side: 'below' | 'above' = below >= Math.min(natural, 220) || below >= above ? 'below' : 'above';
    const avail = Math.max(120, (side === 'below' ? below : above) - 8);
    const h = Math.min(natural, avail);
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(MARGIN, Math.min(left, vw - pw - MARGIN));
    const top = side === 'below' ? r.bottom + 8 : r.top - 8 - h;
    const originX = Math.max(8, Math.min(pw - 8, r.left + r.width / 2 - left));
    setPos({ top: Math.max(MARGIN, top), left, maxH: avail, side, originX });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      popRef.current?.focus({ preventScroll: true });
    }
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const tg = e.target as Node;
      if (popRef.current?.contains(tg) || trigRef.current?.contains(tg)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const t = trigRef.current;
        if (!t) return;
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) close();
        else place();
      });
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, { passive: true, capture: true });
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', onMove);
      cancelAnimationFrame(raf);
    };
  }, [open, close, place]);

  useEffect(() => () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    if (closeCurrent === closeRef.current) closeCurrent = null;
  }, []);

  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !canHover()) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => doOpen(true), open ? 0 : 140);
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !canHover()) return;
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    if (!openedByHover.current) return;
    hoverTimer.current = window.setTimeout(() => close(), 220);
  };
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open && !openedByHover.current) close();
    else {
      // e.detail === 0：由键盘（Enter/空格）触发，打开后把焦点移入弹窗
      focusOnOpen.current = e.detail === 0;
      doOpen(false);
    }
  };
  const onKeyDownTrig = (e: React.KeyboardEvent) => {
    if (as === 'span' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (open) close();
      else {
        focusOnOpen.current = true;
        doOpen(false);
      }
    }
  };

  const trigProps = {
    ref: (el: HTMLElement | null) => {
      trigRef.current = el;
    },
    className: triggerClass,
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    'aria-haspopup': 'dialog' as const,
    'aria-label': triggerLabel,
    onClick,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    onKeyDown: onKeyDownTrig,
  };

  return (
    <>
      {as === 'button' ? (
        <button type="button" {...trigProps}>
          {trigger}
        </button>
      ) : (
        <span role="button" tabIndex={0} {...trigProps}>
          {trigger}
        </span>
      )}
      {open
        ? createPortal(
            <div
              ref={popRef}
              id={id}
              role="dialog"
              tabIndex={-1}
              aria-label={title}
              className={`pop ${wide ? 'pop-wide' : ''} ${pos ? 'is-placed' : ''} ${pos?.side === 'above' ? 'pop-above' : ''}`}
              style={{
                top: pos ? pos.top : -9999,
                left: pos ? pos.left : -9999,
                maxHeight: pos ? pos.maxH : undefined,
                transformOrigin: pos ? `${pos.originX}px ${pos.side === 'below' ? '0' : '100%'}` : undefined,
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse' && hoverTimer.current) window.clearTimeout(hoverTimer.current);
              }}
              onPointerLeave={onLeave}
            >
              {children}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
