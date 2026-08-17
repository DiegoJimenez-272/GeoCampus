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
