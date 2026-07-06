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
      {/* Luz ambiente día — clara y cálida */}
      <ambientLight color="#f0f4ff" intensity={2.5} />

      {/* Sol principal */}
      <directionalLight
        ref={dirLightRef}
        position={[40, 70, 30]}
        intensity={2.2}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.001}
      />

      {/* Luz hemisférica cielo/suelo */}
      <hemisphereLight args={['#c8dcff', '#d0e8c0', 1.2]} />

      {/* Rellenos para eliminar zonas oscuras */}
      <directionalLight position={[-30, 30, -30]} intensity={1.0} color="#ddeeff" />
      <directionalLight position={[0, -10, 30]}  intensity={0.6} color="#ffffff" />

      {/* Luces interiores omnidireccionales */}
      <pointLight position={[0,  8, 0]}   intensity={1.0} color="#fff8f0" distance={50} decay={1} />
      <pointLight position={[-10, 6, -4]} intensity={0.8} color="#fff5e0" distance={30} decay={1} />
      <pointLight position={[ 10, 6, -4]} intensity={0.8} color="#fff5e0" distance={30} decay={1} />

      {/* Luz de entrada */}
      <pointLight position={[0, 3, 10]} intensity={0.6} color="#e0f0ff" distance={10} decay={2} />
    </>
  )
}
