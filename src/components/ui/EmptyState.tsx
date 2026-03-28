import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaAction?: () => void
}

export default function EmptyState({ icon, title, description, ctaLabel, ctaAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {ctaLabel && ctaAction && (
        <button className="empty-state-cta" onClick={ctaAction}>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
