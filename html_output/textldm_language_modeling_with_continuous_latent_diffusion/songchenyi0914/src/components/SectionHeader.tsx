import type { ReactNode } from 'react'

type SectionHeaderProps = {
  index: string
  eyebrow: string
  title: string
  description?: ReactNode
}

export function SectionHeader({ index, eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="section-heading">
      <div className="section-heading__index">{index}</div>
      <div className="section-heading__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <div className="section-heading__description">{description}</div> : null}
      </div>
    </header>
  )
}
