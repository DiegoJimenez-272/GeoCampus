/**
 * inspect-glb.mjs
 * Analiza el archivo inacapestructura2.glb y detecta:
 *  - Todos los nodos/meshes con sus nombres y posiciones
 *  - Agrupación por altura Y (detección de pisos)
 *  - Bounding box del modelo completo
 */

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GLB_PATH = path.join(__dirname, '../public/models/inacapestructura2.glb')

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

console.log('📂 Cargando:', GLB_PATH)
console.log('─'.repeat(60))

const document = await io.read(GLB_PATH)
const root = document.getRoot()

const meshNames = []
const nodeData = []

// Recorrer todos los nodos del documento
for (const scene of root.listScenes()) {
  const traverse = (node, depth = 0) => {
    const name = node.getName() || '(sin nombre)'
    const translation = node.getTranslation() // [x, y, z]
    const scale = node.getScale()
    const mesh = node.getMesh()

    const entry = {
      depth,
      name,
      x: +translation[0].toFixed(3),
      y: +translation[1].toFixed(3),
      z: +translation[2].toFixed(3),
      hasMesh: !!mesh,
      primitives: mesh ? mesh.listPrimitives().length : 0,
    }
    nodeData.push(entry)

    for (const child of node.listChildren()) {
      traverse(child, depth + 1)
    }
  }

  for (const child of scene.listChildren()) {
    traverse(child)
  }
}

// ── Mostrar árbol de nodos ────────────────────────────────
console.log('\n🌳 ÁRBOL DE NODOS DEL MODELO')
console.log('─'.repeat(60))
for (const n of nodeData) {
  const indent = '  '.repeat(n.depth)
  const meshInfo = n.hasMesh ? `[MESH×${n.primitives}]` : '[group]'
  const pos = `pos(${n.x}, ${n.y}, ${n.z})`
  console.log(`${indent}• ${n.name.padEnd(35)} ${meshInfo.padEnd(12)} ${pos}`)
}

// ── Detección automática de pisos por altura Y ────────────
console.log('\n\n🏢 DETECCIÓN DE PISOS (agrupación por Y)')
console.log('─'.repeat(60))

const meshNodes = nodeData.filter(n => n.hasMesh)

if (meshNodes.length === 0) {
  console.log('⚠️  No se encontraron meshes con posición. Los meshes pueden estar embebidos en nodos padre.')
} else {
  // Agrupar por rangos de Y (cada 2 unidades = 1 piso estimado)
  const FLOOR_HEIGHT = 2.5
  const floorMap = {}

  for (const n of meshNodes) {
    const floorIndex = Math.round(n.y / FLOOR_HEIGHT)
    if (!floorMap[floorIndex]) floorMap[floorIndex] = []
    floorMap[floorIndex].push(n)
  }

  const floors = Object.entries(floorMap).sort(([a], [b]) => Number(a) - Number(b))
  for (const [floorIdx, nodes] of floors) {
    const yVals = nodes.map(n => n.y)
    const yMin = Math.min(...yVals).toFixed(2)
    const yMax = Math.max(...yVals).toFixed(2)
    const label = Number(floorIdx) === 0 ? 'Planta Baja' :
                  Number(floorIdx) < 0  ? `Sótano ${Math.abs(Number(floorIdx))}` :
                                          `Piso ${floorIdx}`
    console.log(`\n  📐 ${label} (Y: ${yMin} → ${yMax})`)
    for (const n of nodes) {
      console.log(`     - ${n.name} (y=${n.y})`)
    }
  }
}

// ── Resumen general ───────────────────────────────────────
console.log('\n\n📊 RESUMEN')
console.log('─'.repeat(60))
console.log(`  Total nodos:          ${nodeData.length}`)
console.log(`  Nodos con mesh:       ${nodeData.filter(n => n.hasMesh).length}`)
console.log(`  Nodos de grupo:       ${nodeData.filter(n => !n.hasMesh).length}`)
console.log(`  Profundidad máxima:   ${Math.max(...nodeData.map(n => n.depth))}`)

const allNames = nodeData.map(n => n.name.toLowerCase())
console.log(`\n  🔍 Palabras clave detectadas:`)
const keywords = ['piso', 'floor', 'planta', 'nivel', 'navmesh', 'wall', 'door', 'window', 'roof', 'ground', 'exterior', 'interior']
for (const kw of keywords) {
  const matches = allNames.filter(n => n.includes(kw))
  if (matches.length > 0) console.log(`     "${kw}": ${matches.length} nodos`)
}
