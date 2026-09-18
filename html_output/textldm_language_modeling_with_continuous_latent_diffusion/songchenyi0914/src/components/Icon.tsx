type IconName =
  | 'arrow'
  | 'book'
  | 'check'
  | 'chevron'
  | 'flask'
  | 'flow'
  | 'layers'
  | 'menu'
  | 'orbit'
  | 'pause'
  | 'play'
  | 'shield'
  | 'spark'
  | 'target'
  | 'warning'
  | 'x'

type IconProps = {
  name: IconName
  size?: number
  className?: string
}

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  flask: <><path d="M9 3h6M10 3v6l-5 8.5A2.5 2.5 0 0 0 7.1 21h9.8a2.5 2.5 0 0 0 2.1-3.5L14 9V3" /><path d="M8.5 15h7" /></>,
  flow: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M7 6h10M6.5 7.6l4.4 8.8M17.5 7.6l-4.4 8.8" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  orbit: <><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="4" ry="9" /></>,
  pause: <><path d="M9 5v14M15 5v14" /></>,
  play: <path d="m8 5 11 7-11 7z" />,
  shield: <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" />,
  spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  warning: <><path d="M12 3 2.5 20h19z" /><path d="M12 9v5M12 17.5v.1" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  )
}
