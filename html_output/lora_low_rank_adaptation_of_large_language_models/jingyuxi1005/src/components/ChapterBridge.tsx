// Chapter bridge ("本节作用") — the one-line role statement above each chapter body.
// Chapter text is static project content in tutorial.ts, not user input.
export function ChapterBridge({ text, href }: { text: string; href: string }) {
  return (
    <div className="chap-bridge">
      <a className="cb-icon" href={href} aria-label="本章链接" title="本章链接">🔗</a>
      <div className="cb-body">
        <div className="cb-title">本节作用</div>
        <div className="cb-text" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </div>
  );
}
