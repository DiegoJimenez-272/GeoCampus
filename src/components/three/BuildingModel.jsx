import { useRef, useEffect, Suspense, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import useAppStore from '../../store/useAppStore'

const FLOORS_CONFIG = [
  { id: 0, name: 'Subterráneo', yMin: -2.0, yMax:  3.5 },
  { id: 1, name: 'Piso 1',      yMin:  3.5, yMax:  7.5 },
  { id: 2, name: 'Piso 2',      yMin:  7.5, yMax: 11.5 },
  { id: 3, name: 'Piso 3',      yMin: 11.5, yMax: 15.5 },
  { id: 4, name: 'Techo',       yMin: 15.5, yMax: 30.0 },
]

function getFloorId(y) {
  for (const f of FLOORS_CONFIG) {
    if (y >= f.yMin && y < f.yMax) return f.id
  }
  if (y < FLOORS_CONFIG[0].yMin) return 0
  return FLOORS_CONFIG[FLOORS_CONFIG.length - 1].id
}

function ModelLoader() {
  return (
    <Html center>
      <div style={{
        color: '#dc2626', fontFamily: 'Outfit, sans-serif', fontSize: '0.95rem',
        fontWeight: '600', background: 'rgba(255,255,255,0.95)', padding: '14px 28px',
        borderRadius: '16px', border: '1px solid rgba(30,64,175,0.18)',
        backdropFilter: 'blur(16px)', whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(30,64,175,0.1)'
      }}>
        ⏳ Cargando edificio 3D…
      </div>
    </Html>
  )
}

function GLBBuilding({ onReady, debugMarkers, setDebugMarkers }) {
  const { scene } = useGLTF('/models/inacap_prueba.glb')
  const selectedFloor = useAppStore((s) => s.selectedFloor)
  const meshesRef = useRef([])
  const readyRef = useRef(false)

  // ─── Inicialización: clasificar meshes por posición Y mundial ───
  useEffect(() => {
    if (!scene) return

    // 1. Centrar el modelo (solo la primera vez)
    if (!readyRef.current) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      scene.position.sub(center)
      scene.position.y += size.y / 2
      scene.updateMatrixWorld(true) // Fundamental para basarnos en 0.0
    }

    // 2. Clasificar por el punto más bajo del bounding box
    const meshBBox = new THREE.Box3()
    const bboxCenter = new THREE.Vector3()
    const classified = []

    scene.traverse((child) => {
      if (!child.isMesh) return
      if (child.name.toLowerCase().includes('navmesh')) {
        child.visible = false
        return
      }

      meshBBox.setFromObject(child)
      meshBBox.getCenter(bboxCenter)
      
      const sizeY = meshBBox.max.y - meshBBox.min.y
      let wy = bboxCenter.y

      // Heurística híbrida:
      // Si el objeto es alto (paredes, columnas > 2m), pertenece al piso en el que se "apoya" (min.y).
      // Si el objeto es bajo (suelos, escritorios < 2m), usamos su centro para mayor precisión.
      if (sizeY > 2.0) {
        wy = meshBBox.min.y
      }

      child.userData.worldY  = wy
      child.userData.floorId = getFloorId(wy)
      child.userData.originalY = child.position.y
      
      // Habilitar proyección y recepción de sombras en cada malla del edificio
      child.castShadow = true
      child.receiveShadow = true
      if (child.material) {
        child.material.needsUpdate = true
        if (child.material.isMeshStandardMaterial) {
          child.material.envMapIntensity = 1.0
        }
      }
      
      classified.push(child)
    })

    meshesRef.current = classified
    readyRef.current = true
    onReady?.()
  }, [scene])

  // ─── Reacción al cambio de piso seleccionado ──────────────
  useEffect(() => {
    const meshes = meshesRef.current
    if (meshes.length === 0) return

    meshes.forEach((mesh) => {
      // Cambio de piso instantáneo sin animaciones
      if (selectedFloor === null) {
        mesh.visible = true
      } else {
        mesh.visible = mesh.userData.floorId === selectedFloor
      }
    })
  }, [selectedFloor])

  return (
    <group onClick={(e) => {
      e.stopPropagation()
      
      // 1. Filtrar las intersecciones para ignorar techos o mallas altas flotantes
      // Nos quedamos con el punto de impacto más bajo que siga estando dentro del piso actual
      let validHit = e.intersections[0]
      if (selectedFloor !== null) {
        const currentFloorConfig = FLOORS_CONFIG.find(f => f.id === selectedFloor)
        if (currentFloorConfig) {
          const floorHits = e.intersections.filter(hit => 
            hit.point.y >= currentFloorConfig.yMin && 
            hit.point.y <= currentFloorConfig.yMin + 2.0 // Solo superficies bajas (suelo o mesas)
          )
          if (floorHits.length > 0) {
            validHit = floorHits[0] // El primero es el más cercano a la cámara que cumple
          }
        }
      }

      const p = validHit.point
      const meshName = validHit.object.name || 'Desconocido'
      console.log(`📍 CLIC EN: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}] | Hit: ${meshName}`)
      
      // Agregar un marcador visual azul (reemplazando el anterior, solo queda 1)
      if (setDebugMarkers) {
        setDebugMarkers([{ x: p.x, y: p.y, z: p.z }])
      }

      const div = document.createElement('div')
      div.innerHTML = `📍 [${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}]<br><span style="font-size:10px;color:#888;">Mesh: ${meshName}</span>`
      div.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;background:#000;color:#0f0;padding:8px 16px;border-radius:8px;font-family:monospace;font-size:14px;text-align:center;'
      document.body.appendChild(div)
      setTimeout(() => div.remove(), 4000)
    }}>
      <primitive object={scene} dispose={null} />
      
      {/* Renderizar los puntos azules donde se hizo clic */}
      {debugMarkers?.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      ))}

      {/* Base arquitectónica continua que se funde perfectamente con el horizonte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.95} metalness={0.0} />
      </mesh>
    </group>
  )
}

/**
 * BuildingModel — Componente principal de carga del GLB
 */
export default function BuildingModel() {
  const { phase, setPhase, setLoadingProgress } = useAppStore()
  const [glbFound, setGlbFound] = useState(null)
  const [debugMarkers, setDebugMarkers] = useState([])

  useEffect(() => {
    let p = 0
    const iv = setInterval(() => {
      p = Math.min(p + 18, 85)
      setLoadingProgress(Math.round(p))
    }, 200)

    fetch('/models/inacap_prueba.glb', { method: 'HEAD' })
      .then((res) => {
        clearInterval(iv)
        setGlbFound(res.ok)
        if (!res.ok) {
          setLoadingProgress(100)
          setTimeout(() => setPhase('interior'), 500)
        }
      })
      .catch(() => {
        clearInterval(iv)
        setGlbFound(false)
        setLoadingProgress(100)
        setTimeout(() => setPhase('interior'), 500)
      })

    return () => clearInterval(iv)
  }, [])

  const handleReady = () => {
    setLoadingProgress(100)
    setTimeout(() => {
      if (phase === 'loading') setPhase('interior')
    }, 400)
  }

  if (glbFound === null) return <ModelLoader />

  if (glbFound) {
    return (
      <Suspense fallback={<ModelLoader />}>
        <GLBBuilding 
          onReady={handleReady} 
          debugMarkers={debugMarkers} 
          setDebugMarkers={setDebugMarkers} 
        />
      </Suspense>
    )
  }

  return <FallbackBuilding onReady={handleReady} />
}

/**
 * Fallback geométrico simple (si no hay GLB)
 */
function FallbackBuilding({ onReady }) {
  const selectedFloor = useAppStore((s) => s.selectedFloor)
  useEffect(() => { onReady?.() }, [])

  const floors = [
    { id: 0, y: 1,    color: '#e8edf3', label: 'SUB' },
    { id: 1, y: 5.5,  color: '#dde4ef', label: 'P1'  },
    { id: 2, y: 10,   color: '#d2dae9', label: 'P2'  },
    { id: 3, y: 14.5, color: '#c8d0e3', label: 'P3'  },
  ]

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#d4dde8" roughness={0.9} />
      </mesh>
      <gridHelper args={[100, 50, '#b8c4d0', '#c8d4dc']} />
      {floors.map((f) => {
        const show = selectedFloor === null || selectedFloor === f.id
        return show ? (
          <mesh key={f.id} position={[0, f.y, 0]} castShadow receiveShadow>
            <boxGeometry args={[24, 3, 18]} />
            <meshStandardMaterial color={f.color} roughness={0.6} />
          </mesh>
        ) : null
      })}
    </group>
  )
}

useGLTF.preload('/models/inacap_prueba.glb')
