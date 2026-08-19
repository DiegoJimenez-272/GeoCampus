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

// ─── Posiciones de cámara para la transición de entrada ───
const ENTRANCE_CAM = { x: 46.9, y: 5.5, z: 30 }      // Cámara casi en la misma posición, un poco atrás
const ENTRANCE_TARGET = { x: 46.9, y: 4.8, z: 28.7 }  // Mirando hacia adentro del edificio

const EXTERIOR_CAM = { x: 55, y: 28, z: 65 }    // Vista exterior orbital
const EXTERIOR_TARGET = { x: 0, y: 2, z: 0 }    // Centro del edificio

export default function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef()
  const { selectedFloor, selectedDestination, cameraEntry, viewMode, autoRotateEnabled } = useAppStore()

  // Posicionar cámara inicialmente en la entrada
  useEffect(() => {
    camera.position.copy(cameraEntry)
    camera.lookAt(0, 1.5, 0)
  }, [])

  // ─── Transición exterior ↔ interior ────────────────────────
  useEffect(() => {
    if (!controlsRef.current) return
    const controls = controlsRef.current
    const target = controls.target

    if (viewMode === 'interior') {
      // Volar hacia la entrada del edificio
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(target)

      gsap.to(camera.position, {
        x: ENTRANCE_CAM.x,
        y: ENTRANCE_CAM.y,
        z: ENTRANCE_CAM.z,
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix()
      })

      gsap.to(target, {
        x: ENTRANCE_TARGET.x,
        y: ENTRANCE_TARGET.y,
        z: ENTRANCE_TARGET.z,
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => controls.update()
      })

      // Detener auto-rotación al entrar
      controls.autoRotate = false

    } else {
      // Volver a la vista orbital exterior
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(target)

      gsap.to(camera.position, {
        x: EXTERIOR_CAM.x,
        y: EXTERIOR_CAM.y,
        z: EXTERIOR_CAM.z,
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix()
      })

      gsap.to(target, {
        x: EXTERIOR_TARGET.x,
        y: EXTERIOR_TARGET.y,
        z: EXTERIOR_TARGET.z,
        duration: 2,
        ease: 'power3.inOut',
        onUpdate: () => {
          controls.update()
        },
        onComplete: () => {
          controls.autoRotate = autoRotateEnabled
        }
      })
    }
  }, [viewMode])

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

  // Reaccionar al toggle de autoRotate
  useEffect(() => {
    if (controlsRef.current && viewMode === 'exterior') {
      controlsRef.current.autoRotate = autoRotateEnabled
    }
  }, [autoRotateEnabled])

  // Normalizar la velocidad de rotación para que sea suave y constante independiente de los FPS
  useFrame((state, delta) => {
    if (controlsRef.current && controlsRef.current.autoRotate) {
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
      maxDistance={420} // Permite zoom amplio hacia atrás
      target={[0, 2.0, 0]}
      autoRotate={autoRotateEnabled}
      autoRotateSpeed={2.5}
      makeDefault
    />
  )
}
