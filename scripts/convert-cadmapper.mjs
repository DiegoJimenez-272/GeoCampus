import fs from 'fs';
import path from 'path';

const dxfPath = 'cadmapper-los-angeles-biobio-cl/cadmapper-los-angeles-biobio-cl/cadmapper-los-angeles-biobio-cl.dxf';
const outputPath = 'public/models/city_environment.json';

const dxfText = fs.readFileSync(dxfPath, 'utf8');
const lines = dxfText.split(/\r?\n/);

let inEntities = false;
let currentEntity = null;
const entities = [];

let i = 0;
while (i < lines.length) {
  const code = lines[i].trim();
  const val = lines[i+1] ? lines[i+1].trim() : '';

  if (code === '2' && val === 'ENTITIES') {
    inEntities = true;
    i += 2;
    continue;
  }
  if (inEntities && code === '0' && val === 'ENDSEC') {
    inEntities = false;
    break;
  }

  if (inEntities && code === '0') {
    if (currentEntity) entities.push(currentEntity);
    currentEntity = { type: val, layer: '0', vertices: [], closed: false };
    i += 2;
    continue;
  }

  if (inEntities && currentEntity) {
    if (code === '8') {
      currentEntity.layer = val;
    } else if (code === '70') {
      currentEntity.closed = (parseInt(val) & 1) === 1;
    } else if (code === '10') {
      currentEntity._lastX = parseFloat(val);
    } else if (code === '20') {
      currentEntity._lastY = parseFloat(val);
      if (currentEntity.type === 'LWPOLYLINE') {
        currentEntity.vertices.push([currentEntity._lastX, currentEntity._lastY, 0]);
      }
    } else if (code === '30') {
      currentEntity._lastZ = parseFloat(val);
      if (currentEntity.type === 'MESH') {
        currentEntity.vertices.push([currentEntity._lastX, currentEntity._lastY, currentEntity._lastZ]);
      }
    }
  }

  i += 2;
}
if (currentEntity) entities.push(currentEntity);

// Centro exacto del edificio INACAP dentro de CADmapper
// (Detectado en la manzana de 110m x 35m entre Av. 21 de Mayo y Ricardo Vicuña)
const INACAP_CENTER_X = 64.4;
const INACAP_CENTER_Y = 189.4 - 99.45; // Relativo al centro Y original

// Transformar a coordenadas Three.js relativas al centro del edificio INACAP (0,0,0)
const layers = {
  buildings: [],
  major_roads: [],
  minor_roads: [],
  paths: [],
  parks: [],
  water: [],
  railways: []
};

// Offset global para que INACAP quede exactamente en (0, 0, 0)
const offsetX = 171.02 + INACAP_CENTER_X; // 235.42
const offsetY = 189.40 - 99.45; // 89.95

// Coordenadas fijas de referencia
entities.forEach((e, idx) => {
  if (e.vertices.length < 2) return;

  const threeVerts = e.vertices.map(v => [
    +(v[0] - 235.42).toFixed(3),
    +(v[2] || 0).toFixed(3),
    +(-(v[1] - 89.95)).toFixed(3)
  ]);

  // Si es el edificio de INACAP (la huella gigante de >80m), no lo dibujamos como bloque genérico
  // porque ya tenemos nuestro modelo 3D detallado inacapestructura2.glb en esa posición!
  if (e.layer === 'buildings') {
    let minX = Infinity, maxX = -Infinity;
    threeVerts.forEach(pt => {
      if (pt[0] < minX) minX = pt[0];
      if (pt[0] > maxX) maxX = pt[0];
    });
    if ((maxX - minX) > 50) {
      // Es la huella de INACAP o Jumbo, la omitimos del bloque genérico
      return;
    }
  }

  const targetLayer = layers[e.layer] || layers.minor_roads;
  targetLayer.push({
    type: e.type,
    closed: e.closed,
    points: threeVerts
  });
});

const output = {
  bounds: {
    width: 341.82,
    height: 378.79
  },
  layers,
  // Puntos de referencia y etiquetas urbanas con sus coordenadas exactas en la escena
  labels: [
    {
      id: 'ricardo-vicuna',
      name: 'Av. Ricardo Vicuña',
      subtitle: 'Parque & Eje Principal Sur',
      type: 'avenue',
      position: [0, 1.2, 55],
      icon: '🛣️'
    },
    {
      id: '21-de-mayo',
      name: 'Av. 21 de Mayo',
      subtitle: 'Acceso Norte',
      type: 'avenue',
      position: [10, 1.2, -50],
      icon: '🛣️'
    },
    {
      id: 'calle-urenda',
      name: 'Calle Urenda',
      subtitle: 'Acceso Oeste',
      type: 'street',
      position: [-85, 1.2, 0],
      icon: '📍'
    },
    {
      id: 'laguna-esmeralda',
      name: 'Laguna Esmeralda',
      subtitle: 'Parque Urbano',
      type: 'park',
      position: [-145, 1.2, -85],
      icon: '🌳'
    },
    {
      id: 'jumbo',
      name: 'Sector Jumbo',
      subtitle: 'Centro Comercial',
      type: 'commercial',
      position: [95, 1.2, 5],
      icon: '🛒'
    },
    {
      id: 'inacap-main',
      name: 'INACAP Sede Los Ángeles',
      subtitle: 'Campus Principal',
      type: 'campus',
      position: [0, 18, 0],
      icon: '🎓'
    }
  ]
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('✅ Entorno urbano re-alineado y centrado en INACAP!');
