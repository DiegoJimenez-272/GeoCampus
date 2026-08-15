import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Lighting — configuración de luz de día clara y natural.
 * Simula un entorno exterior luminoso con sombras suaves.
 */
export default function Lighting() {
  const dirLightRef = useRef()

  useFrame(({ clock }) => {
    if (dirLightRef.current) {
      dirLightRef.current.intensity = 2.0 + Math.sin(clock.getElapsedTime() * 0.15) * 0.08
    }
  })

  return (
    <>
      {/* Luz ambiente natural suave — evita sombras totalmente negras pero mantiene el contraste */}
      <ambientLight color="#e2e8f0" intensity={0.75} />

      {/* Sol principal cálido con proyección de sombras sin artefactos */}
      <directionalLight
        ref={dirLightRef}
        position={[45, 75, 40]}
        intensity={2.4}
        color="#fffbf0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00005}
        shadow-normalBias={0.04} /* Elimina las líneas/anillos de moiré en el techo */
        shadow-camera-near={10}
        shadow-camera-far={220}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Luz hemisférica cielo / suelo para rebote natural */}
      <hemisphereLight args={['#dbeafe', '#94a3b8', 0.65]} />

      {/* Rellenos sutiles en ángulo opuesto para definir aristas arquitectónicas */}
      <directionalLight position={[-45, 35, -40]} intensity={0.8} color="#cbd5e1" />
      <directionalLight position={[0, -10, 40]}  intensity={0.4} color="#f8fafc" />

      {/* Luces puntuales sutiles para entradas y accesos */}
      <pointLight position={[0, 4, 12]} intensity={0.8} color="#fff1e6" distance={25} decay={2} />
    </>
  )
}
