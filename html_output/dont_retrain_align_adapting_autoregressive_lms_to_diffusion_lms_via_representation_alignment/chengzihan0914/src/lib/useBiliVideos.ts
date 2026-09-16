import { useEffect } from 'react';

// Bilibili metadata loader (optional). Fetches cover/title/
// duration/views at runtime via JSONP. Degrades gracefully: empty bvid => hide card;
// failed fetch => "视频暂不可用" fallback (never stuck on a loading state).
// UI strings stay in Simplified Chinese (this is webpage output, not a skill doc).

export interface BiliCard {
  bvid: string;
  title?: string;
  cover?: string;
  duration?: string;
  views?: string;
}

function formatViews(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿播放';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万播放';
  return n + '播放';
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

let jsonpRequestSerial = 0;

type JsonpCallback = (response: unknown) => void;

interface PendingJsonpRequest {
  callbackName: string;
  script: HTMLScriptElement;
  settled: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Fetch metadata for each bvid and call `onLoad(bvid, data)` per card.
 * Best-effort: network/Api failures are swallowed and reported as null.
 */
export function useBiliVideos(
  bvids: string[],
  onLoad: (bvid: string, data: BiliCard | null) => void
) {
  const bvidKey = Array.from(
    new Set(bvids.filter((bvid) => bvid && bvid.startsWith('BV')))
  ).join('|');

  useEffect(() => {
    let cancelled = false;
    const real = bvidKey ? bvidKey.split('|') : [];
    if (real.length === 0) return;

    const callbackHost = window as unknown as Record<string, JsonpCallback | undefined>;
    const pending: PendingJsonpRequest[] = [];

    real.forEach((bvid) => {
      const callbackName = `__paper_skill_bili_${Date.now()}_${++jsonpRequestSerial}`;
      const script = document.createElement('script');
      const request: PendingJsonpRequest = { callbackName, script, settled: false };
      const dispose = () => {
        request.settled = true;
        delete callbackHost[callbackName];
        script.remove();
      };

      callbackHost[callbackName] = (res: unknown) => {
        if (cancelled) return;
        dispose();
        if (!isRecord(res) || res.code !== 0 || !isRecord(res.data)) {
          onLoad(bvid, null);
          return;
        }
        const d = res.data;
        const stat = isRecord(d.stat) ? d.stat : null;
        onLoad(bvid, {
          bvid,
          title: typeof d.title === 'string' ? d.title : undefined,
          cover: typeof d.pic === 'string' ? d.pic.replace(/^http:/, 'https:') : undefined,
          duration: typeof d.duration === 'number' && d.duration >= 0
            ? formatDuration(Math.floor(d.duration))
            : undefined,
          views: stat && typeof stat.view === 'number' && stat.view >= 0
            ? formatViews(Math.floor(stat.view))
            : undefined,
        });
      };
      script.src =
        'https://api.bilibili.com/x/web-interface/view?bvid=' +
        encodeURIComponent(bvid) +
        '&jsonp=jsonp&callback=' +
        encodeURIComponent(callbackName);
      script.async = true;
      script.onerror = () => {
        if (cancelled) return;
        dispose();
        onLoad(bvid, null);
      };
      pending.push(request);
      document.body.appendChild(script);
    });

    return () => {
      cancelled = true;
      pending.filter((request) => !request.settled).forEach(({ callbackName, script }) => {
        // A fetched JSONP script may already be queued for execution. Keep a
        // temporary no-op callback so late responses cannot raise ReferenceError.
        callbackHost[callbackName] = () => undefined;
        script.remove();
        window.setTimeout(() => {
          delete callbackHost[callbackName];
        }, 60_000);
      });
    };
  }, [bvidKey, onLoad]);
}
