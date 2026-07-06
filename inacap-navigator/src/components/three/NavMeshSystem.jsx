import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useAppStore from '../../store/useAppStore'

/**
 * NavMeshSystem - versión simplificada sin three-pathfinding externo.
 * Usa pathfinding propio simple (línea recta con waypoints intermedios).
 * Cuando tengas el NavMesh en el .glb, podemos integrar three-pathfinding.
 */
export default function NavMeshSystem() {
  const { selectedDestination, setNavigationPath } = useAppStore()

  useEffect(() => {
    if (!selectedDestination) return

    const startPos = new THREE.Vector3(0, 0.05, 9)
    const endPos = selectedDestination.position.clone()
    endPos.y = 0.05

    // Crear ruta con waypoints intermedios para evitar paredes
    const mid1 = new THREE.Vector3(
      startPos.x * 0.6 + endPos.x * 0.4,
      0.05,
      startPos.z * 0.6 + endPos.z * 0.4
    )
    const mid2 = new THREE.Vector3(
      startPos.x * 0.3 + endPos.x * 0.7,
      0.05,
      startPos.z * 0.3 + endPos.z * 0.7
    )

    const path = [startPos, mid1, mid2, endPos]
    setNavigationPath(path)

    console.log('[NavMesh] Ruta calculada:', path.length, 'puntos')
  }, [selectedDestination])

  return null
}
