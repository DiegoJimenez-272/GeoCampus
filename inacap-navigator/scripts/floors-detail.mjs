/**
 * floors-detail.mjs — Análisis detallado de pisos con objetos únicos por piso
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GLB_PATH = path.join(__dirname, '../public/models/inacapestructura2.glb')

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const document = await io.read(GLB_PATH)
const root = document.getRoot()

// Rangos de Y reales detectados del modelo
const FLOORS = [
  { name: 'Planta Baja', yMin: -0.5,  yMax: 2.5  },
  { name: 'Piso 1',      yMin: 2.5,   yMax: 5.0  },
  { name: 'Piso 2',      yMin: 5.0,   yMax: 7.5  },
  { name: 'Piso 3',      yMin: 7.5,   yMax: 10.0 },
  { name: 'Piso 4',      yMin: 10.0,  yMax: 12.5 },
  { name: 'Piso 5',      yMin: 12.5,  yMax: 14.0 },
  { name: 'Piso 6',      yMin: 14.0,  yMax: 16.0 },
  { name: 'Techo/Cubierta', yMin: 16.0, yMax: 20.0 },
]

// Recopilar todos los nodos con mesh
const allNodes = []
for (const node of root.listNodes()) {
  if (node.getMesh()) {
    const [x, y, z] = node.getTranslation()
    allNodes.push({ name: node.getName(), x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) })
  }
}

// Extraer nombre base (sin el sufijo .001, .002, etc.)
const baseName = (name) => name.replace(/\.\d+$/, '').trim()

// Agrupar objetos únicos por piso
console.log('\n🏢 PISOS IDENTIFICADOS EN inacapestructura2.glb')
console.log('═'.repeat(65))
console.log(`  Altura real del edificio: ~${Math.max(...allNodes.map(n=>n.y)).toFixed(1)} unidades Blender`)
console.log(`  Total de objetos: ${allNodes.length}`)
console.log()

for (const floor of FLOORS) {
  const nodes = allNodes.filter(n => n.y >= floor.yMin && n.y < floor.yMax)
  if (nodes.length === 0) continue

  // Obtener tipos únicos de objetos
  const uniqueTypes = [...new Set(nodes.map(n => baseName(n.name)))]
    .filter(n => n && n !== 'Cube') // filtrar genéricos
    .sort()

  // Obtener Cubes (genéricos — probablemente paredes/estructura)
  const cubeCount = nodes.filter(n => n.name.startsWith('Cube')).length

  const yMin = Math.min(...nodes.map(n => n.y)).toFixed(2)
  const yMax = Math.max(...nodes.map(n => n.y)).toFixed(2)

  console.log(`📐 ${floor.name.toUpperCase()}`)
  console.log(`   Rango Y: ${yMin} → ${yMax} | Objetos totales: ${nodes.length}`)

  if (uniqueTypes.length > 0) {
    console.log(`   Mobiliario/Elementos identificados:`)
    for (const t of uniqueTypes.slice(0, 25)) {
      const count = nodes.filter(n => baseName(n.name) === t).length
      const countStr = count > 1 ? ` ×${count}` : ''
      console.log(`     • ${t}${countStr}`)
    }
    if (uniqueTypes.length > 25) console.log(`     ... y ${uniqueTypes.length - 25} tipos más`)
  }
  if (cubeCount > 0) {
    console.log(`   Estructura (Cube/paredes genéricas): ${cubeCount} objetos`)
  }
  console.log()
}

// Espacios detectados por nombre de objeto
console.log('─'.repeat(65))
console.log('🚪 ESPACIOS/SALAS DETECTADAS POR NOMBRE:')
const roomKeywords = {
  'Biblioteca':    ['biblioteca', 'biblio'],
  'Aula/Sala':     ['sala', 'aula', 'TD', 'fab'],
  'Escalera':      ['escalera', 'escaler'],
  'Ascensor':      ['asensor', 'ascensor', 'elevador'],
  'Pizarra':       ['pizarra'],
  'Ventana':       ['ventana', 'vidrio'],
  'Puerta':        ['puerta'],
  'Silla':         ['silla'],
  'Mesa':          ['mesa'],
  'Muro/Pared':    ['muro', 'pared', 'wall'],
  'Sillón':        ['sillon', 'sillón'],
  'Mueble':        ['mueble'],
  'INACAP Sign':   ['INACAP'],
  'Techo':         ['techo', 'TECHO'],
}

for (const [room, keywords] of Object.entries(roomKeywords)) {
  const matches = allNodes.filter(n =>
    keywords.some(kw => n.name.toLowerCase().includes(kw.toLowerCase()))
  )
  if (matches.length > 0) {
    const yVals = matches.map(n => n.y)
    const yRange = `Y: ${Math.min(...yVals).toFixed(1)} → ${Math.max(...yVals).toFixed(1)}`
    console.log(`  ${room.padEnd(20)} ${String(matches.length).padStart(4)} objetos   ${yRange}`)
  }
}
