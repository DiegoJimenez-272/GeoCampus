import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { gsap } from 'gsap'
import useAppStore from '../../store/useAppStore'

/** Alturas de enfoque para los 4 pisos reales */
const FLOOR_HEIGHTS = {
  0: 2.0,  // Subterráneo
  1: 6.3,  // Piso 1
  2: 10.5, // Piso 2
  3: 14.5, // Piso 3
}

export default function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef()
  const { selectedFloor, selectedDestination, cameraEntry } = useAppStore()

  // Posicionar cámara inicialmente en la entrada
  useEffect(() => {
    camera.position.copy(cameraEntry)
    camera.lookAt(0, 1.5, 0)
  }, [])

  // Animar cámara cuando se selecciona una oficina/destino
  useEffect(() => {
    if (!controlsRef.current || !selectedDestination) return

    const controls = controlsRef.current
    const target = controls.target

    const pos = selectedDestination.position
    const targetTargetPos = { x: pos.x, y: pos.y, z: pos.z }
    
    // Posición de cámara con zoom cercano al destino
    const targetCamPos = {
      x: pos.x + 8,
      y: pos.y + 6,
      z: pos.z + 8
    }

    // Animación fluida de la posición de la cámara con GSAP
    gsap.killTweensOf(camera.position)
    gsap.to(camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => camera.updateProjectionMatrix()
    })

    // Animación fluida del punto de enfoque (OrbitControls target)
    gsap.killTweensOf(target)
    gsap.to(target, {
      x: targetTargetPos.x,
      y: targetTargetPos.y,
      z: targetTargetPos.z,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => controls.update()
    })

  }, [selectedDestination])

  // Normalizar la velocidad de rotación para que sea independiente de los FPS
  // Three.js OrbitControls asume 60fps fijos por defecto. Multiplicar por (delta * 60) lo hace constante.
  useFrame((state, delta) => {
    if (controlsRef.current) {
      // 2.5 es la velocidad base deseada
      controlsRef.current.autoRotateSpeed = 2.5 * (delta * 60)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.05} // No bajar del suelo
      minDistance={2}
      maxDistance={420} // Permite zoom amplio hacia atrás para ver todo el mapa de la ciudad
      target={[0, 2.0, 0]}
      autoRotate={true}
      autoRotateSpeed={2.5}
      makeDefault
    />
  )
}
