import useAppStore from '../store/useAppStore'
import destinations from '../data/destinations'

const FLOORS = [
  { id: null, name: '3D',   desc: 'Ver Todo' },
  { id: 3,    name: 'P3',   desc: 'Piso 3' },
  { id: 2,    name: 'P2',   desc: 'Piso 2' },
  { id: 1,    name: 'P1',   desc: 'Piso 1' },
  { id: 0,    name: 'SUB',  desc: 'Subterráneo' },
]

export default function FloorSelector() {
  const { selectedFloor, setSelectedFloor, phase } = useAppStore()

  if (phase === 'loading') return null

  const getRoomCount = (floorId) => {
    if (floorId === null) return destinations.length
    return destinations.filter(d => d.floorId === floorId).length
  }

  return (
    <div className="floor-selector-container" id="floor-selector">
      <div className="floor-selector-title">NIVEL</div>
      <div className="floor-selector-list">
        {FLOORS.map((floor) => {
          const isActive = selectedFloor === floor.id
          const count = getRoomCount(floor.id)

          return (
            <button
              key={floor.id === null ? 'all' : floor.id}
              className={`floor-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedFloor(floor.id)}
              title={floor.desc}
            >
              <span className="floor-btn-name">{floor.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
