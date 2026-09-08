export function isPresentationMode() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.dataset.presentationMode === 'true'
  );
}
