import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import useAppStore from '../../store/useAppStore'

/**
 * NavigationPath — Draws an animated glowing green line along the computed route.
 *
 * Uses CatmullRomCurve3 to smooth out the waypoints from pathfinding,
 * then renders it with @react-three/drei's <Line> component.
 * A "marching" dash animation gives the sense of direction.
 */
export default function NavigationPath() {
  const { navigationPath, phase } = useAppStore()
  const lineRef = useRef()

  // Build a smooth curve from the waypoints
  const { points, visible } = useMemo(() => {
    if (!navigationPath || navigationPath.length < 2) {
      return { points: [], visible: false }
    }

    // Ensure all entries are THREE.Vector3
    const vectors = navigationPath.map((p) =>
      p instanceof THREE.Vector3 ? p : new THREE.Vector3(p.x, p.y, p.z)
    )

    // Lift the path slightly above the floor (y + 0.08)
    const lifted = vectors.map((v) => new THREE.Vector3(v.x, Math.max(v.y, 0.08), v.z))

    // Smooth with CatmullRom spline
    const curve = new THREE.CatmullRomCurve3(lifted, false, 'catmullrom', 0.5)
    const smooth = curve.getPoints(lifted.length * 12)

    return { points: smooth, visible: true }
  }, [navigationPath])

  // Animate dash offset for marching-ants effect
  useFrame(({ clock }) => {
    if (lineRef.current) {
      // Shift material dashOffset over time
      if (lineRef.current.material) {
        lineRef.current.material.dashOffset = -clock.getElapsedTime() * 0.6
      }
    }
  })

  if (!visible || phase !== 'interior') return null

  return (
    <group>
      {/* Línea principal — verde esmeralda sólido */}
      <Line
        ref={lineRef}
        points={points}
        color="#059669"
        lineWidth={5}
        dashed={true}
        dashSize={0.4}
        gapSize={0.15}
      />

      {/* Capa de brillo — verde más suave */}
      <Line
        points={points}
        color="#10b981"
        lineWidth={12}
        transparent
        opacity={0.15}
      />

      {/* Destination marker sphere */}
      {points.length > 0 && (
        <DestinationMarker position={points[points.length - 1]} />
      )}

      {/* Waypoint dots along the path */}
      {navigationPath.map((p, i) => {
        if (i === 0 || i === navigationPath.length - 1) return null
        const pos = p instanceof THREE.Vector3 ? p : new THREE.Vector3(p.x, p.y, p.z)
        return (
          <mesh key={i} position={[pos.x, 0.1, pos.z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Pulsing destination marker at the end of the path.
 */
function DestinationMarker({ position }) {
  const ringRef = useRef()

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3
      ringRef.current.scale.setScalar(s)
      ringRef.current.material.opacity = 0.5 - Math.sin(clock.getElapsedTime() * 3) * 0.3
    }
  })

  return (
    <group position={position}>
      {/* Pin central */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={1} roughness={0.2} />
      </mesh>
      {/* Anillo pulsante */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.45, 24]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Poste vertical */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.2, 4]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
