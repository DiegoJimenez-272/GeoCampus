import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

// Nuevos componentes de UI Interactiva
import FloorSelector from './components/FloorSelector'
import InfoPanel from './components/InfoPanel'
import SearchUI from './components/SearchUI'

// Componentes del Canvas 3D
import Lighting from './components/three/Lighting'
import BuildingModel from './components/three/BuildingModel'
import CameraController from './components/three/CameraController'

import useAppStore from './store/useAppStore'

export default function App() {
  const { phase } = useAppStore()

  return (
    <>
      {/* ── Capa de Interfaz de Usuario 2D (Premium) ────────── */}
      {phase !== 'loading' && (
        <>
          <div className="app-header">
            <h1>GeoCampus<br /><span>INACAP</span></h1>
          </div>
          <button className="login-btn" onClick={() => alert('Próximamente: Panel de Administración')}>
            <img src="/usuario2.png" alt="Usuario" style={{ width: '20px', height: '20px', objectFit: 'contain' }} /> Iniciar Sesión
          </button>
        </>
      )}
      <FloorSelector />
      <InfoPanel />
      <SearchUI />

      {/* ── Lienzo 3D en Pantalla Completa ──────────────────── */}
      <Canvas
        id="main-canvas"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(170deg, #dbeafe 0%, #eff6ff 40%, #f0f4f8 100%)',
        }}
        camera={{
          fov: 55,
          near: 0.1,
          far: 500,
          position: [0, 25, 45],
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          {/* Fondo del cielo — reemplaza el negro de WebGL */}
          <color attach="background" args={['#dbeafe']} />
          <fog attach="fog" args={['#dbeafe', 80, 300]} />
          <Lighting />
          <CameraController />
          <BuildingModel />
        </Suspense>
      </Canvas>
    </>
  )
}
