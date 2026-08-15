import { useState, useMemo, useRef, useEffect } from 'react'
import useAppStore from '../store/useAppStore'
import destinations from '../data/destinations'

export default function SearchUI() {
  const { phase, selectedDestination, setSelectedDestination, clearDestination } = useAppStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const isVisible = phase === 'interior'

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.floor.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    )
  }, [query])

  const handleSelect = (dest) => {
    setSelectedDestination(dest)
    setQuery(dest.name)
    setOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    clearDestination()
    setOpen(false)
  }

  if (!isVisible) return null

  return (
    <div className="search-ui" id="search-ui">
      <div className="search-header">
        <span className="search-label">¿A dónde vas?</span>
        <div className="search-input-row">
          <span className="search-icon">
            <img src="/busca1.png" alt="Buscar" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          </span>
          <input
            ref={inputRef}
            id="search-input"
            className="search-input"
            type="text"
            placeholder="Buscar oficina, laboratorio, sala..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              if (!e.target.value) clearDestination()
            }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button className="search-clear" onClick={handleClear} aria-label="Limpiar">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de resultados */}
      {open && results.length > 0 && (
        <div className="search-results" id="search-results">
          {results.map((dest) => (
            <div
              key={dest.id}
              id={`result-${dest.id}`}
              className={`search-result-item ${selectedDestination?.id === dest.id ? 'active' : ''}`}
              onClick={() => handleSelect(dest)}
            >
              <div
                className="result-icon"
                style={{
                  background: `${dest.color}18`,
                  border: `1px solid ${dest.color}40`,
                }}
              >
                {dest.icon}
              </div>
              <div className="result-info">
                <div className="result-name">{dest.name}</div>
                <div className="result-floor">{dest.floor} · {dest.description}</div>
              </div>
              <span className="result-arrow">›</span>
            </div>
          ))}
        </div>
      )}

      {/* Card del destino seleccionado */}
      {selectedDestination && !open && (
        <div className="destination-card" id="destination-card">
          <div
            className="dest-icon-big"
            style={{
              background: `${selectedDestination.color}15`,
              border: `1.5px solid ${selectedDestination.color}35`,
            }}
          >
            {selectedDestination.icon}
          </div>
          <div className="dest-details">
            <div className="dest-name">{selectedDestination.name}</div>
            <div className="dest-meta">{selectedDestination.floor} · {selectedDestination.description}</div>
          </div>
        </div>
      )}
    </div>
  )
}
