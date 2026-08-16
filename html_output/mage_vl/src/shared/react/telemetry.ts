export interface TelemetryStateEntry<T = unknown> {
  event_name: string;
  state: T;
  updated_at: number;
}

export interface TelemetryModuleState {
  ok: boolean;
  module_id: string;
  completed: boolean;
  states: Record<string, TelemetryStateEntry>;
}

interface TelemetryApi {
  emit?: (eventName: string, element: Element | null, properties?: Record<string, unknown>) => void;
  getModuleState?: (moduleId?: string) => Promise<TelemetryModuleState>;
}

declare global {
  interface Window {
    __DL_TELEMETRY__?: TelemetryApi;
  }
}

export function currentModuleId() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  return decodeURIComponent(segments[0] === 'modules' && segments[1] ? segments[1] : segments[0] || 'root');
}

export function emitTelemetry(eventName: string, element: Element | null, properties: Record<string, unknown>) {
  window.__DL_TELEMETRY__?.emit?.(eventName, element, properties);
}

export async function getTelemetryState<T>(stateKey: string, moduleId = currentModuleId()): Promise<TelemetryStateEntry<T> | null> {
  try {
    const document = await window.__DL_TELEMETRY__?.getModuleState?.(moduleId);
    return (document?.states?.[stateKey] as TelemetryStateEntry<T> | undefined) ?? null;
  } catch {
    return null;
  }
}
