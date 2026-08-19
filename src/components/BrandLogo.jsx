import logoImg from '../assets/image_2f9bab0c (1).png'

export default function BrandLogo({ className = '' }) {
  const classes = ['brand-logo', className].filter(Boolean).join(' ')

  return (
    <span className={classes} aria-hidden="true">
      <img src={logoImg} alt="PythonOku" />
    </span>
  )
}
