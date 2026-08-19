import { create } from 'zustand'
import * as THREE from 'three'

const useAppStore = create((set, get) => ({
  // ─── Fases: 'loading' | 'interior'
  phase: 'loading',
  setPhase: (phase) => set({ phase }),

  // ─── Progreso de carga
  loadingProgress: 0,
  setLoadingProgress: (p) => set({ loadingProgress: p }),

  // ─── Piso seleccionado (null = Ver Todo, 0 = PB, 1 = Piso 1, etc.)
  selectedFloor: null,
  setSelectedFloor: (floor) => {
    set({ selectedFloor: floor })
    // Al cambiar de piso, limpiar la oficina seleccionada si no pertenece a este piso
    const dest = get().selectedDestination
    if (dest && floor !== null && dest.floorId !== floor) {
      set({ selectedDestination: null })
    }
  },

  // ─── Destino seleccionado (oficina/sala)
  selectedDestination: null,
  setSelectedDestination: (dest) => {
    set({ selectedDestination: dest })
    if (dest && dest.floorId !== undefined) {
      set({ selectedFloor: dest.floorId })
    }
  },
  clearDestination: () => set({ selectedDestination: null }),

  // ─── Vista: 'exterior' (orbita girando) | 'interior' (dentro del edificio)
  viewMode: 'exterior',
  enterBuilding: () => set({ viewMode: 'interior' }),
  exitBuilding: () => set({ viewMode: 'exterior', selectedFloor: null, selectedDestination: null }),

  // ─── Auto-rotación
  autoRotateEnabled: true,
  toggleAutoRotate: () => set((s) => ({ autoRotateEnabled: !s.autoRotateEnabled })),

  // ─── Coordenadas por defecto para la cámara (perspectiva 3/4 arquitectónica)
  cameraEntry: new THREE.Vector3(55, 28, 65),
  cameraFocusPoint: new THREE.Vector3(0, 3, 0),
}))

export default useAppStore
