import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

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
  const { phase, viewMode, exitBuilding, autoRotateEnabled, toggleAutoRotate } = useAppStore()

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

          {/* Botón toggle auto-rotación */}
          {viewMode === 'exterior' && (
            <button
              onClick={toggleAutoRotate}
              title={autoRotateEnabled ? 'Detener rotación' : 'Activar rotación'}
              style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                zIndex: 1000,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(30,64,175,0.15)',
                background: autoRotateEnabled
                  ? 'rgba(239, 68, 68, 0.92)' // Rojo cuando está girando (pausar)
                  : 'rgba(255, 255, 255, 0.92)', // Blanco cuando está detenido (reproducir)
                color: autoRotateEnabled ? '#fff' : '#1e3a5f',
                fontSize: '1.1rem',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {autoRotateEnabled ? '⏸' : '▶'}
            </button>
          )}
          {/* Botón para volver a la vista exterior cuando estás dentro */}
          {viewMode === 'interior' && (
            <button
              onClick={exitBuilding}
              style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.92)',
                color: '#1e3a5f',
                border: '1px solid rgba(30,64,175,0.15)',
                borderRadius: '14px',
                padding: '10px 24px',
                fontSize: '0.85rem',
                fontWeight: '600',
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.95)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.92)'
                e.target.style.color = '#1e3a5f'
              }}
            >
              ← Volver a Vista Exterior
            </button>
          )}
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
          background: 'linear-gradient(180deg, #dbeafe 0%, #e2e8f0 60%, #f1f5f9 100%)',
        }}
        camera={{
          fov: 45,
          near: 0.5,
          far: 1200,
          position: [75, 45, 95],
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
      >
        <Suspense fallback={null}>
          {/* Fondo del cielo armonizado con niebla amplia para zoom lejano */}
          <color attach="background" args={['#e2e8f0']} />
          <fog attach="fog" args={['#e2e8f0', 250, 850]} />
          <Lighting />
          <CameraController />
          <BuildingModel />
        </Suspense>
      </Canvas>
    </>
  )
}
