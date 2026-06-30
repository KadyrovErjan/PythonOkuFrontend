export default function BrandLogo({ className = '' }) {
  const classes = ['brand-mark', 'brand-logo', className].filter(Boolean).join(' ')

  return (
    <span className={classes} aria-hidden="true">
      <img src="/logo.svg" alt="" />
    </span>
  )
}