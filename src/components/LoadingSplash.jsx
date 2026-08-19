import BrandLogo from './BrandLogo'

export default function LoadingSplash() {
  return (
    <main className="loading-splash" aria-label="Загрузка PythonOku">
      <div className="loading-splash-content">
        <BrandLogo className="loading-splash-logo" />
        <div className="loading-splash-title">PythonOku</div>
        <p>Python проще, когда путь виден.</p>
        <div className="loading-splash-status"><span /> Загрузка...</div>
      </div>
    </main>
  )
}