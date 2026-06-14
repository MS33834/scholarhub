interface PrintHeaderProps {
  title: string
  subtitle?: string
}

export function PrintHeader({ title, subtitle }: PrintHeaderProps) {
  return (
    <div className="print-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
