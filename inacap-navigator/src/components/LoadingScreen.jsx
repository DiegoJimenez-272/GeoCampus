import { useEffect, useRef, useState } from 'react'
import useAppStore from '../store/useAppStore'

export default function LoadingScreen() {
  const { phase, loadingProgress } = useAppStore()
  const [visible, setVisible] = useState(true)

  const tips = [
    'Cargando geometría del edificio...',
    'Inicializando malla de navegación...',
    'Preparando mascota guía...',
    'Optimizando texturas 3D...',
    'Casi listo...',
  ]
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phase !== 'loading') {
      // Fade out after a short delay
      const t = setTimeout(() => setVisible(false), 900)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className={`loading-screen ${!visible ? 'hidden' : ''}`}>
      <div className="loading-logo">INACAP Navigator</div>
      <div className="loading-subtitle">Sistema de Navegación 3D</div>

      <div className="loading-bar-track">
        <div
          className="loading-bar-fill"
          style={{ width: `${loadingProgress}%` }}
        />
        <div className="loading-bar-shimmer" />
      </div>

      <div className="loading-tip">{tips[tipIndex]}</div>
    </div>
  )
}
