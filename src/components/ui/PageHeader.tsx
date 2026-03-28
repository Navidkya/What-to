interface PageHeaderProps {
  label: string
  title: string
  subtitle?: string
  onBack?: () => void
}

export default function PageHeader({ label, title, subtitle, onBack }: PageHeaderProps) {
  return (
    <div className="page-header">
      {onBack && (
        <button className="page-header-back" onClick={onBack}>
          ←
        </button>
      )}
      <div className="page-header-text">
        <span className="page-header-label">{label}</span>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}
