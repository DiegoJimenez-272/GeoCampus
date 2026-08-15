import { useEffect, useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Función auxiliar para generar mallas sólidas de calles (Road Ribbons)
 * con ancho real a partir de líneas centrales.
 */
function createRoadMesh(polylines, width = 6.0, yOffset = 0.02) {
  const halfW = width / 2
  const positions = []
  const indices = []
  let vertexOffset = 0

  polylines.forEach((item) => {
    const pts = item.points
    if (pts.length < 2) return

    // Generar vértices paralelos a cada lado de la línea
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      let dirX = 0
      let dirZ = 0

      if (i === 0) {
        dirX = pts[1][0] - p[0]
        dirZ = pts[1][2] - p[2]
      } else if (i === pts.length - 1) {
        dirX = p[0] - pts[i - 1][0]
        dirZ = p[2] - pts[i - 1][2]
      } else {
        dirX = pts[i + 1][0] - pts[i - 1][0]
        dirZ = pts[i + 1][2] - pts[i - 1][2]
      }

      const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
      const normX = -dirZ / len
      const normZ = dirX / len

      // Vértice izquierdo y derecho
      positions.push(p[0] + normX * halfW, yOffset, p[2] + normZ * halfW)
      positions.push(p[0] - normX * halfW, yOffset, p[2] - normZ * halfW)

      // Triangulación de la cinta de asfalto
      if (i < pts.length - 1) {
        const i0 = vertexOffset + i * 2
        const i1 = i0 + 1
        const i2 = i0 + 2
        const i3 = i0 + 3

        indices.push(i0, i1, i2)
        indices.push(i1, i3, i2)
      }
    }

    vertexOffset += pts.length * 2
  })

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

/**
 * CityEnvironment — Maqueta Urbana 3D Sólida estilo Apple Maps
 */
export default function CityEnvironment({ visible = true }) {
  const [cityData, setCityData] = useState(null)
  const [hoveredPin, setHoveredPin] = useState(null)

  useEffect(() => {
    fetch('/models/city_environment.json')
      .then((res) => res.json())
      .then((data) => setCityData(data))
      .catch((err) => console.warn('Error al cargar entorno:', err))
  }, [])

  // ─── Calles Sólidas (Asfalto Real) ────────────────────────
  const solidRoads = useMemo(() => {
    if (!cityData) return null

    return {
      // Avenidas con 8 metros de ancho de calzada
      major: createRoadMesh(cityData.layers.major_roads || [], 8.5, 0.025),
      // Calles secundarias con 5.5 metros
      minor: createRoadMesh(cityData.layers.minor_roads || [], 5.5, 0.02),
      // Pasajes y veredas peatonales con 3 metros
      paths: createRoadMesh(cityData.layers.paths || [], 3.0, 0.015),
      // Cuerpos de agua con 6 metros
      water: createRoadMesh(cityData.layers.water || [], 6.5, 0.01),
    }
  }, [cityData])

  // ─── Parques y Áreas Verdes Sólidas ───────────────────────
  const parkMeshes = useMemo(() => {
    if (!cityData || !cityData.layers.parks) return []

    return cityData.layers.parks.map((park, idx) => {
      if (park.points.length < 3) return null

      const shape = new THREE.Shape()
      shape.moveTo(park.points[0][0], -park.points[0][2])
      for (let i = 1; i < park.points.length; i++) {
        shape.lineTo(park.points[i][0], -park.points[i][2])
      }
      shape.closePath()

      return (
        <mesh
          key={`park-${idx}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.018, 0]}
          receiveShadow
        >
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial
            color="#86efac"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      )
    })
  }, [cityData])

  // ─── Edificios y Manzanas Vecinas en 3D Minimalista ───────
  const neighborBuildings = useMemo(() => {
    if (!cityData || !cityData.layers.buildings) return []

    return cityData.layers.buildings.map((bldg, idx) => {
      if (bldg.points.length < 3) return null

      const shape = new THREE.Shape()
      shape.moveTo(bldg.points[0][0], -bldg.points[0][2])
      for (let i = 1; i < bldg.points.length; i++) {
        shape.lineTo(bldg.points[i][0], -bldg.points[i][2])
      }
      shape.closePath()

      const height = (idx % 3 === 0) ? 8.5 : (idx % 2 === 0 ? 6.0 : 4.5)

      return (
        <mesh
          key={`bldg-${idx}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          castShadow
          receiveShadow
        >
          <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
      )
    })
  }, [cityData])

  // Pines y Marcadores urbanos minimalistas y no invasivos
  const customPins = [
    {
      id: 'ricardo-vicuna',
      name: 'Av. Ricardo Vicuña',
      subtitle: 'Eje Principal & Parque',
      position: [0, 1.0, 68],
      icon: '🌳',
      color: '#16a34a'
    },
    {
      id: '21-de-mayo',
      name: 'Av. 21 de Mayo',
      subtitle: 'Acceso Norte',
      position: [0, 1.0, -68],
      icon: '🛣️',
      color: '#2563eb'
    },
    {
      id: 'calle-urenda',
      name: 'Calle Urenda',
      subtitle: 'Acceso Poniente',
      position: [-95, 1.0, 0],
      icon: '📍',
      color: '#475569'
    },
    {
      id: 'laguna-esmeralda',
      name: 'Laguna Esmeralda',
      subtitle: 'Parque Urbano',
      position: [-145, 1.0, -95],
      icon: '🦆',
      color: '#0284c7'
    },
    {
      id: 'jumbo',
      name: 'Sector Jumbo',
      subtitle: 'Supermercado',
      position: [115, 1.0, 10],
      icon: '🛒',
      color: '#059669'
    },
    {
      id: 'inacap-access',
      name: 'Acceso Principal INACAP',
      subtitle: 'Plaza de Entrada',
      position: [55, 3.5, 32],
      icon: '🎓',
      color: '#e3000f'
    }
  ]

  if (!visible || !cityData) return null

  return (
    <group name="CityEnvironment" position={[0, 0, 0]}>
      {/* ── 1. Parques / Áreas Verdes con color sólido ────────── */}
      {parkMeshes}

      {/* ── 2. Calles y Avenidas de Asfalto Sólido ──────────── */}
      {solidRoads?.major && (
        <mesh geometry={solidRoads.major} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      )}

      {solidRoads?.minor && (
        <mesh geometry={solidRoads.minor} receiveShadow>
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      )}

      {solidRoads?.paths && (
        <mesh geometry={solidRoads.paths} receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.9} opacity={0.8} transparent />
        </mesh>
      )}

      {solidRoads?.water && (
        <mesh geometry={solidRoads.water}>
          <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* ── 3. Edificaciones Vecinas 3D Minimalistas ────────── */}
      {neighborBuildings}

      {/* ── 4. Pines Urbanos Minimalistas (Estilo Maps) ──────── */}
      {customPins.map((pin) => {
        const isHovered = hoveredPin === pin.id

        return (
          <Html
            key={pin.id}
            position={pin.position}
            center
            distanceFactor={190}
            zIndexRange={[10, 50]}
          >
            <div
              onMouseEnter={() => setHoveredPin(pin.id)}
              onMouseLeave={() => setHoveredPin(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                userSelect: 'none',
                transform: isHovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Pin Circular Minimalista */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: `2px solid ${pin.color}`,
                  boxShadow: `0 4px 14px ${pin.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  backdropFilter: 'blur(8px)',
                  flexShrink: 0,
                }}
              >
                {pin.icon}
              </div>

              {/* Etiqueta elegante que acompaña al pin */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: '#0f172a',
                  }}
                >
                  {pin.name}
                </span>
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.62rem',
                    color: '#64748b',
                  }}
                >
                  {pin.subtitle}
                </span>
              </div>
            </div>
          </Html>
        )
      })}
    </group>
  )
}
