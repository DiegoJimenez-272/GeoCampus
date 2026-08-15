import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useAppStore from '../../store/useAppStore'

const MOVE_SPEED = 2.5
const ARRIVAL_THRESHOLD = 0.3
const ROTATION_SPEED = 8

/**
 * MascotGuide - mascota geométrica animada (sin cargar .glb externo).
 */
export default function MascotGuide() {
  const { phase, navigationPath, setMascotAnimating, setMascotReached } = useAppStore()

  if (phase !== 'interior') return null

  return (
    <MascotInner
      navigationPath={navigationPath}
      setMascotAnimating={setMascotAnimating}
      setMascotReached={setMascotReached}
    />
  )
}

function MascotInner({ navigationPath, setMascotAnimating, setMascotReached }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const eyeLeftRef = useRef()
  const eyeRightRef = useRef()
  const waypointIndexRef = useRef(0)
  const isMovingRef = useRef(false)
  const pathRef = useRef([])
  const { mascotAnimating } = useAppStore()

  useEffect(() => {
    if (!navigationPath || navigationPath.length === 0) {
      pathRef.current = []
      waypointIndexRef.current = 0
      isMovingRef.current = false
      setMascotAnimating(false)
      setMascotReached(false)

      if (groupRef.current) {
        groupRef.current.position.set(0, 0, 9)
      }
      return
    }

    pathRef.current = navigationPath.map((p) =>
      p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p.x ?? 0, p.y ?? 0, p.z ?? 0)
    )

    if (groupRef.current && pathRef.current[0]) {
      const start = pathRef.current[0]
      groupRef.current.position.set(start.x, start.y, start.z)
    }

    waypointIndexRef.current = 1
    isMovingRef.current = true
    setMascotAnimating(true)
    setMascotReached(false)
  }, [navigationPath])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()

    // Animación idle (bob)
    if (bodyRef.current) {
      if (isMovingRef.current) {
        bodyRef.current.position.y = 0.85 + Math.sin(t * 9) * 0.07
      } else {
        bodyRef.current.position.y = 0.85 + Math.sin(t * 1.5) * 0.04
      }
    }

    // Parpadeo
    if (eyeLeftRef.current && eyeRightRef.current) {
      const blink = Math.sin(t * 0.35) > 0.96 ? 0.1 : 1
      eyeLeftRef.current.scale.y = blink
      eyeRightRef.current.scale.y = blink
    }

    // Movimiento por waypoints
    if (!groupRef.current || !isMovingRef.current) return
    const path = pathRef.current
    const idx = waypointIndexRef.current

    if (idx >= path.length) {
      isMovingRef.current = false
      setMascotAnimating(false)
      setMascotReached(true)
      return
    }

    const target = path[idx]
    const current = groupRef.current.position
    const dir = new THREE.Vector3().subVectors(target, current).setY(0)
    const dist = dir.length()

    if (dist < ARRIVAL_THRESHOLD) {
      waypointIndexRef.current = idx + 1
      return
    }

    dir.normalize()
    const step = Math.min(MOVE_SPEED * delta, dist)
    current.addScaledVector(dir, step)

    // Rotación suave hacia el destino
    const lookTarget = new THREE.Vector3(target.x, current.y, target.z)
    const mat = new THREE.Matrix4().lookAt(current, lookTarget, new THREE.Vector3(0, 1, 0))
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(mat)
    groupRef.current.quaternion.slerp(targetQuat, ROTATION_SPEED * delta)
  })

  return (
    <group ref={groupRef} position={[0, 0, 9]}>
      {/* Cuerpo */}
      <group ref={bodyRef} position={[0, 0.85, 0]}>
        {/* Torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 12]} />
          <meshStandardMaterial
            color="#2563eb"
            roughness={0.2}
            metalness={0.4}
            emissive="#1d4ed8"
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* Cabeza */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.15} metalness={0.5} />
        </mesh>

        {/* Ojo izquierdo */}
        <mesh ref={eyeLeftRef} position={[-0.085, 0.68, 0.18]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#bfdbfe" emissiveIntensity={1.5} />
        </mesh>

        {/* Ojo derecho */}
        <mesh ref={eyeRightRef} position={[0.085, 0.68, 0.18]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#bfdbfe" emissiveIntensity={1.5} />
        </mesh>

        {/* Antena */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
          <meshStandardMaterial color="#93c5fd" />
        </mesh>
        {/* Punta antena */}
        <AntennaTip isMoving={mascotAnimating} />

        {/* Brazos */}
        <mesh position={[-0.35, 0.1, 0]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0.35, 0.1, 0]} rotation={[0, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>

      {/* Sombra proyectada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function AntennaTip({ isMoving }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.material.emissiveIntensity = isMoving
      ? 1.5 + Math.sin(t * 10) * 1.5
      : 0.8 + Math.sin(t * 2) * 0.3
  })
  return (
    <mesh ref={ref} position={[0, 1.13, 0]}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshStandardMaterial
        color="#00ff88"
        emissive="#00ff88"
        emissiveIntensity={1}
      />
    </mesh>
  )
}
