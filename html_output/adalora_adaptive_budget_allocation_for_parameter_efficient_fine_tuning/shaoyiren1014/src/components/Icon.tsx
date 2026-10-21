export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    reset: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,
    arrow: <><path d="M4 12h15M14 6l6 6-6 6"/></>,
    close: <><path d="m6 6 12 12M6 18 18 6"/></>,
    route: <><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v5h14v5"/></>,
    gauge: <><path d="M4 18a9 9 0 1 1 16 0M12 12l5-5"/><circle cx="12" cy="12" r="1.5"/><path d="M5 19h14"/></>,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4"/></>,
    sliders: <><path d="M5 3v18M12 3v18M19 3v18M2 8h6M9 16h6M16 9h6"/></>,
    chart: <><path d="M4 3v17h17M8 15l4-5 4 2 5-7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    journal: <><path d="M6 3h14v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 3v18M12 8h5M12 12h5"/></>,
    sound: <><path d="M4 10h4l5-4v12l-5-4H4v-4ZM17 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/></>,
    motion: <><path d="M3 7h10M3 12h6M3 17h10M15 5l6 7-6 7"/></>,
    pin: <><circle cx="12" cy="10" r="3"/><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.gauge}</svg>;
}
