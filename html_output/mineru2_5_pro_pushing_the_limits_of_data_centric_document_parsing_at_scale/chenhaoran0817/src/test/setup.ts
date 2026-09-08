import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  unobserve = vi.fn();

  trigger(entries: IntersectionObserverEntry[] = []) {
    this.callback(entries, this);
  }
}

class MockResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();

  trigger(entries: ResizeObserverEntry[] = []) {
    this.callback(entries, this);
  }
}

Object.assign(window, {
  IntersectionObserver: MockIntersectionObserver,
  ResizeObserver: MockResizeObserver,
  requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
    callback(performance.now());
    return 1;
  }),
});

Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(document, 'fonts', {
  configurable: true,
  value: { ready: Promise.resolve() },
});
