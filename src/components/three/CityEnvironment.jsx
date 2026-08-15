import { useEffect, useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * CityEnvironment — Renderiza el trazado urbano calibrado de Los Ángeles (CADmapper)
 * perfectamente alineado con el edificio INACAP y con etiquetas 3D de referencia.
 */
export default function CityEnvironment({ visible = true }) {
  const [cityData, setCityData] = useState(null)

  useEffect(() => {
    fetch('/models/city_environment.json')
      .then((res) => res.json())
      .then((data) => setCityData(data))
      .catch((err) => console.warn('No se pudo cargar el entorno urbano CADmapper:', err))
  }, [])

  // ─── Generación de Geometrías de Calles y Senderos ─────────
  const roadGeometries = useMemo(() => {
    if (!cityData) return null

    const createLineGeometry = (items, yOffset = 0.03) => {
      const positions = []
      items.forEach((item) => {
        const pts = item.points
        for (let i = 0; i < pts.length - 1; i++) {
          positions.push(pts[i][0], yOffset, pts[i][2])
          positions.push(pts[i + 1][0], yOffset, pts[i + 1][2])
        }
        if (item.closed && pts.length > 2) {
          positions.push(pts[pts.length - 1][0], yOffset, pts[pts.length - 1][2])
          positions.push(pts[0][0], yOffset, pts[0][2])
        }
      })

      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      return geom
    }

    return {
      major: createLineGeometry(cityData.layers.major_roads || [], 0.05),
      minor: createLineGeometry(cityData.layers.minor_roads || [], 0.03),
      paths: createLineGeometry(cityData.layers.paths || [], 0.02),
      railways: createLineGeometry(cityData.layers.railways || [], 0.04),
      water: createLineGeometry(cityData.layers.water || [], 0.02),
    }
  }, [cityData])

  // ─── Generación de Polígonos de Parques / Áreas Verdes ─────
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
          position={[0, 0.015, 0]}
        >
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color="#86efac" opacity={0.65} transparent depthWrite={false} />
        </mesh>
      )
    })
  }, [cityData])

  // ─── Generación de Volúmenes 3D de Edificios Vecinos ──────
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

      const height = (idx % 3 === 0) ? 9.0 : (idx % 2 === 0 ? 6.5 : 5.0)

      return (
        <group key={`bldg-${idx}`}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.01, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.7}
              metalness={0.05}
              opacity={0.88}
              transparent
            />
          </mesh>
        </group>
      )
    })
  }, [cityData])

  if (!visible || !cityData) return null

  return (
    <group name="CityEnvironment" position={[0, -0.01, 0]}>
      {/* Parques / Áreas verdes */}
      {parkMeshes}

      {/* Avenidas Principales */}
      {roadGeometries?.major && (
        <lineSegments geometry={roadGeometries.major}>
          <lineBasicMaterial color="#334155" linewidth={3.0} />
        </lineSegments>
      )}

      {/* Calles Secundarias */}
      {roadGeometries?.minor && (
        <lineSegments geometry={roadGeometries.minor}>
          <lineBasicMaterial color="#64748b" linewidth={1.8} />
        </lineSegments>
      )}

      {/* Veredas y Senderos */}
      {roadGeometries?.paths && (
        <lineSegments geometry={roadGeometries.paths}>
          <lineBasicMaterial color="#94a3b8" linewidth={1.0} opacity={0.6} transparent />
        </lineSegments>
      )}

      {/* Vías férreas */}
      {roadGeometries?.railways && (
        <lineSegments geometry={roadGeometries.railways}>
          <lineBasicMaterial color="#475569" linewidth={2.0} />
        </lineSegments>
      )}

      {/* Cuerpos de agua */}
      {roadGeometries?.water && (
        <lineSegments geometry={roadGeometries.water}>
          <lineBasicMaterial color="#0284c7" linewidth={2.5} />
        </lineSegments>
      )}

      {/* Manzanas y Edificios Vecinos en 3D */}
      {neighborBuildings}

      {/* ─── Etiquetas 3D Flotantes de Avenidas y Referencias ─── */}
      {cityData.labels?.map((label) => (
        <Html
          key={label.id}
          position={label.position}
          center
          distanceFactor={180}
          zIndexRange={[10, 40]}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              border: label.type === 'campus' ? '1.5px solid #e3000f' : '1px solid rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '6px 14px',
              backdropFilter: 'blur(12px)',
              boxShadow: label.type === 'campus' ? '0 8px 24px rgba(227, 0, 15, 0.25)' : '0 6px 20px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'default',
              userSelect: 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{label.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: label.type === 'campus' ? '#e3000f' : '#1e293b',
                  letterSpacing: '0.3px',
                }}
              >
                {label.name}
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.65rem',
                  color: '#64748b',
                }}
              >
                {label.subtitle}
              </span>
            </div>
          </div>
        </Html>
      ))}
    </group>
  )
}
