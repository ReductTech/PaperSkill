import type { ReactNode } from 'react';
import type { IconName } from '../types';

function iconBody(name: IconName): ReactNode {
  switch (name) {
    case 'scan-text':
      return <><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4M16 21h4a1 1 0 0 0 1-1v-4"/><path d="M8 9h8M8 12h8M8 15h5"/></>;
    case 'eye-check':
      return <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/><path d="m15.5 16.5 1.8 1.8 3.7-4"/></>;
    case 'split-panels':
      return <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M7 9h2M15 9h2M6 14h4M14 14h4"/></>;
    case 'layers':
      return <><path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>;
    case 'merge':
      return <><path d="M4 4v3c0 3 2 5 5 5h6M4 20v-3c0-3 2-5 5-5M15 7l5 5-5 5"/><circle cx="4" cy="4" r="1"/><circle cx="4" cy="20" r="1"/></>;
    case 'scan-search':
      return <><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M8 21H4a1 1 0 0 1-1-1v-4"/><rect x="7" y="8" width="8" height="7" rx="1"/><circle cx="17" cy="17" r="3"/><path d="m19.2 19.2 2 2"/></>;
    case 'text-line':
      return <><path d="M4 6h16M8 6v12M5 18h6M14 10h6M14 14h6M14 18h4"/></>;
    case 'signals':
      return <><rect x="5" y="13" width="14" height="8" rx="2"/><path d="M8 3v6m0 0L5.5 6.5M8 9l2.5-2.5M16 3v6m0 0-2.5-2.5M16 9l2.5-2.5"/></>;
    case 'boxes':
      return <><rect x="3" y="10" width="5" height="10" rx="1"/><rect x="9.5" y="6" width="5" height="14" rx="1"/><rect x="16" y="3" width="5" height="17" rx="1"/></>;
    case 'chart':
      return <><path d="M4 3v17h17"/><path d="m7 15 4-4 3 2 5-7"/><circle cx="7" cy="15" r="1"/><circle cx="11" cy="11" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="19" cy="6" r="1"/></>;
    case 'image':
      return <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>;
    case 'workflow':
      return <><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 12h3M14 12h3"/></>;
    case 'file-check':
    case 'evidence':
      return <><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M8.5 14l2 2 4.5-5"/></>;
    case 'target':
      return <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></>;
    case 'alert':
      return <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5h.01"/></>;
    case 'grid':
      return <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>;
    case 'channels':
      return <><rect x="4" y="5" width="16" height="3" rx="1"/><rect x="6" y="11" width="14" height="3" rx="1"/><rect x="8" y="17" width="12" height="3" rx="1"/></>;
    case 'return':
      return <><path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6v1"/></>;
    case 'scale':
      return <><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7ZM8 21h8"/></>;
    case 'arrow-right':
      return <><path d="M5 12h14M14 7l5 5-5 5"/></>;
    case 'chevron-left':
      return <path d="m15 18-6-6 6-6"/>;
    case 'chevron-right':
      return <path d="m9 18 6-6-6-6"/>;
    case 'rotate':
      return <><path d="M4 7v5h5"/><path d="M5.5 16a8 8 0 1 0 .5-9L4 10"/></>;
  }
}

export function LineIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`line-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconBody(name)}
    </svg>
  );
}
