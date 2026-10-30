type BrandProps = { light?: boolean; compact?: boolean; className?: string };

export function Brand({ light = false, compact = false, className = "" }: BrandProps) {
  return (
    <span className={`brand-lockup ${light ? "brand-light" : ""} ${compact ? "brand-compact" : ""} ${className}`} dir="ltr">
      <svg className="brand-mark" viewBox="0 0 44 44" role="img" aria-label="رمز أجاري">
        <path d="M8.4 34.8 18.1 11c1.4-3.5 6.4-3.5 7.9 0l9.6 23.8c.8 2-.7 4.2-2.8 4.2h-4.6c-1.2 0-2.3-.7-2.8-1.9l-2.8-7h-9.1l-2.7 7c-.5 1.2-1.6 1.9-2.9 1.9H8.1c-2.1 0-3.6-2.2-2.8-4.2Z" fill="currentColor" transform="translate(0 -2)" />
        <path d="M19.1 22.3h8.3l4.2 6.5H15.2z" fill="var(--brand-cutout, #f7f5ef)" />
      </svg>
      {!compact && (
        <span className="brand-copy">
          <strong>AGARLY</strong>
          <small>RENT WHAT YOU NEED</small>
        </span>
      )}
    </span>
  );
}
