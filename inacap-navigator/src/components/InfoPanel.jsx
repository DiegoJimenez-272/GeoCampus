import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import destinations from '../data/destinations'

export default function InfoPanel() {
  const {
    phase,
    selectedFloor,
    setSelectedFloor,
    selectedDestination,
    setSelectedDestination,
    clearDestination
  } = useAppStore()

  // Obtener salas del piso actual para el listado del panel
  const floorRooms = useMemo(() => {
    if (selectedFloor === null) return []
    return destinations.filter((d) => d.floorId === selectedFloor)
  }, [selectedFloor])

  // Estadísticas del piso seleccionado
  const floorStats = useMemo(() => {
    if (selectedFloor === null) return null
    const rooms = destinations.filter((d) => d.floorId === selectedFloor)
    const totalCapacity = rooms.reduce((acc, r) => {
      const capVal = parseInt(r.capacity) || 0
      return acc + capVal
    }, 0)
    return {
      count: rooms.length,
      capacity: totalCapacity > 0 ? `${totalCapacity} pers.` : 'N/D',
      categories: [...new Set(rooms.map((r) => r.category))].join(', ') || 'Aulas/Estructura'
    }
  }, [selectedFloor])

  const handleSelect = (dest) => {
    setSelectedDestination(dest)
  }

  const floorNames = {
    0: 'Subterráneo',
    1: 'Piso 1',
    2: 'Piso 2',
    3: 'Piso 3',
  }

  if (phase === 'loading') return null

  return (
    <div className="info-panel-container">

      {/* ── Ficha Técnica de Información Lateral ──────────────── */}
      {selectedDestination && (
        <div className="sidebar-card">
          <div className="detail-view animate-fade">
            <div className="detail-header">
              <button className="back-link-btn" onClick={clearDestination}>
                ← Volver al Piso
              </button>
              <div className="detail-title-row">
                <span className="detail-icon-bg" style={{ background: `${selectedDestination.color}15`, border: `1.5px solid ${selectedDestination.color}30` }}>
                  {selectedDestination.icon}
                </span>
                <div>
                  <h2 className="detail-title">{selectedDestination.name}</h2>
                  <span className="detail-subtitle">{selectedDestination.floor}</span>
                </div>
              </div>
            </div>

            <div className="detail-body">
              <div className="specs-grid">
                <div className="spec-card">
                  <span className="spec-label">Categoría</span>
                  <span className="spec-val">{selectedDestination.category}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Capacidad</span>
                  <span className="spec-val">{selectedDestination.capacity}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Superficie</span>
                  <span className="spec-val">{selectedDestination.area}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Ubicación</span>
                  <span className="spec-val">{selectedDestination.floor}</span>
                </div>
              </div>

              <div className="description-section">
                <h3 className="section-title">Descripción</h3>
                <p className="description-text">{selectedDestination.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
